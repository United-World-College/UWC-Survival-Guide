const { db, FieldValue } = require("./config");
const { makeSlug, makeAuthorSlug, getOrderedSubmissionAuthors } = require("./helpers");

async function appendSubmissionAuditEvent(docId, type, auth, details = {}) {
  const auditRef = db.collection("submissionAudit").doc(docId);
  const snap = await auditRef.get();
  const existingEvents = snap.exists && Array.isArray(snap.data().events) ?
    snap.data().events.slice() :
    [];
  const userDoc = await db.collection("users").doc(auth.uid).get();
  const actorAuthorId = userDoc.exists && userDoc.data().author_id ? userDoc.data().author_id : null;
  existingEvents.push({
    type,
    actorUid: auth.uid,
    actorAuthorId,
    actedAt: new Date().toISOString(),
    ...details,
  });
  await auditRef.set({
    updatedAt: FieldValue.serverTimestamp(),
    events: existingEvents,
  }, { merge: true });
}

async function resolveAuthorSlug(uid, authorName) {
  if (uid) {
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.exists && userDoc.data().author_id) {
      return userDoc.data().author_id;
    }
  }
  return makeAuthorSlug(authorName) || (uid ? uid.toLowerCase() : makeSlug(authorName));
}

async function resolveSubmissionAuthors(d) {
  const { HttpsError } = require("firebase-functions/v2/https");
  const authors = getOrderedSubmissionAuthors(d);
  if (!authors.length) {
    throw new HttpsError("failed-precondition", "Submission is missing ordered authors.");
  }
  return Promise.all(authors.map(async (author) => ({
    ...author,
    author_id: author.author_id || await resolveAuthorSlug(author.uid, author.name),
  })));
}

async function ensureUniqueGuideSlug(baseSlug, excludeDocId) {
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const snap = await db.collection("submissions")
        .where("guide_id", "==", slug).get();
    const conflict = snap.docs.some((d) => d.id !== excludeDocId);
    if (!conflict) return slug;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }
}

async function ensureUniqueAuthorSlug(baseSlug) {
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const snap = await db.collection("users").where("author_id", "==", slug).get();
    if (snap.empty) return slug;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }
}

async function ensureAuthorId(uid, authorSlug) {
  if (!uid) return;
  // Only set author_id if user doesn't already have one — author_id is immutable
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists || !userDoc.data().author_id) {
    const baseSlug = authorSlug || uid.toLowerCase();
    const uniqueSlug = await ensureUniqueAuthorSlug(baseSlug);
    const update = { author_id: uniqueSlug };
    if (!userDoc.exists || !userDoc.data().role) update.role = "member";
    await db.collection("users").doc(uid).set(update, { merge: true });
  }
}

const CORE_MEMBER_THRESHOLD = 5;

// Bump role member -> core_member when approved article count crosses the
// threshold. Never downgrades; never overwrites founding_editor_in_chief.
async function maybeBumpRoleForUid(uid) {
  if (!uid) return;
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) return;
  const role = userDoc.data().role || "member";
  if (role !== "member") return;

  const [ownSnap, coauthorSnap] = await Promise.all([
    db.collection("submissions").where("status", "==", "approved").where("uid", "==", uid).get(),
    db.collection("submissions").where("status", "==", "approved").where("coauthorUids", "array-contains", uid).get(),
  ]);
  const ids = new Set();
  ownSnap.forEach((d) => ids.add(d.id));
  coauthorSnap.forEach((d) => ids.add(d.id));
  if (ids.size >= CORE_MEMBER_THRESHOLD) {
    await userDoc.ref.update({ role: "core_member" });
  }
}

module.exports = {
  appendSubmissionAuditEvent,
  resolveAuthorSlug,
  resolveSubmissionAuthors,
  ensureUniqueGuideSlug,
  ensureUniqueAuthorSlug,
  maybeBumpRoleForUid,
  ensureAuthorId,
};
