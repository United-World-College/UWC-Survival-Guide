#!/usr/bin/env node
/**
 * One-time backfill: create Firestore "submissions" documents for guides that
 * were published before the submissions system existed.
 *
 * Usage:
 *   node backfill-submissions.js [--dry-run]
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or default Firebase credentials.
 */

const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

initializeApp();
const db = getFirestore();

const GUIDES_DIR = path.resolve(__dirname, "../website/_guides/default");

// Guides that have an author_id and were published before the submissions system.
// Only English originals — translations were auto-generated at publish time.
const GUIDE_FILES = [
  "college-application.md",
  "school-selection.md",
  "terminology.md",
];

function parseGuide(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`Cannot parse frontmatter in ${filePath}`);

  const frontmatter = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
    if (m) {
      let val = m[2].trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      frontmatter[m[1]] = val;
    }
  }

  return { frontmatter, content: match[2].trim() };
}

async function findUserByAuthorId(authorId) {
  const snap = await db.collection("users").where("author_id", "==", authorId).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { uid: doc.id, ...doc.data() };
}

async function submissionExists(guideId) {
  const snap = await db.collection("submissions").where("guide_id", "==", guideId).limit(1).get();
  return !snap.empty;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) console.log("=== DRY RUN — no documents will be created ===\n");

  // Parse all guides first
  const guides = GUIDE_FILES.map((file) => {
    const filePath = path.join(GUIDES_DIR, file);
    const { frontmatter, content } = parseGuide(filePath);
    return { file, frontmatter, content };
  });

  // Resolve author uid
  const authorId = guides[0].frontmatter.author_id;
  const user = await findUserByAuthorId(authorId);
  if (!user) {
    console.error(`ERROR: No Firestore user found with author_id="${authorId}".`);
    console.error("Create the user document first, then re-run this script.");
    process.exit(1);
  }
  console.log(`Found user: uid=${user.uid}, author_id=${authorId}, displayName=${user.displayName}\n`);

  let created = 0;
  let skipped = 0;

  for (const { file, frontmatter, content } of guides) {
    const guideId = frontmatter.guide_id;

    // Skip if a submission already exists for this guide_id
    if (await submissionExists(guideId)) {
      console.log(`SKIP  ${guideId} — submission already exists`);
      skipped++;
      continue;
    }

    // Build a published date as a Firestore Timestamp
    const publishedDate = frontmatter.published
      ? Timestamp.fromDate(new Date(frontmatter.published + "T00:00:00Z"))
      : Timestamp.now();

    const submissionData = {
      uid: user.uid,
      authorName: user.displayName || frontmatter.author || "",
      title: frontmatter.title || "",
      category: frontmatter.category || "",
      language: frontmatter.language_code || "en",
      description: frontmatter.description || "",
      content,
      guide_id: guideId,
      status: "approved",
      coAuthors: [
        {
          uid: user.uid,
          author_id: authorId,
          name: user.displayName || frontmatter.author || "",
          order: 1,
        },
      ],
      createdAt: publishedDate,
      updatedAt: publishedDate,
      reviewedAt: publishedDate,
    };

    if (dryRun) {
      console.log(`WOULD CREATE  ${guideId}:`);
      console.log(`  title:    ${submissionData.title}`);
      console.log(`  category: ${submissionData.category}`);
      console.log(`  language: ${submissionData.language}`);
      console.log(`  uid:      ${submissionData.uid}`);
      console.log(`  content:  ${submissionData.content.length} chars`);
      console.log();
    } else {
      const ref = await db.collection("submissions").add(submissionData);
      console.log(`CREATED  ${guideId} → ${ref.id}`);

      // Also ensure the user's publishedArticles array includes this guide
      await db.collection("users").doc(user.uid).update({
        publishedArticles: require("firebase-admin/firestore").FieldValue.arrayUnion({
          guide_id: guideId,
          title: submissionData.title,
          category: submissionData.category,
        }),
      });
    }
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
