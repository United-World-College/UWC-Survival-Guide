/**
 * One-time migration: move legacy workflow actor fields out of readable
 * submissions and into the private submissionAudit collection.
 *
 * Default is dry-run. Pass --write to persist updates.
 *
 * Usage:
 *   node scripts/migrate-submission-actor-audit.js
 *   node scripts/migrate-submission-actor-audit.js --write
 */

const path = require("path");
const admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin"));

const serviceAccount = require(path.join(__dirname, "..", "uwc-survival-guide-16c3b29571cc.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const writeMode = process.argv.includes("--write");

function hasOwn(obj, key) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

function toIsoString(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  try {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
  } catch (err) {
    return String(value);
  }
}

function getActor(entry, preferredRole) {
  if (!entry || typeof entry !== "object") {
    return { uid: null, email: null };
  }
  if (preferredRole === "author") {
    return {
      uid: entry.authorUid || entry.actorUid || null,
      email: entry.authorEmail || entry.actorEmail || null,
    };
  }
  return {
    uid: entry.reviewerUid || entry.actorUid || null,
    email: entry.reviewerEmail || entry.actorEmail || null,
  };
}

function sanitizeRevisionEntry(entry, index) {
  if (!entry || typeof entry !== "object") return null;
  const cleaned = { ...entry };
  delete cleaned.reviewerUid;
  delete cleaned.reviewerEmail;
  delete cleaned.authorUid;
  delete cleaned.authorEmail;
  delete cleaned.actorUid;
  delete cleaned.actorEmail;
  if (!cleaned.round) cleaned.round = index + 1;
  return cleaned;
}

function sanitizeRevisionHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.map(sanitizeRevisionEntry).filter(Boolean);
}

function historiesDiffer(current, next) {
  return JSON.stringify(Array.isArray(current) ? current : []) !== JSON.stringify(next);
}

function makeEventSignature(event) {
  return JSON.stringify({
    type: event.type || null,
    actorUid: event.actorUid || null,
    actorEmail: event.actorEmail || null,
    actedAt: event.actedAt || null,
    round: event.round || null,
    reviewerComments: event.reviewerComments || null,
    authorMessage: event.authorMessage || null,
    approveMessage: event.approveMessage || null,
    rejectionReason: event.rejectionReason || null,
    guideId: event.guideId || null,
    status: event.status || null,
  });
}

function sortEvents(events) {
  return events.slice().sort((a, b) => {
    const left = a && a.actedAt ? a.actedAt : "";
    const right = b && b.actedAt ? b.actedAt : "";
    if (left === right) return 0;
    if (!left) return 1;
    if (!right) return -1;
    return left.localeCompare(right);
  });
}

function buildLegacyEvents(data) {
  const events = [];
  let unrecoverableActorEvents = 0;
  const history = Array.isArray(data.revisionHistory) ? data.revisionHistory : [];

  history.forEach((entry, index) => {
    const round = entry && entry.round ? entry.round : index + 1;
    if (entry && entry.reviewerComments) {
      const actor = getActor(entry, "reviewer");
      if (!actor.uid && !actor.email) unrecoverableActorEvents += 1;
      events.push({
        type: "revision_requested",
        actorUid: actor.uid,
        actorEmail: actor.email,
        actedAt: toIsoString(entry.reviewedAt),
        round,
        reviewerComments: entry.reviewerComments,
      });
    }

    if (entry && (entry.authorMessage || entry.resubmittedAt || entry.authorUid || entry.authorEmail || entry.actorUid || entry.actorEmail)) {
      const actor = getActor(entry, "author");
      if (!actor.uid && !actor.email) unrecoverableActorEvents += 1;
      events.push({
        type: "resubmitted",
        actorUid: actor.uid,
        actorEmail: actor.email,
        actedAt: toIsoString(entry.resubmittedAt),
        round,
        authorMessage: entry.authorMessage || null,
      });
    }
  });

  if (!history.length && data.reviewerComments) {
    const actor = {
      uid: data.reviewerUid || null,
      email: data.reviewerEmail || null,
    };
    if (!actor.uid && !actor.email) unrecoverableActorEvents += 1;
    events.push({
      type: "revision_requested",
      actorUid: actor.uid,
      actorEmail: actor.email,
      actedAt: toIsoString(data.reviewedAt),
      round: 1,
      reviewerComments: data.reviewerComments,
    });
  }

  if (data.status === "approved" || data.approveMessage) {
    const actor = {
      uid: data.reviewerUid || null,
      email: data.reviewerEmail || null,
    };
    if (!actor.uid && !actor.email) unrecoverableActorEvents += 1;
    events.push({
      type: "approved",
      actorUid: actor.uid,
      actorEmail: actor.email,
      actedAt: toIsoString(data.reviewedAt),
      approveMessage: data.approveMessage || null,
      guideId: data.guide_id || null,
    });
  }

  if (data.status === "rejected" || data.rejectionReason) {
    const actor = {
      uid: data.reviewerUid || null,
      email: data.reviewerEmail || null,
    };
    if (!actor.uid && !actor.email) unrecoverableActorEvents += 1;
    events.push({
      type: "rejected",
      actorUid: actor.uid,
      actorEmail: actor.email,
      actedAt: toIsoString(data.reviewedAt),
      rejectionReason: data.rejectionReason || null,
    });
  }

  return {
    events: events.filter((event) => event.type),
    unrecoverableActorEvents,
  };
}

async function migrate() {
  const submissionsSnap = await db.collection("submissions").get();
  const report = [];
  let docsWithScrub = 0;
  let docsWithAuditWrites = 0;
  let migratedEvents = 0;
  let unrecoverableActorEvents = 0;

  for (const doc of submissionsSnap.docs) {
    const data = doc.data();
    const sanitizedHistory = sanitizeRevisionHistory(data.revisionHistory);
    const needsHistoryScrub = historiesDiffer(data.revisionHistory, sanitizedHistory);
    const hasRootReviewerUid = hasOwn(data, "reviewerUid");
    const hasRootReviewerEmail = hasOwn(data, "reviewerEmail");

    const { events: legacyEvents, unrecoverableActorEvents: missingActors } = buildLegacyEvents(data);
    unrecoverableActorEvents += missingActors;

    const auditRef = db.collection("submissionAudit").doc(doc.id);
    const auditSnap = await auditRef.get();
    const existingEvents = auditSnap.exists && Array.isArray(auditSnap.data().events)
      ? auditSnap.data().events.slice()
      : [];
    const existingSignatures = new Set(existingEvents.map(makeEventSignature));
    const newEvents = legacyEvents.filter((event) => !existingSignatures.has(makeEventSignature(event)));
    const mergedEvents = sortEvents(existingEvents.concat(newEvents));

    const needsScrub = needsHistoryScrub || hasRootReviewerUid || hasRootReviewerEmail;
    if (!needsScrub && newEvents.length === 0) continue;

    if (needsScrub) docsWithScrub += 1;
    if (newEvents.length > 0) {
      docsWithAuditWrites += 1;
      migratedEvents += newEvents.length;
    }

    report.push({
      id: doc.id,
      title: data.title || "(untitled)",
      scrubbedRootFields: [hasRootReviewerUid ? "reviewerUid" : null, hasRootReviewerEmail ? "reviewerEmail" : null].filter(Boolean),
      scrubbedHistoryEntries: needsHistoryScrub ? (Array.isArray(data.revisionHistory) ? data.revisionHistory.length : 0) : 0,
      appendedEvents: newEvents.map((event) => ({
        type: event.type,
        actedAt: event.actedAt,
        round: event.round || null,
      })),
      missingActorEvents: missingActors,
    });

    if (!writeMode) continue;

    if (newEvents.length > 0) {
      await auditRef.set({
        submissionId: doc.id,
        updatedAt: FieldValue.serverTimestamp(),
        events: mergedEvents,
      }, { merge: true });
    }

    if (needsScrub) {
      const update = {};
      if (needsHistoryScrub) update.revisionHistory = sanitizedHistory;
      if (hasRootReviewerUid) update.reviewerUid = FieldValue.delete();
      if (hasRootReviewerEmail) update.reviewerEmail = FieldValue.delete();
      await doc.ref.update(update);
    }
  }

  console.log(writeMode ? "WRITE MODE" : "DRY RUN");
  console.log(`Submissions scanned: ${submissionsSnap.size}`);
  console.log(`Submissions scrubbed: ${docsWithScrub}`);
  console.log(`Audit docs updated: ${docsWithAuditWrites}`);
  console.log(`Audit events appended: ${migratedEvents}`);
  console.log(`Legacy events with unrecoverable actor identity: ${unrecoverableActorEvents}`);

  report.forEach((entry) => {
    console.log(`\n[${entry.id}] ${entry.title}`);
    if (entry.scrubbedRootFields.length > 0) {
      console.log(`  scrubbed root fields: ${entry.scrubbedRootFields.join(", ")}`);
    }
    if (entry.scrubbedHistoryEntries > 0) {
      console.log(`  sanitized revision entries: ${entry.scrubbedHistoryEntries}`);
    }
    if (entry.appendedEvents.length > 0) {
      console.log("  appended audit events:", JSON.stringify(entry.appendedEvents));
    }
    if (entry.missingActorEvents > 0) {
      console.log(`  events missing recoverable actor identity: ${entry.missingActorEvents}`);
    }
  });
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
}).then(() => process.exit(0));
