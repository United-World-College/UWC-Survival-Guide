const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db, FieldValue, getBucket, LANG_MAP } = require("./lib/config");
const { assertAuth, assertAdmin } = require("./lib/auth");
const {
  makeSlug, getOrderedSubmissionAuthors, sanitizeRevisionHistory,
  withoutPublicActorFields, generateMarkdown,
} = require("./lib/helpers");
const { getGitHubToken, githubApi, batchCommitFiles, ensureAuthorPresenceOnGitHub } = require("./lib/github");
const {
  appendSubmissionAuditEvent, resolveSubmissionAuthors,
  ensureUniqueGuideSlug, ensureAuthorId,
} = require("./lib/firestore");
const { getGeminiKey, translateMissingVariants } = require("./lib/translation");
const {
  uploadToR2, deleteFromR2, deleteMultipleFromR2,
  R2_ALLOWED_TYPES, R2_MAX_SIZE,
} = require("./lib/r2");

// ══════════════════════════════════════
// 0. checkAdminStatus
// ══════════════════════════════════════

exports.checkAdminStatus = onCall(async (request) => {
  assertAuth(request.auth);
  const { getAdminEmails } = require("./lib/auth");
  const email = request.auth.token.email;
  const verified = request.auth.token.email_verified === true;
  const adminEmails = await getAdminEmails();
  return { isAdmin: verified && adminEmails.includes(email) };
});

// ══════════════════════════════════════
// 1. submitArticle
// ══════════════════════════════════════

exports.submitArticle = onCall(async (request) => {
  assertAuth(request.auth);
  const { title, category, language, description, content, authorName, coAuthors } = request.data;
  if (!title || !category || !language || !description || !content || !authorName) {
    throw new HttpsError("invalid-argument", "All content fields are required.");
  }

  const guideId = await ensureUniqueGuideSlug(makeSlug(title));
  const coAuthorList = Array.isArray(coAuthors) ? coAuthors : [];
  const uids = coAuthorList.map((c) => c.uid).filter(Boolean);

  const ref = await db.collection("submissions").add({
    uid: request.auth.uid,
    authorName,
    title,
    category,
    language,
    description,
    content,
    status: "pending",
    guide_id: guideId,
    createdAt: FieldValue.serverTimestamp(),
    coAuthors: coAuthorList,
    ...(uids.length > 0 ? { coauthorUids: uids } : {}),
  });

  await appendSubmissionAuditEvent(ref.id, "submitted", request.auth, {
    guideId,
  });

  return { success: true, docId: ref.id, guideId };
});

// ══════════════════════════════════════
// 2. resubmitArticle
// ══════════════════════════════════════

