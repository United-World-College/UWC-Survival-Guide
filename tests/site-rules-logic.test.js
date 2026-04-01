/**
 * Logic-level tests for Firestore security rules.
 *
 * Since @firebase/rules-unit-testing requires a running emulator,
 * these tests validate the rule logic by parsing the rules file
 * and verifying the expected security patterns are in place.
 *
 * For full integration testing, run: firebase emulators:exec --only firestore "npm test"
 */

const fs = require("fs");
const path = require("path");

const RULES_PATH = path.join(
  __dirname,
  "..",
  "firebase",
  "firestore.rules"
);

let rules;

beforeAll(() => {
  rules = fs.readFileSync(RULES_PATH, "utf-8");
});

// Helper to extract a match block including its full body
function getMatchBlock(collectionPattern) {
  const pattern = `match /${collectionPattern}`;
  const start = rules.indexOf(pattern);
  if (start === -1) return "";
  // Skip past the pattern text to find the block-opening brace
  // (not the brace inside the pattern like {uid})
  const afterPattern = start + pattern.length;
  const blockStart = rules.indexOf("{", afterPattern);
  if (blockStart === -1) return rules.substring(start);
  // Find the matching closing brace
  let depth = 0;
  for (let i = blockStart; i < rules.length; i++) {
    if (rules[i] === "{") depth++;
    if (rules[i] === "}") depth--;
    if (depth === 0) return rules.substring(start, i + 1);
  }
  return rules.substring(start);
}

// ══════════════════════════════════════
// Users Collection Rules
// ══════════════════════════════════════

describe("Users collection security rules", () => {
  let usersBlock;
  beforeAll(() => {
    usersBlock = getMatchBlock("users/{uid}");
  });

  test("allows read for anyone", () => {
    expect(usersBlock).toContain("allow read");
  });

  test("requires author_id on create", () => {
    expect(usersBlock).toContain("allow create");
    expect(usersBlock).toContain("'author_id' in request.resource.data");
    expect(usersBlock).toContain("request.resource.data.author_id is string");
    expect(usersBlock).toContain("request.resource.data.author_id.size() > 0");
  });

  test("requires author_id to match the generated slug format", () => {
    expect(usersBlock).toContain(
      "request.resource.data.author_id.matches('^[a-z0-9]+(-[a-z0-9]+)*$')"
    );
  });

  test("prevents author_id from being changed on update", () => {
    expect(usersBlock).toContain("allow update");
    expect(usersBlock).toContain(
      "request.resource.data.author_id == resource.data.author_id"
    );
  });

  test("allows a one-time author_id backfill for legacy user docs missing one", () => {
    expect(usersBlock).toContain("!('author_id' in resource.data)");
    expect(usersBlock).toContain("'author_id' in request.resource.data");
  });

  test("restricts create and update to the authenticated user's own document", () => {
    expect(usersBlock).toContain("request.auth.uid == uid");
  });
});

// ══════════════════════════════════════
// Submissions Collection Rules
// ══════════════════════════════════════

describe("Submissions collection security rules", () => {
  let submissionsBlock;
  beforeAll(() => {
    submissionsBlock = getMatchBlock("submissions/{docId}");
  });

  test("denies client-side create", () => {
    expect(submissionsBlock).toMatch(/allow create:\s*if\s+false/);
  });

  test("allows read for submission owner", () => {
    expect(submissionsBlock).toContain("resource.data.uid == request.auth.uid");
  });

  test("allows read for co-author UIDs", () => {
    expect(submissionsBlock).toContain("coauthorUids");
    expect(submissionsBlock).toContain("request.auth.uid in resource.data.coauthorUids");
  });

  test("allows read for verified admins via isAdmin()", () => {
    expect(submissionsBlock).toContain("isAdmin()");
  });

  test("explicitly denies client-side update", () => {
    expect(submissionsBlock).toContain("allow update: if false");
  });

  test("explicitly denies client-side delete", () => {
    expect(submissionsBlock).toContain("allow delete: if false");
  });

  test("does not allow unauthenticated reads", () => {
    // Read requires auth != null
    expect(submissionsBlock).toMatch(
      /allow read.*request\.auth\s*!=\s*null/s
    );
  });
});

// ══════════════════════════════════════
// Submission Audit Collection Rules
// ══════════════════════════════════════

describe("Submission audit collection security rules", () => {
  let auditBlock;
  beforeAll(() => {
    auditBlock = getMatchBlock("submissionAudit/{docId}");
  });

  test("restricts read to admins via isAdmin()", () => {
    expect(auditBlock).toContain("isAdmin()");
  });

  test("does not allow any client-side writes", () => {
    expect(auditBlock).not.toContain("allow write");
    expect(auditBlock).not.toContain("allow create");
    expect(auditBlock).not.toContain("allow update");
    expect(auditBlock).not.toContain("allow delete");
  });
});

