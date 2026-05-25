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
  "school-selection.md",
  "terminology.md",
  "computer-science.md",
  "victims-of-the-system.md",
];

// Guides whose Firestore `content` field is in a non-English source language
// (these went through the normal submission flow, so the source-language body
// is canonical in Firestore, not English).
// legacyGuideIds: older Firestore guide_id values that should be migrated to guideId.
const NON_EN_SOURCE_GUIDES = [
  { guideId: "ib-physics", lang: "zh-CN", legacyGuideIds: ["ib"] },
];

const LANG_MAP = {
  "en":    { folder: "default", suffix: "" },
  "zh-CN": { folder: "chinese", suffix: "-CN" },
  "zh-TW": { folder: "chinese", suffix: "-TW" },
};
const GUIDES_BASE = path.resolve(__dirname, "../website/_guides");

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

async function findSubmission(guideId) {
  const snap = await db.collection("submissions").where("guide_id", "==", guideId).limit(1).get();
  return snap.empty ? null : snap.docs[0];
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

    const existing = await findSubmission(guideId);

    if (existing) {
      // Update existing submission with current front matter data
      const updates = {};
      const data = existing.data();
      if ((data.description || "") !== submissionData.description) updates.description = submissionData.description;
      if ((data.title || "") !== submissionData.title) updates.title = submissionData.title;
      if ((data.category || "") !== submissionData.category) updates.category = submissionData.category;
      if ((data.content || "") !== submissionData.content) updates.content = submissionData.content;

      // Always set updatedAt when there are changes
      if (Object.keys(updates).length > 0) {
        const updatedDate = frontmatter.updated
          ? Timestamp.fromDate(new Date(frontmatter.updated + "T00:00:00Z"))
          : Timestamp.now();
        updates.updatedAt = updatedDate;
      }

      if (Object.keys(updates).length === 0) {
        console.log(`SKIP  ${guideId} — already up to date`);
        skipped++;
        continue;
      }

      if (dryRun) {
        console.log(`WOULD UPDATE  ${guideId} (${existing.id}):`);
        Object.entries(updates).forEach(([k, v]) => {
          console.log(`  ${k}: ${typeof v === "string" && v.length > 80 ? v.slice(0, 80) + "…" : v}`);
        });
        console.log();
      } else {
        await existing.ref.update(updates);
        console.log(`UPDATED  ${guideId} → ${existing.id} (${Object.keys(updates).join(", ")})`);
      }
      created++;
      continue;
    }

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
    }
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);

  // ── Phase 1b: Sync content for non-EN source guides ──
  console.log("\n=== Phase 1b: Sync content for non-EN source guides ===\n");

  let nonEnUpdated = 0;
  let nonEnSkipped = 0;

  for (const { guideId, lang, legacyGuideIds = [] } of NON_EN_SOURCE_GUIDES) {
    const info = LANG_MAP[lang];
    if (!info) {
      console.log(`SKIP  ${guideId} — unknown lang ${lang}`);
      nonEnSkipped++;
      continue;
    }
    const filePath = path.join(GUIDES_BASE, info.folder, guideId + info.suffix + ".md");
    if (!fs.existsSync(filePath)) {
      console.log(`SKIP  ${guideId} — file not found at ${filePath}`);
      nonEnSkipped++;
      continue;
    }
    const { frontmatter, content: srcContent } = parseGuide(filePath);

    // Try canonical guide_id first, then any legacy values.
    let existing = await findSubmission(guideId);
    if (!existing) {
      for (const legacy of legacyGuideIds) {
        existing = await findSubmission(legacy);
        if (existing) {
          console.log(`  (found ${guideId} via legacy guide_id="${legacy}", will migrate)`);
          break;
        }
      }
    }
    if (!existing) {
      console.log(`SKIP  ${guideId} — no submission found`);
      nonEnSkipped++;
      continue;
    }
    const data = existing.data();
    const updates = {};
    if ((data.guide_id || "") !== guideId) updates.guide_id = guideId;
    if ((data.content || "") !== srcContent) updates.content = srcContent;
    if ((data.title || "") !== (frontmatter.title || "")) updates.title = frontmatter.title || "";
    if ((data.category || "") !== (frontmatter.category || "")) updates.category = frontmatter.category || "";
    if ((data.description || "") !== (frontmatter.description || "")) updates.description = frontmatter.description || "";

    if (Object.keys(updates).length === 0) {
      console.log(`SKIP  ${guideId} — already up to date`);
      nonEnSkipped++;
      continue;
    }

    const updatedDate = frontmatter.updated
      ? Timestamp.fromDate(new Date(frontmatter.updated + "T00:00:00Z"))
      : Timestamp.now();
    updates.updatedAt = updatedDate;

    if (dryRun) {
      console.log(`WOULD UPDATE  ${guideId} (${existing.id}):`);
      Object.entries(updates).forEach(([k, v]) => {
        const preview = typeof v === "string" && v.length > 80 ? v.slice(0, 80) + "…" : v;
        console.log(`  ${k}: ${preview}`);
      });
    } else {
      await existing.ref.update(updates);
      console.log(`UPDATED  ${guideId} → ${existing.id} (${Object.keys(updates).join(", ")})`);
    }
    nonEnUpdated++;
  }

  console.log(`\nNon-EN source: Updated: ${nonEnUpdated}, Skipped: ${nonEnSkipped}`);

  // ── Phase 2: Backfill translations map from existing guide files ──
  console.log("\n=== Phase 2: Backfill translations map ===\n");

  const allSubmissions = await db.collection("submissions")
    .where("status", "==", "approved").get();

  let translationsUpdated = 0;
  let translationsSkipped = 0;

  for (const doc of allSubmissions.docs) {
    const data = doc.data();
    const guideId = data.guide_id;
    if (!guideId) continue;

    // Read all language variant files for this guide_id
    const translations = {};
    for (const [lang, info] of Object.entries(LANG_MAP)) {
      const filePath = path.join(GUIDES_BASE, info.folder, guideId + info.suffix + ".md");
      if (!fs.existsSync(filePath)) continue;
      try {
        const { frontmatter } = parseGuide(filePath);
        translations[lang] = {
          title: frontmatter.title || "",
          category: frontmatter.category || "",
          description: frontmatter.description || "",
        };
      } catch (err) {
        console.log(`  WARN  Could not parse ${filePath}: ${err.message}`);
      }
    }

    if (Object.keys(translations).length === 0) {
      translationsSkipped++;
      continue;
    }

    // Check if translations already match
    const existing = data.translations || {};
    const needsUpdate = JSON.stringify(translations) !== JSON.stringify(existing);

    if (!needsUpdate) {
      console.log(`SKIP  ${guideId} translations — already up to date`);
      translationsSkipped++;
      continue;
    }

    if (dryRun) {
      console.log(`WOULD SET translations for ${guideId}:`);
      Object.entries(translations).forEach(([lang, t]) => {
        console.log(`  ${lang}: "${t.title}" / "${t.description.slice(0, 50)}…"`);
      });
      console.log();
    } else {
      await doc.ref.update({ translations });
      console.log(`SET translations for ${guideId} → ${Object.keys(translations).join(", ")}`);
    }
    translationsUpdated++;
  }

  console.log(`\nTranslations: Updated: ${translationsUpdated}, Skipped: ${translationsSkipped}`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
