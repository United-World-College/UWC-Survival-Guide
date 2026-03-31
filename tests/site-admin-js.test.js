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
    expect(adminHtml).toContain('id="add-coauthor-btn"');
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
});
