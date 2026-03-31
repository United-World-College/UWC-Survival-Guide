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

  test("restricts write to the authenticated user's own document", () => {
    expect(usersBlock).toContain("allow write");
    expect(usersBlock).toContain("request.auth != null");
    expect(usersBlock).toContain("request.auth.uid == uid");
  });

  test("does not allow unauthenticated writes", () => {
    // The write rule requires auth != null
    expect(usersBlock).toMatch(/allow write.*request\.auth\s*!=\s*null/s);
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

  test("allows create for any authenticated user", () => {
    expect(submissionsBlock).toContain("allow create");
    expect(submissionsBlock).toMatch(
      /allow create.*request\.auth\s*!=\s*null/s
    );
  });

  test("allows read for submission owner", () => {
    expect(submissionsBlock).toContain("resource.data.uid == request.auth.uid");
  });

  test("allows read for verified admin emails", () => {
    expect(submissionsBlock).toContain("request.auth.token.email_verified == true");
    expect(submissionsBlock).toContain("li.dongyuan@ufl.edu");
    expect(submissionsBlock).toContain("jingranhuang590@gmail.com");
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
// Config Collection Rules
// ══════════════════════════════════════

describe("Config collection security rules", () => {
  let configBlock;
  beforeAll(() => {
    configBlock = getMatchBlock("config/{docId}");
  });

  test("restricts read to verified admin emails", () => {
    expect(configBlock).toContain("request.auth.token.email_verified == true");
    expect(configBlock).toContain("li.dongyuan@ufl.edu");
    expect(configBlock).toContain("jingranhuang590@gmail.com");
  });

  test("does not allow any writes", () => {
    expect(configBlock).not.toContain("allow write");
    expect(configBlock).not.toContain("allow create");
    expect(configBlock).not.toContain("allow update");
    expect(configBlock).not.toContain("allow delete");
  });

  test("does not expose config to non-admin users", () => {
    // The read rule is scoped to admin emails only
    expect(configBlock).toMatch(/allow read.*email in \[/s);
  });
});

// ══════════════════════════════════════
// Admin Email Consistency
// ══════════════════════════════════════

describe("Admin email consistency", () => {
  test("same admin emails appear in both submissions and config rules", () => {
    const submissionsBlock = getMatchBlock("submissions/{docId}");
    const configBlock = getMatchBlock("config/{docId}");

    // Extract email lists from both blocks
    const emailPattern = /['"]([^'"]+@[^'"]+)['"]/g;
    const submissionEmails = new Set();
    const configEmails = new Set();

    let m;
    while ((m = emailPattern.exec(submissionsBlock)) !== null) {
      submissionEmails.add(m[1]);
    }
    emailPattern.lastIndex = 0;
    while ((m = emailPattern.exec(configBlock)) !== null) {
      configEmails.add(m[1]);
    }

    expect(submissionEmails.size).toBeGreaterThan(0);
    expect(configEmails.size).toBeGreaterThan(0);

    // They should contain the same emails
    for (const email of submissionEmails) {
      expect(configEmails).toContain(email);
    }
    for (const email of configEmails) {
      expect(submissionEmails).toContain(email);
    }
  });

  test("admin emails in rules match those in Cloud Functions", () => {
    const functionsSource = fs.readFileSync(
      path.join(__dirname, "..", "functions", "index.js"),
      "utf-8"
    );

    // Extract ADMIN_EMAILS from functions
    const adminMatch = functionsSource.match(
      /ADMIN_EMAILS\s*=\s*\[([^\]]+)\]/
    );
    expect(adminMatch).not.toBeNull();
    const functionEmails = adminMatch[1]
      .match(/["']([^"']+)["']/g)
      .map((s) => s.replace(/["']/g, ""));

    // Check they appear in rules
    for (const email of functionEmails) {
      expect(rules).toContain(email);
    }
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
