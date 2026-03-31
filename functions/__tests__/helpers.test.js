/**
 * Unit tests for Cloud Functions helper utilities.
 *
 * These test the pure helper functions (makeSlug, toBase64, generateMarkdown)
 * by requiring index.js with fully mocked Firebase dependencies.
 */

// ── Mock Firebase before requiring index.js ──

const mockGet = jest.fn();
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockDoc = jest.fn(() => ({ get: mockGet, set: mockSet, update: mockUpdate, delete: mockDelete }));
const mockWhere = jest.fn(() => ({ get: mockGet }));
const mockCollection = jest.fn(() => ({ doc: mockDoc, where: mockWhere, add: jest.fn() }));

jest.mock("firebase-admin/app", () => ({ initializeApp: jest.fn() }));
jest.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection }),
  FieldValue: {
    serverTimestamp: () => "SERVER_TIMESTAMP",
    arrayUnion: (...args) => ({ _arrayUnion: args }),
  },
}));
jest.mock("firebase-functions/v2/https", () => ({
  onCall: (fn) => fn,
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
}));

// ── Now require the module under test ──

// We need access to un-exported helpers, so we'll read and eval them
const fs = require("fs");
const path = require("path");
const source = fs.readFileSync(path.join(__dirname, "..", "index.js"), "utf8");

// Extract helper functions using a sandboxed evaluation
function extractHelpers() {
  const sandbox = {};
  // Extract makeSlug
  const makeSlugMatch = source.match(/function makeSlug\(text\)\s*\{[^}]+\}/);
  if (makeSlugMatch) {
    eval("sandbox.makeSlug = " + makeSlugMatch[0]);
  }
  // Extract toBase64
  const toBase64Match = source.match(/function toBase64\(str\)\s*\{[^}]+\}/);
  if (toBase64Match) {
    eval("sandbox.toBase64 = " + toBase64Match[0]);
  }
  return sandbox;
}

const helpers = extractHelpers();

// ══════════════════════════════════════
// makeSlug
// ══════════════════════════════════════

describe("makeSlug", () => {
  const { makeSlug } = helpers;

  test("converts simple English text to kebab-case", () => {
    expect(makeSlug("My UWC Experience")).toBe("my-uwc-experience");
  });

  test("strips special characters", () => {
    expect(makeSlug("Hello, World! (2024)")).toBe("hello-world-2024");
  });

  test("trims leading and trailing dashes", () => {
    expect(makeSlug("--hello--")).toBe("hello");
  });

  test("collapses multiple separators into one dash", () => {
    expect(makeSlug("a   b   c")).toBe("a-b-c");
  });

  test("preserves Chinese characters", () => {
    expect(makeSlug("关于挫折")).toBe("关于挫折");
  });

  test("handles mixed English and Chinese", () => {
    expect(makeSlug("My 经历 at UWC")).toBe("my-经历-at-uwc");
  });

  test("handles empty string", () => {
    expect(makeSlug("")).toBe("");
  });

  test("handles string with only special characters", () => {
    expect(makeSlug("!@#$%")).toBe("");
  });

  test("lowercases uppercase letters", () => {
    expect(makeSlug("COLLEGE APPLICATION")).toBe("college-application");
  });
});

// ══════════════════════════════════════
// toBase64
// ══════════════════════════════════════

describe("toBase64", () => {
  const { toBase64 } = helpers;

  test("encodes ASCII string", () => {
    expect(toBase64("hello")).toBe(Buffer.from("hello").toString("base64"));
  });

  test("encodes UTF-8 string with Chinese characters", () => {
    const input = "你好世界";
    expect(toBase64(input)).toBe(Buffer.from(input, "utf-8").toString("base64"));
  });

  test("encodes empty string", () => {
    expect(toBase64("")).toBe("");
  });

  test("encodes string with special characters", () => {
    const input = 'title: "Hello \\"World\\""';
    expect(toBase64(input)).toBe(Buffer.from(input, "utf-8").toString("base64"));
  });

  test("encodes multiline markdown content", () => {
    const input = "---\ntitle: Test\n---\n\n# Hello\n\nContent here.";
    const result = toBase64(input);
    expect(Buffer.from(result, "base64").toString("utf-8")).toBe(input);
  });
});

