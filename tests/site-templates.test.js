/**
 * Validates Jekyll template files for required elements and patterns.
 */

const fs = require("fs");
const path = require("path");
const { globSync } = require("glob");

const LAYOUTS_DIR = path.join(__dirname, "..", "website", "_layouts");
const INCLUDES_DIR = path.join(__dirname, "..", "website", "_includes");

// ══════════════════════════════════════
// guide.html template
// ══════════════════════════════════════

describe("guide.html template", () => {
  let template;

  beforeAll(() => {
    template = fs.readFileSync(path.join(LAYOUTS_DIR, "guide.html"), "utf-8");
  });

  test("includes head.html", () => {
    expect(template).toContain("{% include head.html %}");
  });

  test("includes nav.html", () => {
    expect(template).toContain("{% include nav.html %}");
  });

  test("includes footer.html", () => {
    expect(template).toContain("{% include footer.html %}");
  });

  test("displays article title", () => {
    expect(template).toContain("{{ page.title }}");
  });

  test("displays author name with link", () => {
    expect(template).toContain("current_author_name");
    expect(template).toContain("guide-author-link");
  });

  test("displays coauthors when present", () => {
    expect(template).toContain("page.coauthors");
  });

  test("displays category", () => {
    expect(template).toContain("page.category");
  });

  test("displays editor when present", () => {
    expect(template).toContain("page.editor");
  });

  test("displays published/updated dates", () => {
    expect(template).toContain("published_at");
    expect(template).toContain("updated_at");
  });

  test("displays submitted date when present", () => {
    expect(template).toContain("submitted_at");
  });

  test("renders article content", () => {
    expect(template).toContain("{{ content }}");
  });

  test("has language switching support", () => {
    expect(template).toContain("language_code");
    expect(template).toContain("current_guide_id");
  });
});

// ══════════════════════════════════════
// author.html template
// ══════════════════════════════════════

describe("author.html template", () => {
  let template;

  beforeAll(() => {
    template = fs.readFileSync(path.join(LAYOUTS_DIR, "author.html"), "utf-8");
  });

  test("includes head.html", () => {
    expect(template).toContain("{% include head.html %}");
  });

  test("includes nav.html", () => {
    expect(template).toContain("{% include nav.html %}");
  });

  test("includes footer.html", () => {
    expect(template).toContain("{% include footer.html %}");
  });

  test("displays author name", () => {
    expect(template).toContain("page.title");
  });

  test("references author_id for article lookup", () => {
    expect(template).toContain("author_id");
  });
});

// ══════════════════════════════════════
// admin_page.html template
// ══════════════════════════════════════

describe("admin_page.html template", () => {
  let template;

  beforeAll(() => {
    template = fs.readFileSync(
      path.join(LAYOUTS_DIR, "admin_page.html"),
      "utf-8"
    );
  });

  test("includes head.html", () => {
    expect(template).toContain("{% include head.html %}");
  });

  test("includes nav.html", () => {
    expect(template).toContain("{% include nav.html %}");
  });

  test("includes footer.html", () => {
    expect(template).toContain("{% include footer.html %}");
  });

  test("initializes Firebase with config", () => {
    expect(template).toContain("firebase.initializeApp");
    expect(template).toContain("apiKey");
    expect(template).toContain("projectId");
  });

  test("sets up auth state listener", () => {
    expect(template).toContain("auth.onAuthStateChanged");
  });

  test("has sign-in form handler", () => {
    expect(template).toContain("signInWithEmailAndPassword");
  });

  test("has sign-up form handler", () => {
    expect(template).toContain("createUserWithEmailAndPassword");
  });

  test("has password reset handler", () => {
    expect(template).toContain("sendPasswordResetEmail");
  });

  test("has article submission handler", () => {
    expect(template).toContain("article-form");
    expect(template).toContain("db.collection('submissions').add");
  });

  test("has coauthors handling logic", () => {
    expect(template).toContain("getCoauthors");
    expect(template).toContain("createCoauthorRow");
    expect(template).toContain("MAX_COAUTHORS");
  });

  test("has admin review functions", () => {
    expect(template).toContain("checkAdminStatus");
    expect(template).toContain("approveSubmission");
    expect(template).toContain("rejectSubmission");
    expect(template).toContain("requestRevision");
    expect(template).toContain("deleteSubmission");
  });

  test("has resubmit article flow", () => {
    expect(template).toContain("resubmitArticle");
  });

  test("renders approval and rejection notes in submission timelines", () => {
    expect(template).toContain("renderSubmissionDecisionFeedback");
    expect(template).toContain("approveMessage");
    expect(template).toContain("rejectionReason");
  });

  test("localises strings via ADMIN_I18N", () => {
    expect(template).toContain("var ADMIN_I18N");
  });
});

