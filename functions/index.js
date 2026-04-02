const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db, FieldValue, LANG_MAP } = require("./lib/config");
const { assertAuth, assertAdmin } = require("./lib/auth");
const {
  makeSlug, getOrderedSubmissionAuthors, sanitizeRevisionHistory,
  withoutPublicActorFields, generateMarkdown,
} = require("./lib/helpers");
const { getGitHubToken, githubApi, publishToGitHub, ensureAuthorPresenceOnGitHub } = require("./lib/github");
const {
  appendSubmissionAuditEvent, resolveSubmissionAuthors,
  ensureUniqueGuideSlug, ensureAuthorId,
} = require("./lib/firestore");
const { getGeminiKey, translateAndPublishMissingVariants } = require("./lib/translation");

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

  // Attempt GitHub publish first — only mark as approved if it succeeds
  let published = false;
  let githubError = null;
  const token = await getGitHubToken();
  if (token) {
    try {
      await publishToGitHub(token, d, markdown, filePath, primaryAuthor);
      published = true;
    } catch (err) {
      githubError = err.message;
    }
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

  if (authors.length > 1) {
    await Promise.all(authors.slice(1).map((author) => ensureAuthorPresenceOnGitHub(token, author)));
  }

  // Auto-translate into missing language variants
  let translationResults = null;
  const geminiKey = await getGeminiKey();
  if (geminiKey) {
    try {
      translationResults = await translateAndPublishMissingVariants(
        token, geminiKey, d, slug, authors, editorName
      );
    } catch (err) {
      translationResults = [{ error: err.message, success: false }];
    }
  }

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