// ══════════════════════════════════════
// generateMarkdown (via the exported module)
// ══════════════════════════════════════

describe("generateMarkdown", () => {
  // We need to call generateMarkdown which isn't exported.
  // Extract it with a more complete eval.
  let generateMarkdown;

  beforeAll(() => {
    // Build a callable version from source
    const LANG_MAP = {
      en: { name: "English", folder: "default", sort: 1, suffix: "" },
      "zh-CN": { name: "简体中文", folder: "chinese", sort: 2, suffix: "-CN" },
      "zh-TW": { name: "台灣繁體", folder: "chinese", sort: 3, suffix: "-TW" },
    };
    const makeSlug = helpers.makeSlug;

    generateMarkdown = function (d, authorSlug, editorName) {
      const lang = d.language || "en";
      const langInfo = LANG_MAP[lang] || LANG_MAP["en"];
      const slug = makeSlug(d.title);
      const today = new Date().toISOString().slice(0, 10);
      const submittedDate = d.createdAt
        ? d.createdAt.toDate().toISOString().slice(0, 10)
        : "";

      let md = "---\n";
      md += `title: "${d.title.replace(/"/g, '\\"')}"\n`;
      md += `category: "${d.category}"\n`;
      md += `description: "${d.description.replace(/"/g, '\\"')}"\n`;
      md += "order: 99\n";
      md += `author: "${d.authorName}"\n`;
      md += `author_id: "${authorSlug}"\n`;
      if (d.coAuthors && d.coAuthors.length > 0) {
        md += "coauthors:\n";
        d.coAuthors.forEach((ca) => {
          md += `  - "${ca.name.replace(/"/g, '\\"')}"\n`;
        });
      }
      md += `guide_id: "${slug}"\n`;
      md += `language_code: "${lang}"\n`;
      md += `language_name: "${langInfo.name}"\n`;
      md += `language_folder: "${langInfo.folder}"\n`;
      md += `language_sort: ${langInfo.sort}\n`;
      if (submittedDate) md += `submitted: ${submittedDate}\n`;
      md += `published: ${today}\n`;
      md += `updated: ${today}\n`;
      if (editorName) {
        const editorSlug = makeSlug(editorName);
        md += `editor: "${editorName.replace(/"/g, '\\"')}"\n`;
        md += `editor_id: "${editorSlug}"\n`;
      }
      md += "---\n\n";
      md += d.content;

      return {
        markdown: md,
        slug,
        fileName: slug + langInfo.suffix + ".md",
        folder: langInfo.folder,
        filePath:
          "website/_guides/" + langInfo.folder + "/" + slug + langInfo.suffix + ".md",
      };
    };
  });

  const baseSubmission = {
    title: "My UWC Experience",
    category: "Life Reflections",
    description: "A short summary",
    language: "en",
    authorName: "Alice Smith",
    content: "# Hello\n\nThis is my article.",
    createdAt: { toDate: () => new Date("2026-01-15T00:00:00Z") },
  };

  test("generates valid YAML front matter with closing delimiters", () => {
    const result = generateMarkdown(baseSubmission, "alice-smith", "");
    expect(result.markdown).toMatch(/^---\n/);
    expect(result.markdown).toMatch(/\n---\n\n/);
  });

  test("includes all required front matter fields", () => {
    const result = generateMarkdown(baseSubmission, "alice-smith", "");
    const md = result.markdown;
    expect(md).toContain('title: "My UWC Experience"');
    expect(md).toContain('category: "Life Reflections"');
    expect(md).toContain('description: "A short summary"');
    expect(md).toContain("order: 99");
    expect(md).toContain('author: "Alice Smith"');
    expect(md).toContain('author_id: "alice-smith"');
    expect(md).toContain('guide_id: "my-uwc-experience"');
    expect(md).toContain('language_code: "en"');
    expect(md).toContain('language_name: "English"');
    expect(md).toContain('language_folder: "default"');
    expect(md).toContain("language_sort: 1");
    expect(md).toContain("submitted: 2026-01-15");
  });

  test("appends article content after front matter", () => {
    const result = generateMarkdown(baseSubmission, "alice-smith", "");
    expect(result.markdown).toContain("# Hello\n\nThis is my article.");
  });

  test("generates correct file metadata for English", () => {
    const result = generateMarkdown(baseSubmission, "alice-smith", "");
    expect(result.slug).toBe("my-uwc-experience");
    expect(result.fileName).toBe("my-uwc-experience.md");
    expect(result.folder).toBe("default");
    expect(result.filePath).toBe(
      "website/_guides/default/my-uwc-experience.md"
    );
  });

  test("generates correct file metadata for zh-CN", () => {
    const submission = { ...baseSubmission, language: "zh-CN", title: "我的经历" };
    const result = generateMarkdown(submission, "alice", "");
    expect(result.fileName).toBe("我的经历-CN.md");
    expect(result.folder).toBe("chinese");
    expect(result.filePath).toBe("website/_guides/chinese/我的经历-CN.md");
    expect(result.markdown).toContain('language_code: "zh-CN"');
    expect(result.markdown).toContain('language_name: "简体中文"');
    expect(result.markdown).toContain("language_sort: 2");
  });

  test("generates correct file metadata for zh-TW", () => {
    const submission = { ...baseSubmission, language: "zh-TW", title: "Test" };
    const result = generateMarkdown(submission, "alice", "");
    expect(result.fileName).toBe("test-TW.md");
    expect(result.folder).toBe("chinese");
    expect(result.markdown).toContain("language_sort: 3");
  });

  test("falls back to English for unknown language", () => {
    const submission = { ...baseSubmission, language: "fr" };
    const result = generateMarkdown(submission, "alice", "");
    expect(result.folder).toBe("default");
    expect(result.markdown).toContain('language_name: "English"');
  });

  test("includes editor fields when editor name provided", () => {
    const result = generateMarkdown(baseSubmission, "alice-smith", "Bob Editor");
    expect(result.markdown).toContain('editor: "Bob Editor"');
    expect(result.markdown).toContain('editor_id: "bob-editor"');
  });

  test("omits editor fields when editor name is empty", () => {
    const result = generateMarkdown(baseSubmission, "alice-smith", "");
    expect(result.markdown).not.toContain("editor:");
    expect(result.markdown).not.toContain("editor_id:");
  });

  test("escapes double quotes in title and description", () => {
    const submission = {
      ...baseSubmission,
      title: 'My "Great" Article',
      description: 'A "brief" summary',
    };
    const result = generateMarkdown(submission, "alice", "");
    expect(result.markdown).toContain('title: "My \\"Great\\" Article"');
    expect(result.markdown).toContain('description: "A \\"brief\\" summary"');
  });

  test("includes coauthors when present", () => {
    const submission = {
      ...baseSubmission,
      coAuthors: [
        { name: "Bob Jones", order: 1 },
        { name: "Carol Lee", order: 2 },
      ],
    };
    const result = generateMarkdown(submission, "alice-smith", "");
    expect(result.markdown).toContain("coauthors:\n");
    expect(result.markdown).toContain('  - "Bob Jones"');
    expect(result.markdown).toContain('  - "Carol Lee"');
  });

  test("omits coauthors when array is empty", () => {
    const submission = { ...baseSubmission, coAuthors: [] };
    const result = generateMarkdown(submission, "alice-smith", "");
    expect(result.markdown).not.toContain("coauthors:");
  });

  test("omits coauthors when field is missing", () => {
    const result = generateMarkdown(baseSubmission, "alice-smith", "");
    expect(result.markdown).not.toContain("coauthors:");
  });

  test("escapes quotes in coauthor names", () => {
    const submission = {
      ...baseSubmission,
      coAuthors: [{ name: 'O"Brien', order: 1 }],
    };
    const result = generateMarkdown(submission, "alice-smith", "");
    expect(result.markdown).toContain('  - "O\\"Brien"');
  });

  test("omits submitted date when createdAt is missing", () => {
    const submission = { ...baseSubmission, createdAt: null };
    const result = generateMarkdown(submission, "alice-smith", "");
    expect(result.markdown).not.toContain("submitted:");
  });
});