exports.resubmitArticle = onCall(async (request) => {
  assertAuth(request.auth);
  const { docId, title, category, language, description, content, authorMessage } = request.data;
  if (!docId || !title || !category || !language || !description || !content) {
    throw new HttpsError("invalid-argument", "All content fields are required.");
  }

  const ref = db.collection("submissions").doc(docId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Submission not found.");
  const data = snap.data();

  const isOwner = data.uid === request.auth.uid;
  const isCoauthor = data.coauthorUids && data.coauthorUids.includes(request.auth.uid);
  if (!isOwner && !isCoauthor) {
    throw new HttpsError("permission-denied", "You can only resubmit your own articles.");
  }
  if (data.status !== "revise_resubmit") {
    throw new HttpsError("failed-precondition", "This submission is not awaiting revision.");
  }

  const history = sanitizeRevisionHistory(data.revisionHistory);
  if (history.length > 0 && !history[history.length - 1].resubmittedAt) {
    history[history.length - 1].authorMessage = authorMessage || null;
    history[history.length - 1].resubmittedAt = new Date().toISOString();
  }

  const update = withoutPublicActorFields({
    title, category, language, description, content,
    status: "pending",
    updatedAt: FieldValue.serverTimestamp(),
    revisionHistory: history,
    approveMessage: FieldValue.delete(),
    rejectionReason: FieldValue.delete(),
  });
  if (authorMessage) {
    update.authorMessage = authorMessage;
  } else {
    update.authorMessage = FieldValue.delete();
  }
  await ref.update(update);
  await appendSubmissionAuditEvent(docId, "resubmitted", request.auth, {
    authorMessage: authorMessage || null,
    round: history.length ? history[history.length - 1].round : null,
  });

  return { success: true };
});

// ══════════════════════════════════════
// 3. approveSubmission
// ══════════════════════════════════════

exports.approveSubmission = onCall(async (request) => {
  await assertAdmin(request.auth);
  const { docId, approveMessage } = request.data;
  if (!docId) throw new HttpsError("invalid-argument", "docId is required.");

  const ref = db.collection("submissions").doc(docId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Submission not found.");
  const d = snap.data();

  if (d.status !== "pending" && d.status !== "revise_resubmit") {
    throw new HttpsError("failed-precondition", "Cannot approve in current state.");
  }

  const authors = await resolveSubmissionAuthors(d);
  const primaryAuthor = authors[0];
  const authorSlug = primaryAuthor.author_id;

  const adminDoc = await db.collection("users").doc(request.auth.uid).get();
  const editorName = adminDoc.exists ? adminDoc.data().displayName || "" : "";

  const uniqueSlug = d.guide_id || await ensureUniqueGuideSlug(makeSlug(d.title), docId);
  const { markdown, slug, fileName, folder, filePath } = generateMarkdown(d, authors, editorName, uniqueSlug);

  const token = await getGitHubToken();
  if (!token) {
    throw new HttpsError("internal", "GitHub token not configured.");
  }

  // Collect all files to commit in a single batch
  const filesToCommit = [{ path: filePath, content: markdown }];

  // Auto-translate into missing language variants
  let translationResults = null;
  const geminiKey = await getGeminiKey();
  if (geminiKey) {
    try {
      translationResults = await translateMissingVariants(
        geminiKey, d, slug, authors, editorName
      );
      for (const r of translationResults) {
        if (r.success) {
          filesToCommit.push({ path: r.filePath, content: r.markdown });
        }
      }
    } catch (err) {
      translationResults = [{ error: err.message, success: false }];
    }
  }

  // Batch commit all guide files (source + translations) in one commit
  let published = false;
  let githubError = null;
  try {
    await batchCommitFiles(token, filesToCommit, `Add guide: ${d.title} by ${primaryAuthor.name}`);
    published = true;
  } catch (err) {
    githubError = err.message;
  }

  if (!published) {
    throw new HttpsError("internal",
      "Article could not be published to GitHub" + (githubError ? ": " + githubError : "") +
      ". Status unchanged.");
  }

  const updateData = withoutPublicActorFields({
    status: "approved",
    guide_id: slug,
    reviewedAt: FieldValue.serverTimestamp(),
    revisionHistory: sanitizeRevisionHistory(d.revisionHistory),
    rejectionReason: FieldValue.delete(),
  });
  if (approveMessage) updateData.approveMessage = approveMessage;
  await ref.update(updateData);
  await appendSubmissionAuditEvent(docId, "approved", request.auth, {
    approveMessage: approveMessage || null,
    guideId: slug,
  });

  await Promise.all(authors.map(async (author) => {
    if (!author.uid) return;
    await ensureAuthorId(author.uid, author.author_id);
  }));

  // Ensure author pages exist (separate commits — these are idempotent)
  try {
    await ensureAuthorPresenceOnGitHub(token, { ...primaryAuthor, author_id: authorSlug });
    if (authors.length > 1) {
      await Promise.all(authors.slice(1).map((author) => ensureAuthorPresenceOnGitHub(token, author)));
    }
  } catch (_) { /* non-fatal */ }

  if (translationResults && translationResults.length > 0) {
    // Store translated metadata for multi-language display (author pages, etc.)
    const translations = {};
    translationResults.forEach((r) => {
      if (r.success && r.lang) {
        translations[r.lang] = { title: r.title, category: r.category, description: r.description };
      }
    });
    // Also include the source language
    translations[d.language || "en"] = { title: d.title, category: d.category, description: d.description };
    await ref.update({ translationResults, translations });
  }

  return {
    success: true,
    published,
    githubError,
    markdown,
    filePath,
    fileName,
    folder,
    authorSlug,
    authorName: primaryAuthor.name,
    authors,
    slug,
    translationResults,
  };
});

// ══════════════════════════════════════
// 4. rejectSubmission
// ══════════════════════════════════════

exports.rejectSubmission = onCall(async (request) => {
  await assertAdmin(request.auth);
  const { docId, reason } = request.data;
  if (!docId) throw new HttpsError("invalid-argument", "docId is required.");
  if (!reason) throw new HttpsError("invalid-argument", "Rejection reason is required.");

  const ref = db.collection("submissions").doc(docId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Submission not found.");
  const d = snap.data();

  await ref.update(withoutPublicActorFields({
    status: "rejected",
    rejectionReason: reason,
    reviewedAt: FieldValue.serverTimestamp(),
    revisionHistory: sanitizeRevisionHistory(d.revisionHistory),
    approveMessage: FieldValue.delete(),
  }));
  await appendSubmissionAuditEvent(docId, "rejected", request.auth, {
    rejectionReason: reason,
  });

  return { success: true };
});

// ══════════════════════════════════════
// 5. requestRevision
// ══════════════════════════════════════

exports.requestRevision = onCall(async (request) => {
  await assertAdmin(request.auth);
  const { docId, comments } = request.data;
  if (!docId) throw new HttpsError("invalid-argument", "docId is required.");
  if (!comments) throw new HttpsError("invalid-argument", "Reviewer comments are required.");

  const ref = db.collection("submissions").doc(docId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Submission not found.");
  const d = snap.data();

  const history = sanitizeRevisionHistory(d.revisionHistory);
  history.push({
    round: history.length + 1,
    reviewerComments: comments,
    reviewedAt: new Date().toISOString(),
    contentSnapshot: {
      title: d.title,
      category: d.category,
      language: d.language,
      description: d.description,
      content: d.content,
    },
  });

  await ref.update(withoutPublicActorFields({
    status: "revise_resubmit",
    reviewerComments: comments,
    reviewedAt: FieldValue.serverTimestamp(),
    revisionHistory: history,
    approveMessage: FieldValue.delete(),
    rejectionReason: FieldValue.delete(),
  }));
  await appendSubmissionAuditEvent(docId, "revision_requested", request.auth, {
    reviewerComments: comments,
    round: history[history.length - 1].round,
  });

  return { success: true, revisionHistory: history };
});

// ══════════════════════════════════════
// 6. deleteSubmission
// ══════════════════════════════════════

exports.deleteSubmission = onCall(async (request) => {
  await assertAdmin(request.auth);
  const { docId } = request.data;
  if (!docId) throw new HttpsError("invalid-argument", "docId is required.");

  const ref = db.collection("submissions").doc(docId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Submission not found.");
  const d = snap.data();

  // If approved, clean up the author record and GitHub file
  if (d.status === "approved" && d.guide_id) {
    const seenUids = new Set();
    const uidsToClean = [];
    getOrderedSubmissionAuthors(d).forEach((author) => {
      if (!author.uid || seenUids.has(author.uid)) return;
      seenUids.add(author.uid);
      uidsToClean.push(author.uid);
    });
    if (d.uid && !seenUids.has(d.uid)) {
      uidsToClean.push(d.uid);
    }
    // Clean up featuredGuideIds (user preference) for all related authors
    await Promise.all(uidsToClean.map(async (cleanUid) => {
      if (!cleanUid) return;
      const userDoc = await db.collection("users").doc(cleanUid).get();
      if (userDoc.exists) {
        const featured = userDoc.data().featuredGuideIds || [];
        const filteredFeatured = featured.filter((id) => id !== d.guide_id);
        if (filteredFeatured.length !== featured.length) {
          await db.collection("users").doc(cleanUid).update({ featuredGuideIds: filteredFeatured });
        }
      }
    }));

    // Delete from GitHub
    const token = await getGitHubToken();
    if (token) {
      const lang = d.language || "en";
      const langInfo = LANG_MAP[lang] || LANG_MAP["en"];
      const fileName = d.guide_id + langInfo.suffix + ".md";
      const gPath = "website/_guides/" + langInfo.folder + "/" + fileName;
      try {
        const existing = await githubApi("GET", gPath, token);
        if (existing) {
          await githubApi("DELETE", gPath, token, {
            message: "Delete guide: " + d.title,
            sha: existing.sha,
          });
        }
      } catch (err) {
        // Log but don't block deletion
      }
    }
  }

  // Clean up R2 images (if any)
  try {
    const imagesSnap = await ref.collection("images").get();
    if (!imagesSnap.empty) {
      const keys = imagesSnap.docs.map((imgDoc) => imgDoc.data().key).filter(Boolean);
      await deleteMultipleFromR2(keys);
      await Promise.all(imagesSnap.docs.map((imgDoc) => imgDoc.ref.delete()));
    }
  } catch (_) { /* non-fatal: log but don't block deletion */ }

  await appendSubmissionAuditEvent(docId, "deleted", request.auth, {
    status: d.status || null,
    guideId: d.guide_id || null,
    language: d.language || null,
    title: d.title || null,
  });
  await ref.delete();

  return {
    success: true,
    guideId: d.guide_id || null,
    language: d.language || null,
    wasApproved: d.status === "approved",
  };
});

// ══════════════════════════════════════
// 7. uploadArticleImage
// ══════════════════════════════════════

function sanitizeFileName(name) {
  return name
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .slice(-80);
}

exports.uploadArticleImage = onCall(async (request) => {
  assertAuth(request.auth);
  const { docId, imageData, fileName, contentType } = request.data;
  if (!docId || !imageData || !fileName || !contentType) {
    throw new HttpsError("invalid-argument", "docId, imageData, fileName, and contentType are required.");
  }
  if (!R2_ALLOWED_TYPES.includes(contentType)) {
    throw new HttpsError("invalid-argument", "Unsupported image type. Allowed: " + R2_ALLOWED_TYPES.join(", "));
  }

  const buffer = Buffer.from(imageData, "base64");
  if (buffer.length > R2_MAX_SIZE) {
    throw new HttpsError("invalid-argument", "Image exceeds 5 MB limit.");
  }

  const ref = db.collection("submissions").doc(docId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Submission not found.");
  const d = snap.data();

  const isOwner = d.uid === request.auth.uid;
  const isCoauthor = d.coauthorUids && d.coauthorUids.includes(request.auth.uid);
  if (!isOwner && !isCoauthor) {
    throw new HttpsError("permission-denied", "You can only upload images for your own submissions.");
  }
  if (d.status !== "pending" && d.status !== "revise_resubmit") {
    throw new HttpsError("failed-precondition", "Cannot upload images in current state.");
  }

  const rand = require("crypto").randomBytes(4).toString("hex");
  const sanitized = sanitizeFileName(fileName);
  const key = `guides/${d.guide_id}/${Date.now()}-${rand}-${sanitized}`;

  const url = await uploadToR2(key, buffer, contentType);

  const imageRef = await ref.collection("images").add({
    key,
    fileName,
    contentType,
    size: buffer.length,
    uid: request.auth.uid,
    url,
    uploadedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, url, key, imageDocId: imageRef.id };
});

// ══════════════════════════════════════
// 8. deleteArticleImage
// ══════════════════════════════════════

exports.deleteArticleImage = onCall(async (request) => {
  assertAuth(request.auth);
  const { docId, imageDocId } = request.data;
  if (!docId || !imageDocId) {
    throw new HttpsError("invalid-argument", "docId and imageDocId are required.");
  }

  const ref = db.collection("submissions").doc(docId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Submission not found.");
  const d = snap.data();

  const isOwner = d.uid === request.auth.uid;
  const isCoauthor = d.coauthorUids && d.coauthorUids.includes(request.auth.uid);
  let isAdmin = false;
  if (!isOwner && !isCoauthor) {
    const { getAdminEmails } = require("./lib/auth");
    const email = request.auth.token.email;
    const verified = request.auth.token.email_verified === true;
    const adminEmails = await getAdminEmails();
    isAdmin = verified && adminEmails.includes(email);
    if (!isAdmin) {
      throw new HttpsError("permission-denied", "Not authorized to delete this image.");
    }
  }

  const imageRef = ref.collection("images").doc(imageDocId);
  const imageSnap = await imageRef.get();
  if (!imageSnap.exists) throw new HttpsError("not-found", "Image not found.");

  await deleteFromR2(imageSnap.data().key);
  await imageRef.delete();

  return { success: true };
});

// ══════════════════════════════════════
// 9. getServiceUsage
// ══════════════════════════════════════

let _usageCache = null;
let _usageCacheTime = 0;
const USAGE_CACHE_TTL = 5 * 60 * 1000; // 5 min

exports.getServiceUsage = onCall(async (request) => {
  await assertAdmin(request.auth);

  const now = Date.now();
  if (_usageCache && !request.data.forceRefresh && now - _usageCacheTime < USAGE_CACHE_TTL) {
    return _usageCache;
  }

  const { GoogleAuth } = require("google-auth-library");
  const gauth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/monitoring.read"] });
  const gclient = await gauth.getClient();
  const proj = "projects/uwc-survival-guide";
  const monitorUrl = `https://monitoring.googleapis.com/v3/${proj}/timeSeries`;

  const endTime = new Date();
  const startTime1d = new Date(endTime - 24 * 60 * 60 * 1000);
  const startTime7d = new Date(endTime - 7 * 24 * 60 * 60 * 1000);
  const startTime30d = new Date(endTime - 30 * 24 * 60 * 60 * 1000);
  const currentMonth = endTime.toISOString().slice(0, 7);

  async function queryMetric(metricType, startTime, aligner, crossAligner) {
    const params = {
      filter: `metric.type = "${metricType}"`,
      "interval.startTime": startTime.toISOString(),
      "interval.endTime": endTime.toISOString(),
      "aggregation.alignmentPeriod": "86400s",
      "aggregation.perSeriesAligner": aligner || "ALIGN_SUM",
    };
    if (crossAligner) {
      params["aggregation.crossSeriesReducer"] = crossAligner;
    }
    const res = await gclient.request({ url: monitorUrl, params });
    return res.data.timeSeries || [];
  }

  function sumPoints(seriesList) {
    let total = 0;
    for (const ts of seriesList) {
      for (const p of ts.points || []) {
        total += parseInt(p.value.int64Value || "0", 10) + parseFloat(p.value.doubleValue || 0);
      }
    }
    return Math.round(total);
  }

  function latestValue(seriesList) {
    for (const ts of seriesList) {
      if (ts.points && ts.points.length > 0) {
        const v = ts.points[0].value;
        return parseFloat(v.doubleValue || v.int64Value || "0");
      }
    }
    return 0;
  }

  const collections = ["users", "submissions", "submissionAudit", "config"];
  const statuses = ["pending", "approved", "rejected", "revise_resubmit"];

  const [
    collCounts, statusCounts,
    fsReads7d, fsWrites7d, fsDeletes7d,
    fsStorageBytes, cloudStorageBytes,
    fnExec7d, fnExec30d,
    usageDoc,
  ] = await Promise.all([
    // Firestore doc counts
    Promise.all(collections.map(async (name) => {
      const snap = await db.collection(name).count().get();
      return { name, count: snap.data().count };
    })),
    // Submission status breakdown
    Promise.all(statuses.map(async (status) => {
      const snap = await db.collection("submissions").where("status", "==", status).count().get();
      return { status, count: snap.data().count };
    })),
    // Monitoring: Firestore reads/writes/deletes (7 days)
    queryMetric("firestore.googleapis.com/document/read_count", startTime7d),
    queryMetric("firestore.googleapis.com/document/write_count", startTime7d),
    queryMetric("firestore.googleapis.com/document/delete_count", startTime7d),
    // Monitoring: Firestore storage (latest)
    queryMetric("firestore.googleapis.com/storage/data_and_index_storage_bytes", startTime1d, "ALIGN_MEAN"),
    // Monitoring: Cloud Storage total bytes (latest)
    queryMetric("storage.googleapis.com/storage/total_bytes", startTime1d, "ALIGN_MEAN"),
    // Monitoring: Cloud Functions executions (7d and 30d)
    queryMetric("cloudfunctions.googleapis.com/function/execution_count", startTime7d),
    queryMetric("cloudfunctions.googleapis.com/function/execution_count", startTime30d),
    // Gemini usage counter
    db.collection("config").doc("usage").get(),
  ]);

  // Firestore doc counts
  const firestore = {};
  let totalDocs = 0;
  for (const c of collCounts) { firestore[c.name] = c.count; totalDocs += c.count; }
  firestore.totalDocs = totalDocs;

  // Submission breakdown
  const submissions = { total: 0 };
  for (const s of statusCounts) { submissions[s.status] = s.count; submissions.total += s.count; }

  // Cloud Storage: sum only the app bucket
  let cloudStorageMB = 0;
  for (const ts of cloudStorageBytes) {
    if (ts.resource && ts.resource.labels &&
        ts.resource.labels.bucket_name === "uwc-survival-guide.firebasestorage.app") {
      cloudStorageMB = latestValue([ts]) / (1024 * 1024);
    }
  }

  // Cloud Functions: per-function breakdown (7d)
  const fnBreakdown = {};
  let fnTotal7d = 0;
  for (const ts of fnExec7d) {
    const name = ts.resource && ts.resource.labels ? ts.resource.labels.function_name : "unknown";
    let count = 0;
    for (const p of ts.points || []) count += parseInt(p.value.int64Value || "0", 10);
    fnBreakdown[name] = (fnBreakdown[name] || 0) + count;
    fnTotal7d += count;
  }
  const fnTotal30d = sumPoints(fnExec30d);

  // Gemini usage
  const usageData = usageDoc.exists ? usageDoc.data() : {};
  const geminiByMonth = usageData.gemini || {};
  const geminiThisMonth = geminiByMonth[currentMonth] || 0;
  let geminiTotal = 0;
  for (const m of Object.keys(geminiByMonth)) geminiTotal += geminiByMonth[m] || 0;

  const result = {
    monitoring: {
      firestoreReads7d: sumPoints(fsReads7d),
      firestoreWrites7d: sumPoints(fsWrites7d),
      firestoreDeletes7d: sumPoints(fsDeletes7d),
      firestoreStorageBytes: latestValue(fsStorageBytes),
      cloudStorageMB: parseFloat(cloudStorageMB.toFixed(2)),
      cloudStorageLimitGB: 5,
      functionsExec7d: fnTotal7d,
      functionsExec30d: fnTotal30d,
      functionBreakdown: fnBreakdown,
    },
    gemini: {
      callsThisMonth: geminiThisMonth,
      callsTotal: geminiTotal,
      month: currentMonth,
    },
    firestore,
    submissions,
    cachedAt: endTime.toISOString(),
  };
  _usageCache = result;
  _usageCacheTime = now;
  return result;
});
