/**
 * Unit tests for auto-translation helpers added to index.js.
 *
 * Tests buildTranslationPrompt, buildTranslatedMarkdown, and the
 * TRANSLATE_TOOL schema by extracting them from the source via eval,
 * following the same pattern as helpers.test.js.
 */

// ── Mock Firebase before requiring index.js ──

jest.mock("firebase-admin/app", () => ({ initializeApp: jest.fn() }));
jest.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: jest.fn(() => ({ doc: jest.fn(() => ({ get: jest.fn(), set: jest.fn(), update: jest.fn() })), where: jest.fn(() => ({ get: jest.fn() })) })) }),
  FieldValue: {
    serverTimestamp: () => "SERVER_TIMESTAMP",
    arrayUnion: (...args) => ({ _arrayUnion: args }),
    delete: () => "DELETE_FIELD",
  },
}));
jest.mock("firebase-functions/v2/https", () => ({
  onCall: (fn) => fn,
  HttpsError: class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
  },
}));

const fs = require("fs");
const path = require("path");
const source = fs.readFileSync(path.join(__dirname, "..", "index.js"), "utf8");

// ── Extract helpers from source ──

function extractVar(name) {
  // Match const NAME = { ... }; or const NAME = "...";
  const objMatch = source.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n\\});`));
  if (objMatch) return eval(`(${objMatch[1]})`);
  const strMatch = source.match(new RegExp(`const ${name} =\\s*\\n?\\s*(".*?"|'.*?');`, "s"));
  if (strMatch) return eval(strMatch[1]);
  return undefined;
}

function extractFunction(name) {
  const match = source.match(new RegExp(`function ${name}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`));
  if (!match) return undefined;
  let fn;
  eval(`fn = ${match[0]}`);
  return fn;
}

const LANG_MAP = {
  en: { name: "English", folder: "default", sort: 1, suffix: "" },
  "zh-CN": { name: "简体中文", folder: "chinese", sort: 2, suffix: "-CN" },
  "zh-TW": { name: "台灣繁體", folder: "chinese", sort: 3, suffix: "-TW" },
};

// Extract the translation-specific items
const TRANSLATE_TOOL = extractVar("TRANSLATE_TOOL");
const STYLE_NOTES = extractVar("STYLE_NOTES");
const PROMPT_NAMES = extractVar("PROMPT_NAMES");

// buildTranslationPrompt depends on PROMPT_NAMES and STYLE_NOTES — extract with those in scope
let buildTranslationPrompt;
{
  const match = source.match(/function buildTranslationPrompt\(sourceLang, targetLang, payload\)\s*\{[\s\S]*?\n\}/);
  if (match) {
    eval(`buildTranslationPrompt = ${match[0]}`);
  }
}

// buildTranslatedMarkdown depends on LANG_MAP, makeSlug, makeAuthorSlug
const makeSlugMatch = source.match(/function makeSlug\(text\)\s*\{[^}]+\}/);
let makeSlug;
if (makeSlugMatch) eval(`makeSlug = ${makeSlugMatch[0]}`);

const makeAuthorSlugMatch = source.match(/function makeAuthorSlug\(text\)\s*\{[\s\S]*?\n\}/);
let makeAuthorSlug;
if (makeAuthorSlugMatch) eval(`makeAuthorSlug = ${makeAuthorSlugMatch[0]}`);

let buildTranslatedMarkdown;
{
  const match = source.match(/function buildTranslatedMarkdown\([^)]*\)\s*\{[\s\S]*?\n\}/);
  if (match) {
    eval(`buildTranslatedMarkdown = ${match[0]}`);
  }
}

// ══════════════════════════════════════
// TRANSLATE_TOOL schema
// ══════════════════════════════════════

describe("TRANSLATE_TOOL schema", () => {
  test("is defined with correct name", () => {
    expect(TRANSLATE_TOOL).toBeDefined();
    expect(TRANSLATE_TOOL.name).toBe("guide_translation");
  });

  test("has all required fields in input_schema", () => {
    const schema = TRANSLATE_TOOL.input_schema;
    expect(schema.required).toEqual(
      expect.arrayContaining(["title", "category", "description", "body"])
    );
    expect(schema.required).toHaveLength(4);
  });

  test("all required fields are typed as string", () => {
    const props = TRANSLATE_TOOL.input_schema.properties;
    for (const field of ["title", "category", "description", "body"]) {
      expect(props[field].type).toBe("string");
    }
  });

  test("disallows additional properties", () => {
    expect(TRANSLATE_TOOL.input_schema.additionalProperties).toBe(false);
  });
});

// ══════════════════════════════════════
// STYLE_NOTES and PROMPT_NAMES
// ══════════════════════════════════════

describe("Translation language config", () => {
  test("STYLE_NOTES covers all three languages", () => {
    expect(STYLE_NOTES).toBeDefined();
    expect(Object.keys(STYLE_NOTES).sort()).toEqual(["en", "zh-CN", "zh-TW"]);
  });

  test("PROMPT_NAMES covers all three languages", () => {
    expect(PROMPT_NAMES).toBeDefined();
    expect(Object.keys(PROMPT_NAMES).sort()).toEqual(["en", "zh-CN", "zh-TW"]);
  });

  test("each STYLE_NOTE is a non-empty string", () => {
    for (const lang of ["en", "zh-CN", "zh-TW"]) {
      expect(typeof STYLE_NOTES[lang]).toBe("string");
      expect(STYLE_NOTES[lang].length).toBeGreaterThan(0);
    }
  });

  test("each PROMPT_NAME is a non-empty string", () => {
    for (const lang of ["en", "zh-CN", "zh-TW"]) {
      expect(typeof PROMPT_NAMES[lang]).toBe("string");
      expect(PROMPT_NAMES[lang].length).toBeGreaterThan(0);
    }
  });
});

// ══════════════════════════════════════
// buildTranslationPrompt
// ══════════════════════════════════════

describe("buildTranslationPrompt", () => {
  const payload = {
    guide_id: "test-guide",
    author: "Alice",
    title: "My Guide",
    category: "Campus Life",
    description: "A test guide",
    body: "# Hello\n\nSome content here.",
  };

  test("includes source and target language names", () => {
    const prompt = buildTranslationPrompt("en", "zh-CN", payload);
    expect(prompt).toContain("English");
    expect(prompt).toContain("Simplified Chinese");
  });

  test("includes target style note", () => {
    const prompt = buildTranslationPrompt("en", "zh-CN", payload);
    expect(prompt).toContain(STYLE_NOTES["zh-CN"]);
  });

  test("includes the guide payload as JSON", () => {
    const prompt = buildTranslationPrompt("en", "zh-TW", payload);
    expect(prompt).toContain('"guide_id": "test-guide"');
    expect(prompt).toContain('"title": "My Guide"');
    expect(prompt).toContain('"body": "# Hello');
  });

  test("includes translation rules", () => {
    const prompt = buildTranslationPrompt("zh-CN", "en", payload);
    expect(prompt).toContain("Preserve meaning exactly");
    expect(prompt).toContain("Liquid tags");
    expect(prompt).toContain("Markdown structure");
  });

  test("works for all language pair directions", () => {
    const pairs = [
      ["en", "zh-CN"], ["en", "zh-TW"],
      ["zh-CN", "en"], ["zh-CN", "zh-TW"],
      ["zh-TW", "en"], ["zh-TW", "zh-CN"],
    ];
    for (const [src, tgt] of pairs) {
      const prompt = buildTranslationPrompt(src, tgt, payload);
      expect(prompt).toContain(PROMPT_NAMES[src]);
      expect(prompt).toContain(PROMPT_NAMES[tgt]);
      expect(prompt).toContain(STYLE_NOTES[tgt]);
    }
  });
});

// ══════════════════════════════════════
// buildTranslatedMarkdown
// ══════════════════════════════════════

describe("buildTranslatedMarkdown", () => {
  const originalData = {
    createdAt: { toDate: () => new Date("2026-02-10T00:00:00Z") },
  };
  const translation = {
    title: "我的指南",
    category: "校园生活",
    description: "一篇测试指南",
    body: "# 你好\n\n一些内容。",
  };
  const authors = [
    { name: "Alice Smith", author_id: "alice-smith", order: 1 },
    { name: "Bob Jones", author_id: "bob-jones", order: 2 },
  ];

  test("generates valid front matter for zh-CN", () => {
    const result = buildTranslatedMarkdown(
      originalData, translation, "zh-CN", authors, "Editor Name", "test-guide"
    );
    expect(result.markdown).toMatch(/^---\n/);
    expect(result.markdown).toContain('language_code: "zh-CN"');
    expect(result.markdown).toContain('language_name: "简体中文"');
    expect(result.markdown).toContain("language_sort: 2");
    expect(result.markdown).toContain('language_folder: "chinese"');
  });

  test("generates correct file paths for zh-CN", () => {
    const result = buildTranslatedMarkdown(
      originalData, translation, "zh-CN", authors, "", "test-guide"
    );
    expect(result.fileName).toBe("test-guide-CN.md");
    expect(result.folder).toBe("chinese");
    expect(result.filePath).toBe("website/_guides/chinese/test-guide-CN.md");
  });

  test("generates correct file paths for zh-TW", () => {
    const result = buildTranslatedMarkdown(
      originalData, translation, "zh-TW", authors, "", "test-guide"
    );
    expect(result.fileName).toBe("test-guide-TW.md");
    expect(result.filePath).toBe("website/_guides/chinese/test-guide-TW.md");
  });

  test("generates correct file paths for en", () => {
    const result = buildTranslatedMarkdown(
      originalData, translation, "en", authors, "", "test-guide"
    );
    expect(result.fileName).toBe("test-guide.md");
    expect(result.folder).toBe("default");
    expect(result.filePath).toBe("website/_guides/default/test-guide.md");
  });

  test("includes translated title, category, and description", () => {
    const result = buildTranslatedMarkdown(
      originalData, translation, "zh-CN", authors, "", "test-guide"
    );
    expect(result.markdown).toContain('title: "我的指南"');
    expect(result.markdown).toContain('category: "校园生活"');
    expect(result.markdown).toContain('description: "一篇测试指南"');
  });

  test("includes translated body after front matter", () => {
    const result = buildTranslatedMarkdown(
      originalData, translation, "zh-CN", authors, "", "test-guide"
    );
    expect(result.markdown).toContain("# 你好\n\n一些内容。");
  });

  test("includes primary author and coauthors", () => {
    const result = buildTranslatedMarkdown(
      originalData, translation, "zh-CN", authors, "", "test-guide"
    );
    expect(result.markdown).toContain('author: "Alice Smith"');
    expect(result.markdown).toContain('author_id: "alice-smith"');
    expect(result.markdown).toContain("coauthors:");
    expect(result.markdown).toContain('  - name: "Bob Jones"');
    expect(result.markdown).toContain('    author_id: "bob-jones"');
  });

  test("includes editor fields when provided", () => {
    const result = buildTranslatedMarkdown(
      originalData, translation, "zh-CN", authors, "Editor Name", "test-guide"
    );
    expect(result.markdown).toContain('editor: "Editor Name"');
    expect(result.markdown).toContain('editor_id: "editor-name"');
  });

  test("omits editor fields when empty", () => {
    const result = buildTranslatedMarkdown(
      originalData, translation, "zh-CN", authors, "", "test-guide"
    );
    expect(result.markdown).not.toContain("editor:");
    expect(result.markdown).not.toContain("editor_id:");
  });

  test("includes guide_id and submitted date", () => {
    const result = buildTranslatedMarkdown(
      originalData, translation, "zh-CN", authors, "", "my-guide"
    );
    expect(result.markdown).toContain('guide_id: "my-guide"');
    expect(result.markdown).toContain("submitted: 2026-02-10");
  });

  test("omits submitted date when createdAt is missing", () => {
    const result = buildTranslatedMarkdown(
      { createdAt: null }, translation, "zh-CN", authors, "", "test-guide"
    );
    expect(result.markdown).not.toContain("submitted:");
  });

  test("escapes quotes in translated fields", () => {
    const result = buildTranslatedMarkdown(
      originalData,
      { ...translation, title: '我的"好"指南' },
      "zh-CN", authors, "", "test-guide"
    );
    expect(result.markdown).toContain('title: "我的\\"好\\"指南"');
  });
});
