/**
 * Unit tests for Cloud Functions helper utilities.
 *
 * These test the pure helper functions exported from lib/helpers.js.
 */

// ── Mock Firebase before requiring any module ──

jest.mock("firebase-admin/app", () => ({ initializeApp: jest.fn() }));
jest.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: jest.fn() }),
  FieldValue: {
    serverTimestamp: () => "SERVER_TIMESTAMP",
    arrayUnion: (...args) => ({ _arrayUnion: args }),
    delete: () => "DELETE_FIELD",
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

// ── Require the modules under test ──

const {
  makeSlug,
  makeAuthorSlug,
  toBase64,
  getAuthorKey,
  getOrderedSubmissionAuthors,
  sanitizeRevisionHistory,
  generateMarkdown,
} = require("../lib/helpers");

// ══════════════════════════════════════
// makeSlug
// ══════════════════════════════════════

describe("makeSlug", () => {
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
// makeAuthorSlug
// ══════════════════════════════════════

describe("makeAuthorSlug", () => {
  test("converts English name to kebab-case", () => {
    expect(makeAuthorSlug("Alice Smith")).toBe("alice-smith");
  });

  test("transliterates accented Latin characters", () => {
    expect(makeAuthorSlug("José Álvarez")).toBe("jose-alvarez");
  });

  test("transliterates Latin extended characters", () => {
    expect(makeAuthorSlug("Łukasz Żółć")).toBe("lukasz-zolc");
  });

  test("strips CJK from mixed English-CJK name", () => {
    expect(makeAuthorSlug("William Huang 黃靖然")).toBe("william-huang");
  });

  test("returns empty string for purely CJK name", () => {
    expect(makeAuthorSlug("李东元")).toBe("");
  });

  test("returns empty string for other purely non-Latin names", () => {
    expect(makeAuthorSlug("Алексей")).toBe("");
  });

  test("handles empty string", () => {
    expect(makeAuthorSlug("")).toBe("");
  });
});

// ══════════════════════════════════════
// toBase64
// ══════════════════════════════════════

describe("toBase64", () => {
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
// generateMarkdown
// ══════════════════════════════════════

describe("generateMarkdown", () => {
  const baseSubmission = {
    title: "My UWC Experience",
    category: "Life Reflections",
    description: "A short summary",
    language: "en",
    authorName: "Alice Smith",
    content: "# Hello\n\nThis is my article.",
    createdAt: { toDate: () => new Date("2026-01-15T00:00:00Z") },
  };
  const baseAuthors = [
    { name: "Alice Smith", author_id: "alice-smith", order: 1, uid: "user-1" },
  ];

  test("generates valid YAML front matter with closing delimiters", () => {
    const result = generateMarkdown(baseSubmission, baseAuthors, "");
    expect(result.markdown).toMatch(/^---\n/);
    expect(result.markdown).toMatch(/\n---\n\n/);
  });

  test("includes all required front matter fields", () => {
    const result = generateMarkdown(baseSubmission, baseAuthors, "");
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
    const result = generateMarkdown(baseSubmission, baseAuthors, "");
    expect(result.markdown).toContain("# Hello\n\nThis is my article.");
  });

  test("generates correct file metadata for English", () => {
    const result = generateMarkdown(baseSubmission, baseAuthors, "");
    expect(result.slug).toBe("my-uwc-experience");
    expect(result.fileName).toBe("my-uwc-experience.md");
    expect(result.folder).toBe("default");
    expect(result.filePath).toBe(
      "website/_guides/default/my-uwc-experience.md"
    );
  });

  test("generates correct file metadata for zh-CN", () => {
    const submission = { ...baseSubmission, language: "zh-CN", title: "我的经历" };
    const result = generateMarkdown(submission, [{ ...baseAuthors[0], author_id: "alice" }], "");
    expect(result.fileName).toBe("我的经历-CN.md");
    expect(result.folder).toBe("chinese");
    expect(result.filePath).toBe("website/_guides/chinese/我的经历-CN.md");
    expect(result.markdown).toContain('language_code: "zh-CN"');
    expect(result.markdown).toContain('language_name: "简体中文"');
    expect(result.markdown).toContain("language_sort: 2");
  });

  test("generates correct file metadata for zh-TW", () => {
    const submission = { ...baseSubmission, language: "zh-TW", title: "Test" };
    const result = generateMarkdown(submission, [{ ...baseAuthors[0], author_id: "alice" }], "");
    expect(result.fileName).toBe("test-TW.md");
    expect(result.folder).toBe("chinese");
    expect(result.markdown).toContain("language_sort: 3");
  });

  test("falls back to English for unknown language", () => {
    const submission = { ...baseSubmission, language: "fr" };
    const result = generateMarkdown(submission, [{ ...baseAuthors[0], author_id: "alice" }], "");
    expect(result.folder).toBe("default");
    expect(result.markdown).toContain('language_name: "English"');
  });

  test("includes editor fields when editor name provided", () => {
    const result = generateMarkdown(baseSubmission, baseAuthors, "Bob Editor");
    expect(result.markdown).toContain('editor: "Bob Editor"');
    expect(result.markdown).toContain('editor_id: "bob-editor"');
  });

  test("omits editor fields when editor name is empty", () => {
    const result = generateMarkdown(baseSubmission, baseAuthors, "");
    expect(result.markdown).not.toContain("editor:");
    expect(result.markdown).not.toContain("editor_id:");
  });

  test("escapes double quotes in title and description", () => {
    const submission = {
      ...baseSubmission,
      title: 'My "Great" Article',
      description: 'A "brief" summary',
    };
    const result = generateMarkdown(submission, [{ ...baseAuthors[0], author_id: "alice" }], "");
    expect(result.markdown).toContain('title: "My \\"Great\\" Article"');
    expect(result.markdown).toContain('description: "A \\"brief\\" summary"');
  });

  test("uses the first ordered author as primary and includes the rest as coauthors", () => {
    const result = generateMarkdown(baseSubmission, [
      { name: "Bob Jones", author_id: "bob-jones", order: 1 },
      { name: "Alice Smith", author_id: "alice-smith", order: 2 },
      { name: "Carol Lee", author_id: "carol-lee", order: 3 },
    ], "");
    expect(result.markdown).toContain('author: "Bob Jones"');
    expect(result.markdown).toContain('author_id: "bob-jones"');
    expect(result.markdown).toContain("coauthors:\n");
    expect(result.markdown).toContain('  - name: "Alice Smith"');
    expect(result.markdown).toContain('    author_id: "alice-smith"');
    expect(result.markdown).toContain('  - name: "Carol Lee"');
    expect(result.markdown).toContain('    author_id: "carol-lee"');
    expect(result.markdown).not.toContain('  - name: "Bob Jones"');
  });

  test("includes coauthors without author_id when one is missing", () => {
    const result = generateMarkdown(baseSubmission, [
      ...baseAuthors,
      { name: "Bob Jones", order: 2 },
    ], "");
    expect(result.markdown).toContain('  - name: "Bob Jones"');
    expect(result.markdown).not.toContain("    author_id:");
  });

  test("omits coauthors when there is only one ordered author", () => {
    const result = generateMarkdown(baseSubmission, baseAuthors, "");
    expect(result.markdown).not.toContain("coauthors:");
  });

  test("escapes quotes in coauthor names", () => {
    const result = generateMarkdown(baseSubmission, [
      ...baseAuthors,
      { name: 'O"Brien', author_id: 'obrien', order: 2 },
    ], "");
    expect(result.markdown).toContain('  - name: "O\\"Brien"');
  });

  test("omits submitted date when createdAt is missing", () => {
    const submission = { ...baseSubmission, createdAt: null };
    const result = generateMarkdown(submission, baseAuthors, "");
    expect(result.markdown).not.toContain("submitted:");
  });
});

// ══════════════════════════════════════
// getAuthorKey
// ══════════════════════════════════════

describe("getAuthorKey", () => {
  test("returns uid-based key when uid is present", () => {
    expect(getAuthorKey({ uid: "u1", name: "Alice" })).toBe("uid:u1");
  });

  test("returns author_id-based key when uid is missing", () => {
    expect(getAuthorKey({ author_id: "alice", name: "Alice" })).toBe("author:alice");
  });

  test("returns name-based key when only name is present", () => {
    expect(getAuthorKey({ name: "Alice Smith" })).toBe("name:alice smith");
  });

  test("returns empty string for null/undefined", () => {
    expect(getAuthorKey(null)).toBe("");
    expect(getAuthorKey(undefined)).toBe("");
  });

  test("returns empty string for author with empty name and no uid", () => {
    expect(getAuthorKey({ name: "" })).toBe("");
    expect(getAuthorKey({ name: "  " })).toBe("");
  });

  test("prefers uid over author_id over name", () => {
    expect(getAuthorKey({ uid: "u1", author_id: "a1", name: "N" })).toBe("uid:u1");
    expect(getAuthorKey({ author_id: "a1", name: "N" })).toBe("author:a1");
  });
});

// ══════════════════════════════════════
// getOrderedSubmissionAuthors
// ══════════════════════════════════════

describe("getOrderedSubmissionAuthors", () => {
  test("sorts by order field", () => {
    const result = getOrderedSubmissionAuthors({
      coAuthors: [
        { name: "B", order: 2, uid: "u2" },
        { name: "A", order: 1, uid: "u1" },
      ],
    });
    expect(result[0].name).toBe("A");
    expect(result[1].name).toBe("B");
  });

  test("deduplicates by uid", () => {
    const result = getOrderedSubmissionAuthors({
      coAuthors: [
        { name: "Alice", order: 1, uid: "u1" },
        { name: "Alice Copy", order: 2, uid: "u1" },
      ],
    });
    expect(result).toHaveLength(1);
  });

  test("deduplicates by name when uid is missing", () => {
    const result = getOrderedSubmissionAuthors({
      coAuthors: [
        { name: "Alice", order: 1 },
        { name: "alice", order: 2 },
      ],
    });
    expect(result).toHaveLength(1);
  });

  test("filters out entries with empty name", () => {
    const result = getOrderedSubmissionAuthors({
      coAuthors: [
        { name: "", order: 1, uid: "u1" },
        { name: "Alice", order: 2, uid: "u2" },
      ],
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Alice");
  });

  test("returns empty array when coAuthors is missing", () => {
    expect(getOrderedSubmissionAuthors({})).toEqual([]);
    expect(getOrderedSubmissionAuthors({ coAuthors: null })).toEqual([]);
  });

  test("trims author names", () => {
    const result = getOrderedSubmissionAuthors({
      coAuthors: [{ name: "  Alice  ", order: 1, uid: "u1" }],
    });
    expect(result[0].name).toBe("Alice");
  });
});

// ══════════════════════════════════════
// sanitizeRevisionHistory
// ══════════════════════════════════════

describe("sanitizeRevisionHistory", () => {
  test("strips private actor fields from entries", () => {
    const result = sanitizeRevisionHistory([
      {
        round: 1,
        reviewerComments: "Fix this",
        reviewerUid: "admin-1",
        reviewerEmail: "admin@test.com",
        authorUid: "user-1",
        authorEmail: "user@test.com",
        actorUid: "admin-1",
        actorEmail: "admin@test.com",
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].reviewerComments).toBe("Fix this");
    expect(result[0].reviewerUid).toBeUndefined();
    expect(result[0].reviewerEmail).toBeUndefined();
    expect(result[0].authorUid).toBeUndefined();
    expect(result[0].authorEmail).toBeUndefined();
    expect(result[0].actorUid).toBeUndefined();
    expect(result[0].actorEmail).toBeUndefined();
  });

  test("assigns round numbers when missing", () => {
    const result = sanitizeRevisionHistory([
      { reviewerComments: "First" },
      { reviewerComments: "Second" },
    ]);
    expect(result[0].round).toBe(1);
    expect(result[1].round).toBe(2);
  });

  test("preserves existing round numbers", () => {
    const result = sanitizeRevisionHistory([
      { round: 5, reviewerComments: "Late round" },
    ]);
    expect(result[0].round).toBe(5);
  });

  test("returns empty array for non-array input", () => {
    expect(sanitizeRevisionHistory(null)).toEqual([]);
    expect(sanitizeRevisionHistory(undefined)).toEqual([]);
    expect(sanitizeRevisionHistory("not-array")).toEqual([]);
  });

  test("filters out null/non-object entries", () => {
    const result = sanitizeRevisionHistory([null, undefined, "string", { round: 1, reviewerComments: "OK" }]);
    expect(result).toHaveLength(1);
    expect(result[0].reviewerComments).toBe("OK");
  });
});