// ══════════════════════════════════════
// Include files exist
// ══════════════════════════════════════

describe("Required include files exist", () => {
  const requiredIncludes = ["head.html", "nav.html", "footer.html"];

  test.each(requiredIncludes)("_includes/%s exists", (file) => {
    expect(fs.existsSync(path.join(INCLUDES_DIR, file))).toBe(true);
  });
});

// ══════════════════════════════════════
// head.html content validation
// ══════════════════════════════════════

describe("head.html include", () => {
  let head;

  beforeAll(() => {
    head = fs.readFileSync(path.join(INCLUDES_DIR, "head.html"), "utf-8");
  });

  test("has charset meta tag", () => {
    expect(head).toContain('charset="UTF-8"');
  });

  test("has viewport meta tag for responsive design", () => {
    expect(head).toContain("viewport");
    expect(head).toContain("width=device-width");
  });

  test("has title tag", () => {
    expect(head).toContain("<title>");
  });

  test("links to main stylesheet", () => {
    expect(head).toContain("styles.css");
  });
});

// ══════════════════════════════════════
// nav.html content validation
// ══════════════════════════════════════

describe("nav.html include", () => {
  let nav;

  beforeAll(() => {
    nav = fs.readFileSync(path.join(INCLUDES_DIR, "nav.html"), "utf-8");
  });

  test("has nav element", () => {
    expect(nav).toContain('<nav class="nav">');
  });

  test("has language switching support", () => {
    expect(nav).toContain("nav-language-switch");
    expect(nav).toContain("translation_items");
  });

  test("has mobile menu toggle", () => {
    expect(nav).toContain("nav-toggle");
    expect(nav).toContain("mobile-menu");
  });

  test("has navigation links", () => {
    expect(nav).toContain("nav-links");
    expect(nav).toContain("current_locale.nav");
  });
});

// ══════════════════════════════════════
// CSS validation
// ══════════════════════════════════════

describe("CSS file", () => {
  let css;

  beforeAll(() => {
    css = fs.readFileSync(
      path.join(__dirname, "..", "website", "assets", "css", "styles.css"),
      "utf-8"
    );
  });

  test("has admin panel styles", () => {
    expect(css).toContain(".admin-wrapper");
    expect(css).toContain(".admin-card");
    expect(css).toContain(".admin-btn");
    expect(css).toContain(".admin-input");
  });

  test("has co-author styles", () => {
    expect(css).toContain(".admin-coauthor-row");
    expect(css).toContain(".admin-coauthor-order");
    expect(css).toContain(".admin-coauthor-name");
    expect(css).toContain(".admin-coauthor-move");
  });

  test("has submission status styles", () => {
    expect(css).toContain(".admin-status");
  });

  test("has modal styles", () => {
    expect(css).toContain(".admin-modal");
  });

  test("has responsive breakpoints", () => {
    expect(css).toContain("@media");
    expect(css).toContain("max-width");
  });

  test("balanced braces in CSS", () => {
    // Remove comments and strings
    let cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");
    cleaned = cleaned.replace(/"[^"]*"/g, '""');
    cleaned = cleaned.replace(/'[^']*'/g, "''");

    let braces = 0;
    for (const ch of cleaned) {
      if (ch === "{") braces++;
      if (ch === "}") braces--;
    }
    expect(braces).toBe(0);
  });
});
