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
    submissionId: docId,
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

async function updateAuthorRecord(uid, authorSlug, slug, title, category) {
  if (!uid) return;
  // Only set author_id if user doesn't already have one — author_id is immutable
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists || !userDoc.data().author_id) {
    const baseSlug = authorSlug || uid.toLowerCase();
    const uniqueSlug = await ensureUniqueAuthorSlug(baseSlug);
    await db.collection("users").doc(uid).set(
      { author_id: uniqueSlug },
      { merge: true }
    );
  }
  await db.collection("users").doc(uid).update({
    publishedArticles: FieldValue.arrayUnion({
      guide_id: slug, title, category,
    }),
  }).catch(() => {});
}

module.exports = {
  appendSubmissionAuditEvent,
  resolveAuthorSlug,
  resolveSubmissionAuthors,
  ensureUniqueGuideSlug,
  ensureUniqueAuthorSlug,
  updateAuthorRecord,
};
