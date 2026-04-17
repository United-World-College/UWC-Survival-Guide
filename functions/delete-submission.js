#!/usr/bin/env node
/**
 * Delete submission documents from Firestore by guide_id.
 *
 * Usage:
 *   node delete-submission.js <guide_id> [--dry-run]
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or default Firebase credentials.
 */

const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const guideId = args.find((a) => !a.startsWith("--"));

  if (!guideId) {
    console.error("Usage: node delete-submission.js <guide_id> [--dry-run]");
    process.exit(1);
  }

  if (dryRun) console.log("=== DRY RUN — no documents will be deleted ===\n");

  const snap = await db
    .collection("submissions")
    .where("guide_id", "==", guideId)
    .get();

  if (snap.empty) {
    console.log(`No submissions found with guide_id="${guideId}".`);
    return;
  }

  console.log(`Found ${snap.size} submission(s) with guide_id="${guideId}":\n`);

  for (const doc of snap.docs) {
    const data = doc.data();
    const createdAt = data.createdAt && data.createdAt.toDate
      ? data.createdAt.toDate().toISOString()
      : "(none)";
    console.log(`  ${doc.id}`);
    console.log(`    title:     ${data.title || "(none)"}`);
    console.log(`    language:  ${data.language || "(none)"}`);
    console.log(`    status:    ${data.status || "(none)"}`);
    console.log(`    createdAt: ${createdAt}`);
    console.log();
  }

  if (dryRun) {
    console.log("Dry run complete — no changes made.");
    return;
  }

  console.log("Deleting...");
  let deleted = 0;
  for (const doc of snap.docs) {
    await doc.ref.delete();
    console.log(`  DELETED ${doc.id}`);
    deleted++;
  }
  console.log(`\nDone. Deleted ${deleted} submission(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
