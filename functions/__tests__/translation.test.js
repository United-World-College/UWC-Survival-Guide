/**
 * Unit tests for auto-translation helpers in lib/translation.js.
 *
 * Tests buildTranslationPrompt, buildTranslatedMarkdown, and the
 * RESPONSE_SCHEMA by importing them directly from the module.
 */

// ── Mock Firebase before requiring any module ──

jest.mock("firebase-admin/app", () => ({ initializeApp: jest.fn() }));
jest.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: jest.fn(() => ({ doc: jest.fn(() => ({ get: jest.fn(), set: jest.fn(), update: jest.fn() })), where: jest.fn(() => ({ get: jest.fn() })) })) }),
  FieldValue: {
    serverTimestamp: () => "SERVER_TIMESTAMP",
    arrayUnion: (...args) => ({ _arrayUnion: args }),
    increment: (n) => ({ _increment: n }),
    delete: () => "DELETE_FIELD",
  },
}));
jest.mock("firebase-functions/v2/https", () => ({
  onCall: (fn) => fn,
  HttpsError: class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
  },
}));

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn(),
}));

// ── Require the modules under test ──

const {
  RESPONSE_SCHEMA,
  STYLE_NOTES,
  PROMPT_NAMES,
  buildTranslationPrompt,
  buildTranslatedMarkdown,
  generateGuideSlugFromTitle,
} = require("../lib/translation");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ══════════════════════════════════════
// RESPONSE_SCHEMA
// ══════════════════════════════════════

describe("RESPONSE_SCHEMA", () => {
  test("is defined with correct type", () => {
    expect(RESPONSE_SCHEMA).toBeDefined();
    expect(RESPONSE_SCHEMA.type).toBe("OBJECT");
  });

  test("has all required fields", () => {
    expect(RESPONSE_SCHEMA.required).toEqual(
      expect.arrayContaining(["title", "category", "description", "body"])
    );
    expect(RESPONSE_SCHEMA.required).toHaveLength(4);
  });

  test("all required fields are typed as STRING", () => {
    const props = RESPONSE_SCHEMA.properties;
    for (const field of ["title", "category", "description", "body"]) {
      expect(props[field].type).toBe("STRING");
    }
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
    expect(result.markdown).not.toContain('author: "Alice Smith"');
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

// ══════════════════════════════════════
// generateGuideSlugFromTitle
// ══════════════════════════════════════

describe("generateGuideSlugFromTitle", () => {
  function mockGeminiTitle(impl) {
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: () => ({ generateContent: impl }),
    }));
  }

  beforeEach(() => {
    GoogleGenerativeAI.mockReset();
  });

  test("English title bypasses Gemini and uses makeSlug directly", async () => {
    const slug = await generateGuideSlugFromTitle({
      apiKey: "fake-key", title: "My UWC Experience", language: "en",
    });
    expect(slug).toBe("my-uwc-experience");
    expect(GoogleGenerativeAI).not.toHaveBeenCalled();
  });

  test("Non-English title with no apiKey falls back to makeSlug of original", async () => {
    const slug = await generateGuideSlugFromTitle({
      apiKey: null, title: "关于挫折", language: "zh-CN",
    });
    expect(slug).toBe("untitled");
    expect(GoogleGenerativeAI).not.toHaveBeenCalled();
  });

  test("Non-English title translates via Gemini and slugs the English result", async () => {
    mockGeminiTitle(jest.fn().mockResolvedValue({
      response: { text: () => JSON.stringify({ title: "On Setbacks" }) },
    }));
    const slug = await generateGuideSlugFromTitle({
      apiKey: "fake-key", title: "关于挫折", language: "zh-CN",
    });
    expect(slug).toBe("on-setbacks");
    expect(GoogleGenerativeAI).toHaveBeenCalledTimes(1);
  });

  test("zh-TW source language is also translated", async () => {
    mockGeminiTitle(jest.fn().mockResolvedValue({
      response: { text: () => JSON.stringify({ title: "On Setbacks" }) },
    }));
    const slug = await generateGuideSlugFromTitle({
      apiKey: "fake-key", title: "關於挫折", language: "zh-TW",
    });
    expect(slug).toBe("on-setbacks");
  });

  test("Falls back to makeSlug of original when Gemini call throws", async () => {
    mockGeminiTitle(jest.fn().mockRejectedValue(new Error("API down")));
    const slug = await generateGuideSlugFromTitle({
      apiKey: "fake-key", title: "关于挫折", language: "zh-CN",
    });
    expect(slug).toBe("untitled");
  });

  test("Falls back when Gemini returns an empty title", async () => {
    mockGeminiTitle(jest.fn().mockResolvedValue({
      response: { text: () => JSON.stringify({ title: "   " }) },
    }));
    const slug = await generateGuideSlugFromTitle({
      apiKey: "fake-key", title: "关于挫折", language: "zh-CN",
    });
    expect(slug).toBe("untitled");
  });

  test("Falls back when translated title slugs to 'untitled'", async () => {
    mockGeminiTitle(jest.fn().mockResolvedValue({
      response: { text: () => JSON.stringify({ title: "!!!" }) },
    }));
    const slug = await generateGuideSlugFromTitle({
      apiKey: "fake-key", title: "关于挫折", language: "zh-CN",
    });
    // English translation '!!!' would slug to 'untitled' so we fall back to
    // the original — which also slugs to 'untitled'. The fallback path is
    // what's exercised here.
    expect(slug).toBe("untitled");
  });
});
