/**
 * Validates the admin page JavaScript for syntax errors.
 *
 * The admin page uses inline JS with Liquid template tags that render
 * to literal values at build time. This test parses the raw template,
 * replaces Liquid tags with safe placeholder values, and validates
 * the resulting JS with Node's vm.Script.
 *
 * This catches the class of bugs where a mismatched brace or paren
 * silently breaks the entire admin page (like the .then() closure bug).
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ADMIN_PATH = path.join(
  __dirname,
  "..",
  "website",
  "_layouts",
  "admin_page.html"
);

let adminHtml;

beforeAll(() => {
  adminHtml = fs.readFileSync(ADMIN_PATH, "utf-8");
});

// ══════════════════════════════════════
// Extract and validate inline JS
// ══════════════════════════════════════

describe("Admin page inline JavaScript syntax", () => {
  test("admin_page.html exists and is non-empty", () => {
    expect(adminHtml.length).toBeGreaterThan(0);
  });

  test("main script block has no syntax errors", () => {
    // Find the main IIFE script block
    const marker = "(function () {";
    const scriptStart = adminHtml.indexOf(marker);
    expect(scriptStart).toBeGreaterThan(-1);

    // Find the closing })(); — it's the LAST one before </script>
    const scriptTagEnd = adminHtml.indexOf("</script>", scriptStart);
    expect(scriptTagEnd).toBeGreaterThan(scriptStart);

    let code = adminHtml.substring(scriptStart, scriptTagEnd).trim();

    // Replace Liquid template tags with safe JS values
    // {{ ... | jsonify }} → "placeholder"
    code = code.replace(/\{\{[^}]+\| jsonify\s*\}\}/g, '"placeholder"');
    // {{ ... }} → "placeholder"
    code = code.replace(/\{\{[^}]*\}\}/g, '"placeholder"');
    // {% ... %} → empty (control flow)
    code = code.replace(/\{%[\s\S]*?%\}/g, "");

    // Verify the code starts and ends correctly
    expect(code).toMatch(/^\(function\s*\(\)\s*\{/);
    expect(code).toMatch(/\}\)\(\);\s*$/);

    // Parse with vm.Script to check syntax
    try {
      new vm.Script(code, { filename: "admin_page_inline.js" });
    } catch (err) {
      // Extract line info for a helpful error message
      const match = err.stack.match(
        /admin_page_inline\.js:(\d+):(\d+)/
      );
      const lines = code.split("\n");
      if (match) {
        const lineNum = parseInt(match[1]);
        const context = lines
          .slice(Math.max(0, lineNum - 4), lineNum + 2)
          .map(
            (l, i) =>
              `${i + Math.max(1, lineNum - 3) === lineNum ? ">>>" : "   "} ${
                i + Math.max(1, lineNum - 3)
              }: ${l}`
          )
          .join("\n");
        throw new Error(
          `JS syntax error at line ${lineNum}: ${err.message}\n\n${context}`
        );
      }
      throw err;
    }
  });

  test("curly braces are balanced in main script", () => {
    const marker = "(function () {";
    const scriptStart = adminHtml.indexOf(marker);
    const scriptTagEnd = adminHtml.indexOf("</script>", scriptStart);
    let code = adminHtml.substring(scriptStart, scriptTagEnd).trim();

    // Remove Liquid tags (they contain braces that aren't JS)
    code = code.replace(/\{\{[\s\S]*?\}\}/g, "X");
    code = code.replace(/\{%[\s\S]*?%\}/g, "X");
    // Remove string literals
    code = code.replace(/'(?:[^'\\]|\\.)*'/g, "''");
    code = code.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    code = code.replace(/`(?:[^`\\]|\\.)*`/g, "``");
    // Remove comments
    code = code.replace(/\/\/.*$/gm, "");
    code = code.replace(/\/\*[\s\S]*?\*\//g, "");

    let braces = 0;
    for (const ch of code) {
      if (ch === "{") braces++;
      if (ch === "}") braces--;
    }

    expect(braces).toBe(0);
  });
});

// ══════════════════════════════════════
// HTML structure checks
// ══════════════════════════════════════

describe("Admin page HTML structure", () => {
  test("has all required view divs", () => {
    expect(adminHtml).toContain('id="view-signin"');
    expect(adminHtml).toContain('id="view-signup"');
    expect(adminHtml).toContain('id="view-forgot"');
    expect(adminHtml).toContain('id="view-dashboard"');
  });

  test("has submission form", () => {
    expect(adminHtml).toContain('id="article-form"');
    expect(adminHtml).toContain('id="article-title"');
    expect(adminHtml).toContain('id="article-category"');
    expect(adminHtml).toContain('id="article-language"');
    expect(adminHtml).toContain('id="article-author"');
    expect(adminHtml).toContain('id="article-description"');
    expect(adminHtml).toContain('id="article-content"');
  });

  test("has co-authors section", () => {
    expect(adminHtml).toContain('id="coauthors-list"');
    expect(adminHtml).toContain('id="coauthor-search-input"');
    expect(adminHtml).toContain('id="coauthor-search-btn"');
    expect(adminHtml).toContain('id="coauthor-search-result"');
    expect(adminHtml).toContain('id="coauthors-limit-note"');
  });

  test("has admin review panel", () => {
    expect(adminHtml).toContain('id="admin-review-panel"');
    expect(adminHtml).toContain('id="review-modal"');
    expect(adminHtml).toContain('id="modal-title"');
    expect(adminHtml).toContain('id="modal-approve"');
    expect(adminHtml).toContain('id="modal-reject"');
    expect(adminHtml).toContain('id="modal-revise"');
    expect(adminHtml).toContain('id="modal-delete"');
  });

  test("has profile section", () => {
    expect(adminHtml).toContain('id="profile-name"');
    expect(adminHtml).toContain('id="profile-email"');
    expect(adminHtml).toContain('id="profile-affiliation"');
    expect(adminHtml).toContain('id="profile-cohort"');
    expect(adminHtml).toContain('id="profile-summary"');
    expect(adminHtml).toContain('id="save-profile-btn"');
  });

  test("has Firebase SDK script tags", () => {
    expect(adminHtml).toContain("firebase-app-compat.js");
    expect(adminHtml).toContain("firebase-auth-compat.js");
    expect(adminHtml).toContain("firebase-firestore-compat.js");
    expect(adminHtml).toContain("firebase-storage-compat.js");
    expect(adminHtml).toContain("firebase-functions-compat.js");
  });

  test("has markdown rendering libraries", () => {
    expect(adminHtml).toContain("marked.min.js");
    expect(adminHtml).toContain("purify.min.js");
  });

  test("has modal-coauthors element", () => {
    expect(adminHtml).toContain('id="modal-coauthors"');
  });
});

// ══════════════════════════════════════
// Security checks
// ══════════════════════════════════════

describe("Admin page security", () => {
  test("uses escapeHtml for dynamic content insertion", () => {
    // The escapeHtml function should be defined
    expect(adminHtml).toContain("function escapeHtml(str)");
  });

  test("uses DOMPurify for markdown rendering", () => {
    expect(adminHtml).toContain("DOMPurify.sanitize");
  });

  test("does not contain inline event handlers", () => {
    // Check that we're not using onclick= etc in HTML attributes
    // (Liquid tags may generate some, but the main HTML shouldn't have them)
    const htmlOnly = adminHtml
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/\{\{[^}]*\}\}/g, "")
      .replace(/\{%[\s\S]*?%\}/g, "");
    expect(htmlOnly).not.toMatch(/\son(click|submit|change|load|error)\s*=/i);
  });

  test("does not use eval()", () => {
    const marker = "(function () {";
    const scriptStart = adminHtml.indexOf(marker);
    const scriptTagEnd = adminHtml.indexOf("</script>", scriptStart);
    const code = adminHtml.substring(scriptStart, scriptTagEnd);
    // Remove string literals to avoid false positives
    const cleaned = code
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/`(?:[^`\\]|\\.)*`/g, "``");
    expect(cleaned).not.toMatch(/\beval\s*\(/);
  });

  test("escapeHtml function is defined and uses safe escaping", () => {
    const marker = "function escapeHtml(str)";
    const fnStart = adminHtml.indexOf(marker);
    expect(fnStart).toBeGreaterThan(-1);
    const fnEnd = adminHtml.indexOf("}", fnStart);
    const fn = adminHtml.substring(fnStart, fnEnd + 1);
    // Should use DOM-based escaping (createTextNode) or string replacement
    const usesDomEscaping = fn.includes("createTextNode") || fn.includes("textContent");
    const usesStringEscaping = fn.includes("replace") && fn.includes("&amp;");
    expect(usesDomEscaping || usesStringEscaping).toBe(true);
  });
});

// ══════════════════════════════════════
// Section-level JS validation
// ══════════════════════════════════════
// The main IIFE is ~2000 lines. When it breaks, a single "syntax error at
// line 1847" is hard to act on. These tests split the script into logical
// sections so failures name the section that broke.

describe("Admin page JS — section-level checks", () => {
  let mainCode;

  beforeAll(() => {
    const marker = "(function () {";
    const start = adminHtml.indexOf(marker);
    const end = adminHtml.indexOf("</script>", start);
    mainCode = adminHtml.substring(start, end).trim();
  });

  // Helper: extract code between two comment markers (e.g. "// ── Sign In ──")
  function sectionBetween(startMarker, endMarker) {
    const s = mainCode.indexOf(startMarker);
    if (s === -1) return null;
    const e = endMarker ? mainCode.indexOf(endMarker, s + startMarker.length) : mainCode.length;
    return mainCode.substring(s, e === -1 ? mainCode.length : e);
  }

  const sections = [
    { name: "Firebase Init & View Management", start: "// ── Firebase Init ──", end: "// ── Navigation between auth views ──" },
    { name: "Auth (sign-in/up/forgot/out)", start: "// ── Navigation between auth views ──", end: "// ── Auth State Listener ──" },
    { name: "Auth State Listener", start: "// ── Auth State Listener ──", end: "// ── Profile ──" },
    { name: "Profile", start: "// ── Profile ──", end: "// ── Profile Links ──" },
    { name: "Profile Links", start: "// ── Profile Links ──", end: "// ── Co-Authors ──" },
    { name: "Co-Authors", start: "// ── Co-Authors ──", end: "// ── Submit Article ──" },
    { name: "Submit Article", start: "// ── Submit Article ──", end: "// ── Article Preview ──" },
    { name: "Article Preview & Featured", start: "// ── Article Preview ──", end: "// ── Character counters ──" },
    { name: "Resubmit & Submissions", start: "// ── Resubmit", end: "// ══════" },
    { name: "Admin Review Panel", start: "// ── Admin Review Panel ──", end: null },
  ];

  test.each(sections)("section '$name' exists in the source", ({ start }) => {
    expect(mainCode).toContain(start);
  });

  test.each(sections)(
    "section '$name' has balanced braces",
    ({ name, start, end }) => {
      const section = sectionBetween(start, end);
      if (!section) return; // section existence tested above

      // Strip Liquid, strings, and comments
      let cleaned = section
        .replace(/\{\{[\s\S]*?\}\}/g, "X")
        .replace(/\{%[\s\S]*?%\}/g, "X")
        .replace(/'(?:[^'\\]|\\.)*'/g, "''")
        .replace(/"(?:[^"\\]|\\.)*"/g, '""')
        .replace(/`(?:[^`\\]|\\.)*`/g, "``")
        .replace(/\/\/.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "");

      let braces = 0;
      let parens = 0;
      let brackets = 0;
      for (const ch of cleaned) {
        if (ch === "{") braces++;
        if (ch === "}") braces--;
        if (ch === "(") parens++;
        if (ch === ")") parens--;
        if (ch === "[") brackets++;
        if (ch === "]") brackets--;
      }
      // Sections cut mid-function so ±1 is expected, but large imbalances
      // (≥3) indicate a real bug. The full-file tests catch exact balance.
      const THRESHOLD = 3;
      expect(Math.abs(braces)).toBeLessThan(THRESHOLD);
      expect(Math.abs(parens)).toBeLessThan(THRESHOLD);
      expect(Math.abs(brackets)).toBeLessThan(THRESHOLD);
    }
  );

  test("parentheses are balanced in main script", () => {
    let cleaned = mainCode
      .replace(/\{\{[\s\S]*?\}\}/g, "X")
      .replace(/\{%[\s\S]*?%\}/g, "X")
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/`(?:[^`\\]|\\.)*`/g, "``")
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");

    let parens = 0;
    for (const ch of cleaned) {
      if (ch === "(") parens++;
      if (ch === ")") parens--;
    }
    expect(parens).toBe(0);
  });

  test("square brackets are balanced in main script", () => {
    let cleaned = mainCode
      .replace(/\{\{[\s\S]*?\}\}/g, "X")
      .replace(/\{%[\s\S]*?%\}/g, "X")
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/`(?:[^`\\]|\\.)*`/g, "``")
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");

    let brackets = 0;
    for (const ch of cleaned) {
      if (ch === "[") brackets++;
      if (ch === "]") brackets--;
    }
    expect(brackets).toBe(0);
  });
});

// ══════════════════════════════════════
// Key function definitions
// ══════════════════════════════════════

describe("Admin page JS — required functions exist", () => {
  const requiredFunctions = [
    "makeSlug",
    "makeAuthorSlug",
    "hasLatinDisplayName",
    "getAuthorSlugBase",
    "ensureUniqueAuthorSlug",
    "showView",
    "clearErrors",
    "showError",
    "showSuccess",
    "friendlyError",
    "getStatusLabel",
    "setLoading",
    "buildDefaultProfile",
    "loadProfile",
    "renderProfileData",
    "showAvatarImage",
    "showAvatarPlaceholder",
    "createLinkRow",
    "loadProfileLinks",
    "getProfileLinks",
    "getCoauthors",
    "createCoauthorRow",
    "coauthorSearchLookup",
    "addPendingCoauthor",
    "addSelfAsCoauthor",
    "updateCoauthorNumbers",
    "updateLimitNote",
    "loadSubmissions",
    "escapeHtml",
    "checkAdmin",
    "loadReviewList",
    "openReviewModal",
    "closeReviewModal",
    "openContentPreview",
    "resubmitArticle",
    "getArticleFields",
    "openPreviewTab",
    "initFeaturedPanel",
    "loadFeaturedPanel",
    "renderFeaturedList",
    "toggleFeatured",
    "getAuthorRole",
    "renderRevisionThread",
    "renderSubmissionThread",
    "initReviewTabs",
    "updateCharCounter",
  ];

  test.each(requiredFunctions)(
    "function %s is defined",
    (fnName) => {
      // Match "function fnName(" pattern
      const regex = new RegExp(`function\\s+${fnName}\\s*\\(`);
      expect(adminHtml).toMatch(regex);
    }
  );
});

describe("Admin page JS — author_id generation uses makeAuthorSlug", () => {
  test("signup derives its base author_id with makeAuthorSlug", () => {
    expect(adminHtml).toMatch(/var\s+baseSlug\s*=\s*makeAuthorSlug\(displayName\)/);
  });

  test("profile save uses makeAuthorSlug for author_id", () => {
    expect(adminHtml).toMatch(/var\s+baseId\s*=\s*makeAuthorSlug\(name\)/);
  });

  test("missing-profile bootstrap creates an author_id", () => {
    expect(adminHtml).toMatch(/function\s+buildDefaultProfile\(user\)[\s\S]*author_id:\s*authorId/);
  });
});

describe("Admin page JS — display name validation and slug normalization", () => {
  let makeAuthorSlug;
  let hasLatinDisplayName;

  beforeAll(() => {
    const sandbox = {};
    const makeAuthorSlugMatch = adminHtml.match(
      /function makeAuthorSlug\(text\)\s*\{[\s\S]*?\n  \}/
    );
    expect(makeAuthorSlugMatch).not.toBeNull();
    eval("sandbox.makeAuthorSlug = " + makeAuthorSlugMatch[0]);

    const hasLatinMatch = adminHtml.match(
      /function hasLatinDisplayName\(text\)\s*\{[\s\S]*?\n  \}/
    );
    expect(hasLatinMatch).not.toBeNull();
    const hasLatinFn = hasLatinMatch[0].replace(
      /makeAuthorSlug\(/g,
      "sandbox.makeAuthorSlug("
    );
    eval("sandbox.hasLatinDisplayName = " + hasLatinFn);

    makeAuthorSlug = sandbox.makeAuthorSlug;
    hasLatinDisplayName = sandbox.hasLatinDisplayName;
  });

  test("transliterates accented Latin names for author_id generation", () => {
    expect(makeAuthorSlug("José Álvarez")).toBe("jose-alvarez");
  });

  test("strips non-Latin characters from mixed-script names", () => {
    expect(makeAuthorSlug("William Huang 黃靖然")).toBe("william-huang");
  });

  test("returns empty slug for pure non-Latin names", () => {
    expect(makeAuthorSlug("李东元")).toBe("");
    expect(makeAuthorSlug("Алексей")).toBe("");
  });

  test("accepts mixed or accented Latin display names", () => {
    expect(hasLatinDisplayName("William Huang 黃靖然")).toBe(true);
    expect(hasLatinDisplayName("José Álvarez")).toBe(true);
  });

  test("rejects pure non-Latin or numeric display names", () => {
    expect(hasLatinDisplayName("李东元")).toBe(false);
    expect(hasLatinDisplayName("12345")).toBe(false);
  });

  test("signup validates display names with the Latin-letter helper", () => {
    expect(adminHtml).toMatch(/if\s*\(!hasLatinDisplayName\(displayName\)\)/);
  });

  test("profile save validates display names with the Latin-letter helper", () => {
    expect(adminHtml).toMatch(/if\s*\(name\s*&&\s*!hasLatinDisplayName\(name\)\)/);
  });
});

describe("Admin page JS — my submissions query resilience", () => {
  test("loads submissions without composite orderBy requirements", () => {
    expect(adminHtml).toContain(
      "var ownQuery = db.collection('submissions').where('uid', '==', uid).get();"
    );
    expect(adminHtml).toContain(
      "var coauthorQuery = db.collection('submissions').where('coauthorUids', 'array-contains', uid).get();"
    );
  });

  test("uses Promise.allSettled so one failing query does not blank the whole list", () => {
    expect(adminHtml).toContain("Promise.allSettled([ownQuery, coauthorQuery])");
  });
});

// ══════════════════════════════════════
// HTML ↔ JS ID cross-reference
// ══════════════════════════════════════

describe("Admin page JS — getElementById calls reference existing HTML IDs", () => {
  let htmlIds;
  let jsIds;

  beforeAll(() => {
    // Collect all id="..." from the HTML portion (before the main IIFE)
    const idPattern = /id="([^"]+)"/g;
    htmlIds = new Set();
    let m;
    while ((m = idPattern.exec(adminHtml)) !== null) {
      htmlIds.add(m[1]);
    }

    // Collect all getElementById('...') calls from the main script
    const marker = "(function () {";
    const start = adminHtml.indexOf(marker);
    const end = adminHtml.indexOf("</script>", start);
    const code = adminHtml.substring(start, end);

    const getElPattern = /getElementById\(['"]([^'"]+)['"]\)/g;
    jsIds = new Set();
    while ((m = getElPattern.exec(code)) !== null) {
      jsIds.add(m[1]);
    }
  });

  test("all getElementById IDs in JS exist in the HTML", () => {
    // IDs that are dynamically created in JS (not present in static HTML).
    // rs-* IDs are built inside resubmitArticle() via document.write into a new window.
    const dynamicIds = new Set([
      "coauthor-add-found",
      "coauthor-result-dismiss",
      "rs-hero-title",
      "rs-app",
      "rs-title",
      "rs-cat",
      "rs-lang",
      "rs-desc",
      "rs-content",
      "rs-preview",
      "rs-msg",
      "rs-counter",
      "rs-form",
      "rs-error",
      "rs-submit",
      "rs-close-tab",
    ]);
    const missing = [];
    for (const id of jsIds) {
      if (!htmlIds.has(id) && !dynamicIds.has(id)) {
        missing.push(id);
      }
    }
    if (missing.length > 0) {
      throw new Error(
        `JS references ${missing.length} element ID(s) not found in HTML:\n  ${missing.join("\n  ")}`
      );
    }
  });
});

// ══════════════════════════════════════
// ADMIN_I18N key coverage
// ══════════════════════════════════════

describe("Admin page JS — ADMIN_I18N keys", () => {
  let i18nDefinedKeys;
  let i18nUsedKeys;

  beforeAll(() => {
    // Extract keys from the ADMIN_I18N = { ... } definition block
    const i18nStart = adminHtml.indexOf("var ADMIN_I18N = {");
    const i18nEnd = adminHtml.indexOf("};", i18nStart);
    const i18nBlock = adminHtml.substring(i18nStart, i18nEnd);
    const keyPattern = /^\s*(\w+)\s*:/gm;
    i18nDefinedKeys = new Set();
    let m;
    while ((m = keyPattern.exec(i18nBlock)) !== null) {
      i18nDefinedKeys.add(m[1]);
    }

    // Extract all ADMIN_I18N.xxx usages in the main IIFE
    const marker = "(function () {";
    const start = adminHtml.indexOf(marker);
    const end = adminHtml.indexOf("</script>", start);
    const code = adminHtml.substring(start, end);
    const usagePattern = /ADMIN_I18N\.(\w+)/g;
    i18nUsedKeys = new Set();
    while ((m = usagePattern.exec(code)) !== null) {
      i18nUsedKeys.add(m[1]);
    }
  });

  test("ADMIN_I18N object defines at least 20 keys", () => {
    expect(i18nDefinedKeys.size).toBeGreaterThanOrEqual(20);
  });

  test("all ADMIN_I18N keys used in JS are defined in the i18n block", () => {
    // Keys accessed via bracket notation (ADMIN_I18N['status_' + x]) are dynamic
    const dynamicPrefixes = ["status_", "filter_"];
    const missing = [];
    for (const key of i18nUsedKeys) {
      if (i18nDefinedKeys.has(key)) continue;
      // Skip keys that are clearly dynamic lookups
      if (dynamicPrefixes.some((p) => key.startsWith(p))) continue;
      missing.push(key);
    }
    if (missing.length > 0) {
      throw new Error(
        `JS uses ${missing.length} ADMIN_I18N key(s) not defined in the template:\n  ${missing.join("\n  ")}`
      );
    }
  });
});
