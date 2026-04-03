#!/usr/bin/env node

/**
 * One-time script to seed the config/r2 Firestore document with
 * Cloudflare R2 credentials. Run once per environment.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json node scripts/seed-r2-config.js
 */

const path = require("path");
const admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin"));

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error("Set GOOGLE_APPLICATION_CREDENTIALS to your service account key path.");
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require(credPath)) });
const db = admin.firestore();

async function main() {
  await db.collection("config").doc("r2").set({
    accessKeyId: "b86ea5e851f9efa911841d97f45e9e49",
    secretAccessKey: "38ee347d9edfcf8675ee5c8796fcab699bf2ff52cce77d27f8bd1f42f4262dca",
    endpoint: "https://a967fc402e8e0175c757552fe60ead7f.r2.cloudflarestorage.com",
    bucket: "uwc-survival-guide",
    publicUrlBase: "https://pub-bb0f6d21281243738b170b9aefc6e0cd.r2.dev",
  });
  console.log("✓ config/r2 seeded successfully.");
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
