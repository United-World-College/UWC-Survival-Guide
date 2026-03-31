/**
 * One-time migration: convert legacy submission author data into the
 * ordered-author-list format used by the portal now.
 *
 * Default is dry-run. Pass --write to persist updates.
 *
 * Usage:
 *   node scripts/migrate-submission-authors.js
 *   node scripts/migrate-submission-authors.js --write
 */

const path = require("path");
const admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin"));

const serviceAccount = require(path.join(__dirname, "..", "uwc-survival-guide-16c3b29571cc.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const writeMode = process.argv.includes("--write");

function makeSlug(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getAuthorKey(author) {
  if (!author) return "";
  if (author.uid) return `uid:${author.uid}`;
  if (author.author_id) return `author:${author.author_id}`;
  const name = String(author.name || "").trim().toLowerCase();
  return name ? `name:${name}` : "";
}

function normalizeAuthors(authors) {
  const seen = new Set();
  const normalized = [];

  (Array.isArray(authors) ? authors : [])
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((author) => {
      if (!author) return;
      const normalizedAuthor = {
        uid: author.uid || null,
        author_id: author.author_id || null,
        name: String(author.name || "").trim(),
      };
      if (!normalizedAuthor.name) return;
      const key = getAuthorKey(normalizedAuthor);
      if (!key || seen.has(key)) return;
      seen.add(key);
      normalizedAuthor.order = normalized.length + 1;
      normalized.push(normalizedAuthor);
    });

  return normalized;
}

async function resolveAuthorId(uid, name) {
  if (uid) {
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.exists && userDoc.data().author_id) {
      return userDoc.data().author_id;
    }
  }
  return makeSlug(name);
}

async function buildCanonicalAuthors(data) {
  const authors = [];

  if (data.uid || data.authorName) {
    authors.push({
      uid: data.uid || null,
      name: String(data.authorName || "").trim(),
      author_id: await resolveAuthorId(data.uid || null, data.authorName || ""),
      order: 1,
    });
  }

  const existingAuthors = Array.isArray(data.coAuthors) ? data.coAuthors : [];
  for (const author of existingAuthors) {
    authors.push({
      uid: author.uid || null,
      name: String(author.name || "").trim(),
      author_id: author.author_id || await resolveAuthorId(author.uid || null, author.name || ""),
      order: author.order || authors.length + 1,
    });
  }

  return normalizeAuthors(authors);
}

function authorListsEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function migrate() {
  const submissionsSnap = await db.collection("submissions").get();
  const legacyDocs = [];

  for (const doc of submissionsSnap.docs) {
    const data = doc.data();
    const canonicalAuthors = await buildCanonicalAuthors(data);
    const canonicalUids = canonicalAuthors
      .map((author) => author.uid)
      .filter(Boolean);
    const existingAuthors = normalizeAuthors(data.coAuthors);
    const existingUids = Array.isArray(data.coauthorUids)
      ? Array.from(new Set(data.coauthorUids.filter(Boolean))).sort()
      : [];
    const expectedUids = Array.from(new Set(canonicalUids)).sort();

    if (!canonicalAuthors.length) continue;

    const needsAuthorMigration = !authorListsEqual(existingAuthors, canonicalAuthors);
    const needsUidMigration = JSON.stringify(existingUids) !== JSON.stringify(expectedUids);

    if (!needsAuthorMigration && !needsUidMigration) continue;

    legacyDocs.push({
      id: doc.id,
      title: data.title || "(untitled)",
      fromAuthors: existingAuthors,
      toAuthors: canonicalAuthors,
      fromUids: existingUids,
      toUids: expectedUids,
    });

    if (writeMode) {
      await doc.ref.update({
        coAuthors: canonicalAuthors,
        coauthorUids: expectedUids,
      });
    }
  }

  console.log(writeMode ? "WRITE MODE" : "DRY RUN");
  console.log(`Legacy submissions found: ${legacyDocs.length}`);
  legacyDocs.forEach((entry) => {
    console.log(`\n[${entry.id}] ${entry.title}`);
    console.log("  before authors:", JSON.stringify(entry.fromAuthors));
    console.log("  after authors: ", JSON.stringify(entry.toAuthors));
    console.log("  before uids:   ", JSON.stringify(entry.fromUids));
    console.log("  after uids:    ", JSON.stringify(entry.toUids));
  });
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
}).then(() => process.exit(0));
