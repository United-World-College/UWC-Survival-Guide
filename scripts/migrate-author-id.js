/**
 * One-time migration: backfill author_id from authorPage for all users,
 * then remove authorPage field.
 *
 * Usage: node scripts/migrate-author-id.js
 */

const path = require("path");
const admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin"));

const serviceAccount = require(path.join(__dirname, "..", "uwc-survival-guide-16c3b29571cc.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrate() {
  const usersSnap = await db.collection("users").get();
  let migrated = 0;
  let skipped = 0;
  let removed = 0;

  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const updates = {};

    // Backfill author_id from authorPage if missing
    if (!data.author_id && data.authorPage) {
      const authorId = data.authorPage.replace(/^\/authors\//, "").replace(/\/$/, "");
      if (authorId) {
        updates.author_id = authorId;
        console.log(`  [BACKFILL] ${doc.id}: author_id = "${authorId}" (from authorPage "${data.authorPage}")`);
      }
    }

    // Remove authorPage field
    if (data.authorPage !== undefined) {
      updates.authorPage = admin.firestore.FieldValue.delete();
      removed++;
    }

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      migrated++;
    } else {
      skipped++;
    }
  }

  console.log(`\nDone. ${migrated} users updated, ${skipped} skipped, ${removed} authorPage fields removed.`);
  console.log(`Total users: ${usersSnap.size}`);
}

migrate().catch(console.error).then(() => process.exit(0));
