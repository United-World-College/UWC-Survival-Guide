#!/usr/bin/env node
/**
 * Clean undocumented fields from production Firestore.
 *
 * Usage:
 *   node scripts/clean-firestore-fields.js            # dry-run (default)
 *   node scripts/clean-firestore-fields.js --write    # actually delete fields
 */

const admin = require("../functions/node_modules/firebase-admin");
const serviceAccount = require("../uwc-survival-guide-16c3b29571cc.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const WRITE = process.argv.includes("--write");

// ─── Allowed schemas (from ACTION_FLOW_REFERENCE.md) ────────────────────────

const SUBMISSIONS_FIELDS = new Set([
  // Identity
  "uid", "authorName", "guide_id",
  // Content
  "title", "category", "language", "description", "content",
  // Status
  "status", "createdAt", "updatedAt", "reviewedAt",
  // Co-authorship
  "coAuthors", "coauthorUids",
  // Revision history
  "revisionHistory",
  // Review messages (transient)
  "approveMessage", "reviewerComments", "rejectionReason", "authorMessage",
  // Translation (post-approval)
  "translationResults", "translations",
]);

const SUBMISSION_AUDIT_FIELDS = new Set([
  "updatedAt", "submissionId", "events",
]);

const USERS_FIELDS = new Set([
  "displayName", "email", "photoURL", "author_id", "role",
  "affiliation", "cohort", "summary", "profileLinks",
  "showEmail", "createdAt", "featuredGuideIds",
]);

const CONFIG_ADMINS_FIELDS = new Set(["emails"]);
const CONFIG_GITHUB_FIELDS = new Set(["token"]);
const CONFIG_GEMINI_FIELDS = new Set(["apiKey"]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function auditCollection(collectionName, allowedFields) {
  const snapshot = await db.collection(collectionName).get();
  let totalStale = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const staleFields = Object.keys(data).filter((k) => !allowedFields.has(k));

    if (staleFields.length === 0) continue;

    totalStale += staleFields.length;
    console.log(`  ${collectionName}/${doc.id}`);
    for (const field of staleFields) {
      const val = data[field];
      const preview = typeof val === "string"
        ? `"${val.length > 60 ? val.slice(0, 60) + "…" : val}"`
        : JSON.stringify(val);
      console.log(`    - ${field}: ${preview}`);
    }

    if (WRITE) {
      const deletes = {};
      staleFields.forEach((f) => { deletes[f] = FieldValue.delete(); });
      await db.collection(collectionName).doc(doc.id).update(deletes);
      console.log(`    ✓ deleted ${staleFields.length} field(s)`);
    }
  }

  return { docs: snapshot.size, staleFields: totalStale };
}

async function auditConfigDoc(path, allowedFields) {
  const doc = await db.doc(path).get();
  if (!doc.exists) {
    console.log(`  ${path}: does not exist`);
    return { docs: 0, staleFields: 0 };
  }

  const data = doc.data();
  const staleFields = Object.keys(data).filter((k) => !allowedFields.has(k));

  if (staleFields.length === 0) return { docs: 1, staleFields: 0 };

  console.log(`  ${path}`);
  for (const field of staleFields) {
    const val = data[field];
    const preview = typeof val === "string"
      ? `"${val.length > 40 ? val.slice(0, 40) + "…" : val}"`
      : JSON.stringify(val);
    console.log(`    - ${field}: ${preview}`);
  }

  if (WRITE) {
    const deletes = {};
    staleFields.forEach((f) => { deletes[f] = FieldValue.delete(); });
    await db.doc(path).update(deletes);
    console.log(`    ✓ deleted ${staleFields.length} field(s)`);
  }

  return { docs: 1, staleFields: staleFields.length };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Mode: ${WRITE ? "WRITE (deleting stale fields)" : "DRY RUN (read-only)"}\n`);

  const results = {};

  console.log("── submissions ──");
  results.submissions = await auditCollection("submissions", SUBMISSIONS_FIELDS);

  console.log("\n── submissionAudit ──");
  results.submissionAudit = await auditCollection("submissionAudit", SUBMISSION_AUDIT_FIELDS);

  console.log("\n── users ──");
  results.users = await auditCollection("users", USERS_FIELDS);

  console.log("\n── config ──");
  results.configAdmins = await auditConfigDoc("config/admins", CONFIG_ADMINS_FIELDS);
  results.configGithub = await auditConfigDoc("config/github", CONFIG_GITHUB_FIELDS);
  results.configGemini = await auditConfigDoc("config/gemini", CONFIG_GEMINI_FIELDS);

  console.log("\n── Summary ──");
  let grandTotal = 0;
  for (const [name, { docs, staleFields }] of Object.entries(results)) {
    if (staleFields > 0) {
      console.log(`  ${name}: ${staleFields} stale field(s) across ${docs} doc(s)`);
    } else {
      console.log(`  ${name}: clean (${docs} doc(s))`);
    }
    grandTotal += staleFields;
  }

  if (grandTotal === 0) {
    console.log("\nAll collections match the documented schema. Nothing to clean.");
  } else if (!WRITE) {
    console.log(`\nFound ${grandTotal} undocumented field(s) total. Run with --write to delete them.`);
  } else {
    console.log(`\nDeleted ${grandTotal} undocumented field(s).`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