// ══════════════════════════════════════
// Config Collection Rules
// ══════════════════════════════════════

describe("Config collection security rules", () => {
  let configBlock;
  beforeAll(() => {
    configBlock = getMatchBlock("config/{docId}");
  });

  test("restricts read to admins via isAdmin()", () => {
    expect(configBlock).toContain("isAdmin()");
  });

  test("does not allow any writes", () => {
    expect(configBlock).not.toContain("allow write");
    expect(configBlock).not.toContain("allow create");
    expect(configBlock).not.toContain("allow update");
    expect(configBlock).not.toContain("allow delete");
  });

  test("does not expose config to non-admin users", () => {
    // The read rule uses isAdmin() which checks config/admins
    expect(configBlock).toContain("isAdmin()");
  });
});

// ══════════════════════════════════════
// Admin Email Consistency
// ══════════════════════════════════════

describe("Admin access centralization", () => {
  test("rules define an isAdmin() function that reads from config/admins", () => {
    expect(rules).toContain("function isAdmin()");
    expect(rules).toContain("config/admins");
  });

  test("Cloud Functions read admin emails from Firestore instead of hardcoding", () => {
    const functionsDir = path.join(__dirname, "..", "functions");
    const indexSource = fs.readFileSync(
      path.join(functionsDir, "index.js"), "utf-8"
    );
    const authSource = fs.existsSync(path.join(functionsDir, "lib", "auth.js"))
      ? fs.readFileSync(path.join(functionsDir, "lib", "auth.js"), "utf-8")
      : "";
    const functionsSource = indexSource + "\n" + authSource;

    // Should NOT have a hardcoded ADMIN_EMAILS array
    expect(functionsSource).not.toMatch(/ADMIN_EMAILS\s*=\s*\[/);
    // Should read from config/admins
    expect(functionsSource).toContain('"admins"');
    expect(functionsSource).toContain("getAdminEmails");
  });

  test("all admin-gated rule blocks use isAdmin()", () => {
    const submissionsBlock = getMatchBlock("submissions/{docId}");
    const auditBlock = getMatchBlock("submissionAudit/{docId}");
    const configBlock = getMatchBlock("config/{docId}");

    expect(submissionsBlock).toContain("isAdmin()");
    expect(auditBlock).toContain("isAdmin()");
    expect(configBlock).toContain("isAdmin()");
  });
});

// ══════════════════════════════════════
// Global Security Patterns
// ══════════════════════════════════════

describe("Global Firestore security patterns", () => {
  test("does not have a root-level allow read/write for all", () => {
    // There should be no blanket allow read, write at the database level
    // i.e. "allow read, write;" without conditions before any match blocks
    const serviceBlock = rules.substring(
      rules.indexOf("service cloud.firestore")
    );
    const firstMatch = serviceBlock.indexOf("match /");
    const preamble = serviceBlock.substring(0, firstMatch);
    expect(preamble).not.toMatch(/allow\s+(read|write|read,\s*write)\s*;/);
  });

  test("all allow rules have conditions (no unconditional writes)", () => {
    // Find all "allow write" or "allow create" lines — they should have ": if"
    const writeRules = rules.match(/allow\s+(write|create|update|delete)\s*:.*/g) || [];
    for (const rule of writeRules) {
      expect(rule).toContain("if");
    }
  });

  test("rules file has no TODO or FIXME comments", () => {
    expect(rules).not.toMatch(/\/\/\s*(TODO|FIXME|HACK)/i);
  });
});

// ══════════════════════════════════════
// Storage Rules Logic
// ══════════════════════════════════════

describe("Storage rules logic", () => {
  let storageRules;

  beforeAll(() => {
    storageRules = fs.readFileSync(
      path.join(__dirname, "..", "firebase", "storage.rules"),
      "utf-8"
    );
  });

  test("does not have a root-level allow all", () => {
    const serviceBlock = storageRules.substring(
      storageRules.indexOf("service firebase.storage")
    );
    const firstMatch = serviceBlock.indexOf("match /");
    const preamble = serviceBlock.substring(0, firstMatch);
    expect(preamble).not.toMatch(/allow\s+(read|write|read,\s*write)\s*;/);
  });

  test("all write rules require authentication", () => {
    const writeLines = storageRules.match(/allow\s+write\s*:.*/g) || [];
    for (const line of writeLines) {
      expect(line).toContain("request.auth");
    }
  });
});
