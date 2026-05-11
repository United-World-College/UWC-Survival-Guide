#!/usr/bin/env node
/**
 * One-off fix: align Firestore submission `language` (source language) with
 * the Markdown frontmatter `original_language` for the CS guide.
 *
 * The author page reads source language from Firestore, so a drift causes
 * the wrong "原文 / Original" pill to show. The Markdown is the intended
 * source of truth (original_language: "zh-CN") so we patch Firestore here.
 *
 * Usage:
 *   node scripts/fix-cs-guide-source-language.js          # dry-run
 *   node scripts/fix-cs-guide-source-language.js --write  # apply
 */

const admin = require("../functions/node_modules/firebase-admin");
const serviceAccount = require("../uwc-survival-guide-16c3b29571cc.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const WRITE = process.argv.includes("--write");

const GUIDE_ID = "computer-science";
const TARGET_LANGUAGE = "zh-CN";

async function main() {
  const snap = await db
    .collection("submissions")
    .where("guide_id", "==", GUIDE_ID)
    .get();

  if (snap.empty) {
    console.log(`No submissions found with guide_id="${GUIDE_ID}".`);
    process.exit(0);
  }

  console.log(`Found ${snap.size} submission(s) for guide_id="${GUIDE_ID}":`);
  const updates = [];
  snap.forEach((doc) => {
    const data = doc.data();
    const current = data.language;
    const status = data.status;
    console.log(
      `  - id=${doc.id} status=${status} language=${current} title=${data.title}`,
    );
    if (current !== TARGET_LANGUAGE) {
      updates.push({ ref: doc.ref, current });
    }
  });

  if (updates.length === 0) {
    console.log(`All submissions already have language="${TARGET_LANGUAGE}". Nothing to do.`);
    process.exit(0);
  }

  console.log(
    `\n${updates.length} submission(s) need update from current value to "${TARGET_LANGUAGE}".`,
  );

  if (!WRITE) {
    console.log("Dry-run only. Re-run with --write to apply.");
    process.exit(0);
  }

  for (const { ref, current } of updates) {
    await ref.update({ language: TARGET_LANGUAGE });
    console.log(`  Updated ${ref.id}: ${current} -> ${TARGET_LANGUAGE}`);
  }
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
