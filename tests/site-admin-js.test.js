/**
 * Validates the admin page JavaScript for syntax errors.
 *
 * The admin page uses:
 * - Inline scripts with Liquid template tags (data injection)
 * - An external JS file (assets/js/admin.js) containing the main IIFE
 *
 * This test loads both sources and validates syntax, structure, and
 * cross-references between the HTML and JS.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ADMIN_HTML_PATH = path.join(
  __dirname,
  "..",
  "website",
  "_layouts",
  "admin_page.html"
);

const ADMIN_JS_PATH = path.join(
  __dirname,
  "..",
  "website",
  "assets",
  "js",
  "admin.js"
);

let adminHtml;
let adminJs;

beforeAll(() => {
  adminHtml = fs.readFileSync(ADMIN_HTML_PATH, "utf-8");
  adminJs = fs.readFileSync(ADMIN_JS_PATH, "utf-8");
});

// ══════════════════════════════════════
// Extract and validate JS syntax
// ══════════════════════════════════════

describe("Admin page inline JavaScript syntax", () => {
  test("admin_page.html exists and is non-empty", () => {
    expect(adminHtml.length).toBeGreaterThan(0);
  });

  test("admin.js exists and is non-empty", () => {
    expect(adminJs.length).toBeGreaterThan(0);
  });

  test("main script block has no syntax errors", () => {
    let code = adminJs.trim();

    // Verify the code starts and ends correctly
    expect(code).toMatch(/^\(function\s*\(\)\s*\{/);
    expect(code).toMatch(/\}\)\(\);\s*$/);

    // Parse with vm.Script to check syntax
    try {
      new vm.Script(code, { filename: "admin.js" });
    } catch (err) {
      const match = err.stack.match(/admin\.js:(\d+):(\d+)/);
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
    let code = adminJs.trim();

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

  test("loads external admin.js", () => {
    expect(adminHtml).toContain("admin.js");
  });
});

// ══════════════════════════════════════
// Security checks
// ══════════════════════════════════════

describe("Admin page security", () => {
  test("uses escapeHtml for dynamic content insertion", () => {
    expect(adminJs).toContain("function escapeHtml(str)");
  });

  test("uses DOMPurify for markdown rendering", () => {
    expect(adminJs).toContain("DOMPurify.sanitize");
  });

  test("does not contain inline event handlers", () => {
    const htmlOnly = adminHtml
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/\{\{[^}]*\}\}/g, "")
      .replace(/\{%[\s\S]*?%\}/g, "");
    expect(htmlOnly).not.toMatch(/\son(click|submit|change|load|error)\s*=/i);
  });

  test("does not use eval()", () => {
    const cleaned = adminJs
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/`(?:[^`\\]|\\.)*`/g, "``");
    expect(cleaned).not.toMatch(/\beval\s*\(/);
  });

  test("escapeHtml function is defined and uses safe escaping", () => {
    const marker = "function escapeHtml(str)";
    const fnStart = adminJs.indexOf(marker);
    expect(fnStart).toBeGreaterThan(-1);
    const fnEnd = adminJs.indexOf("}", fnStart);
    const fn = adminJs.substring(fnStart, fnEnd + 1);
    const usesDomEscaping = fn.includes("createTextNode") || fn.includes("textContent");
    const usesStringEscaping = fn.includes("replace") && fn.includes("&amp;");
    expect(usesDomEscaping || usesStringEscaping).toBe(true);
  });
});

// ══════════════════════════════════════
// Section-level JS validation
// ══════════════════════════════════════

describe("Admin page JS — section-level checks", () => {
  let mainCode;

  beforeAll(() => {
    mainCode = adminJs.trim();
  });

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
      if (!section) return;

      let cleaned = section
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
      const THRESHOLD = 3;
      expect(Math.abs(braces)).toBeLessThan(THRESHOLD);
      expect(Math.abs(parens)).toBeLessThan(THRESHOLD);
      expect(Math.abs(brackets)).toBeLessThan(THRESHOLD);
    }
  );

  test("parentheses are balanced in main script", () => {
    let cleaned = mainCode
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
      const regex = new RegExp(`function\\s+${fnName}\\s*\\(`);
      expect(adminJs).toMatch(regex);
    }
  );
});

describe("Admin page JS — author_id generation uses makeAuthorSlug", () => {
  test("signup derives its base author_id with makeAuthorSlug", () => {
    expect(adminJs).toMatch(/var\s+baseSlug\s*=\s*makeAuthorSlug\(displayName\)/);
  });

  test("profile save uses makeAuthorSlug for author_id", () => {
    expect(adminJs).toMatch(/var\s+baseId\s*=\s*makeAuthorSlug\(name\)/);
  });

  test("missing-profile bootstrap creates an author_id", () => {
    expect(adminJs).toMatch(/function\s+buildDefaultProfile\(user\)[\s\S]*author_id:\s*authorId/);
  });
});

describe("Admin page JS — display name validation and slug normalization", () => {
  let makeAuthorSlug;
  let hasLatinDisplayName;

  beforeAll(() => {
    const sandbox = {};
    const makeAuthorSlugMatch = adminJs.match(
      /function makeAuthorSlug\(text\)\s*\{[\s\S]*?\n  \}/
    );
    expect(makeAuthorSlugMatch).not.toBeNull();
    eval("sandbox.makeAuthorSlug = " + makeAuthorSlugMatch[0]);

    const hasLatinMatch = adminJs.match(
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
    expect(adminJs).toMatch(/if\s*\(!hasLatinDisplayName\(displayName\)\)/);
  });

  test("profile save validates display names with the Latin-letter helper", () => {
    expect(adminJs).toMatch(/if\s*\(name\s*&&\s*!hasLatinDisplayName\(name\)\)/);
  });
});

describe("Admin page JS — my submissions query resilience", () => {
  test("loads submissions without composite orderBy requirements", () => {
    expect(adminJs).toContain(
      "var ownQuery = db.collection('submissions').where('uid', '==', uid).get();"
    );
    expect(adminJs).toContain(
      "var coauthorQuery = db.collection('submissions').where('coauthorUids', 'array-contains', uid).get();"
    );
  });

  test("uses Promise.allSettled so one failing query does not blank the whole list", () => {
    expect(adminJs).toContain("Promise.allSettled([ownQuery, coauthorQuery])");
  });
});

// ══════════════════════════════════════
// HTML ↔ JS ID cross-reference
// ══════════════════════════════════════

describe("Admin page JS — getElementById calls reference existing HTML IDs", () => {
  let htmlIds;
  let jsIds;

  beforeAll(() => {
    // Collect all id="..." from the HTML
    const idPattern = /id="([^"]+)"/g;
    htmlIds = new Set();
    let m;
    while ((m = idPattern.exec(adminHtml)) !== null) {
      htmlIds.add(m[1]);
    }

    // Collect all getElementById('...') calls from the external JS
    const getElPattern = /getElementById\(['"]([^'"]+)['"]\)/g;
    jsIds = new Set();
    while ((m = getElPattern.exec(adminJs)) !== null) {
      jsIds.add(m[1]);
    }
  });

  test("all getElementById IDs in JS exist in the HTML", () => {
    // IDs that are dynamically created in JS (not present in static HTML).
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
    // Extract keys from the ADMIN_I18N = { ... } definition block (in the HTML)
    const i18nStart = adminHtml.indexOf("var ADMIN_I18N = {");
    const i18nEnd = adminHtml.indexOf("};", i18nStart);
    const i18nBlock = adminHtml.substring(i18nStart, i18nEnd);
    const keyPattern = /^\s*(\w+)\s*:/gm;
    i18nDefinedKeys = new Set();
    let m;
    while ((m = keyPattern.exec(i18nBlock)) !== null) {
      i18nDefinedKeys.add(m[1]);
    }

    // Extract all ADMIN_I18N.xxx usages in the external JS
    const usagePattern = /ADMIN_I18N\.(\w+)/g;
    i18nUsedKeys = new Set();
    while ((m = usagePattern.exec(adminJs)) !== null) {
      i18nUsedKeys.add(m[1]);
    }
  });

  test("ADMIN_I18N object defines at least 20 keys", () => {
    expect(i18nDefinedKeys.size).toBeGreaterThanOrEqual(20);
  });

  test("all ADMIN_I18N keys used in JS are defined in the i18n block", () => {
    const dynamicPrefixes = ["status_", "filter_"];
    const missing = [];
    for (const key of i18nUsedKeys) {
      if (i18nDefinedKeys.has(key)) continue;
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
