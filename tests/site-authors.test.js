/**
 * Validates author page files and about.yml data consistency.
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { globSync } = require("glob");

const AUTHORS_DIR = path.join(__dirname, "..", "website", "_authors");
const ABOUT_PATH = path.join(__dirname, "..", "website", "_data", "about.yml");

function parseFrontMatter(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)/);
    if (kv) {
      let val = kv[2].trim();
      val = val.replace(/^["']|["']$/g, "");
      fields[kv[1]] = val;
    }
  }
  return fields;
}

const authorFiles = globSync("**/*.md", { cwd: AUTHORS_DIR }).map((f) =>
  path.join(AUTHORS_DIR, f)
);

let aboutData;

beforeAll(() => {
  const raw = fs.readFileSync(ABOUT_PATH, "utf-8");
  aboutData = yaml.load(raw);
});

// ══════════════════════════════════════
// Author File Validation
// ══════════════════════════════════════

describe("Author page file validation", () => {
  test("at least one author file exists", () => {
    expect(authorFiles.length).toBeGreaterThan(0);
  });

  test.each(authorFiles)(
    "%s has valid front matter with required fields",
    (filePath) => {
      const fm = parseFrontMatter(filePath);
      expect(fm).not.toBeNull();
      expect(fm.title).toBeTruthy();
      expect(fm.author_id).toBeTruthy();
      expect(fm.permalink).toBeTruthy();
      expect(fm.language_code).toBeTruthy();
      expect(fm.translation_key).toBeTruthy();
    }
  );

  test.each(authorFiles)(
    "%s has a valid language_code",
    (filePath) => {
      const fm = parseFrontMatter(filePath);
      expect(["en", "zh-CN", "zh-TW"]).toContain(fm.language_code);
    }
  );

  test("each author has all three language variants", () => {
    const byAuthorId = {};
    for (const f of authorFiles) {
      const fm = parseFrontMatter(f);
      if (!fm) continue;
      if (!byAuthorId[fm.author_id]) byAuthorId[fm.author_id] = new Set();
      byAuthorId[fm.author_id].add(fm.language_code);
    }
    for (const [authorId, langs] of Object.entries(byAuthorId)) {
      expect(langs.size).toBe(3);
      expect(langs.has("en")).toBe(true);
      expect(langs.has("zh-CN")).toBe(true);
      expect(langs.has("zh-TW")).toBe(true);
    }
  });

  test("author translation_key is consistent across language variants", () => {
    const byAuthorId = {};
    for (const f of authorFiles) {
      const fm = parseFrontMatter(f);
      if (!fm) continue;
      if (!byAuthorId[fm.author_id]) byAuthorId[fm.author_id] = new Set();
      byAuthorId[fm.author_id].add(fm.translation_key);
    }
    for (const [authorId, keys] of Object.entries(byAuthorId)) {
      expect(keys.size).toBe(1);
    }
  });
});

// ══════════════════════════════════════
// about.yml Validation
// ══════════════════════════════════════

describe("about.yml validation", () => {
  test("has editors_in_chief array", () => {
    expect(Array.isArray(aboutData.editors_in_chief)).toBe(true);
    expect(aboutData.editors_in_chief.length).toBeGreaterThan(0);
  });

  test("has contributors field", () => {
    expect(aboutData).toHaveProperty("contributors");
  });

  test("each editor-in-chief has an id", () => {
    for (const eic of aboutData.editors_in_chief) {
      expect(eic.id).toBeTruthy();
    }
  });

  test("editor-in-chief IDs have corresponding author pages", () => {
    const authorPageIds = authorFiles
      .map((f) => parseFrontMatter(f))
      .filter(Boolean)
      .map((fm) => fm.author_id);

    for (const eic of aboutData.editors_in_chief) {
      expect(authorPageIds).toContain(eic.id);
    }
  });
});

// ══════════════════════════════════════
// Author Permalink Validation
// ══════════════════════════════════════

describe("Author permalink format", () => {
  test.each(authorFiles)(
    "%s has a valid permalink format",
    (filePath) => {
      const fm = parseFrontMatter(filePath);
      // Permalinks should start with / and end with /
      expect(fm.permalink).toMatch(/^\//);
      expect(fm.permalink).toMatch(/\/$/);
    }
  );

  test("no duplicate author_id within the same language", () => {
    const seen = {};
    for (const f of authorFiles) {
      const fm = parseFrontMatter(f);
      if (!fm) continue;
      const key = `${fm.language_code}::${fm.author_id}`;
      if (!seen[key]) seen[key] = [];
      seen[key].push(path.relative(AUTHORS_DIR, f));
    }
    for (const [key, files] of Object.entries(seen)) {
      expect(files.length).toBe(1);
    }
  });

  test("no duplicate permalinks across all author files", () => {
    const seen = {};
    for (const f of authorFiles) {
      const fm = parseFrontMatter(f);
      if (!fm) continue;
      if (!seen[fm.permalink]) seen[fm.permalink] = [];
      seen[fm.permalink].push(path.relative(AUTHORS_DIR, f));
    }
    for (const [permalink, files] of Object.entries(seen)) {
      expect(files.length).toBe(1);
    }
  });

  test("author files are in the correct folder for their language", () => {
    for (const f of authorFiles) {
      const fm = parseFrontMatter(f);
      if (!fm) continue;
      const relPath = path.relative(AUTHORS_DIR, f);
      const folder = relPath.split(path.sep)[0];
      if (fm.language_code === "en") {
        expect(folder).toBe("default");
      } else {
        expect(folder).toBe("chinese");
      }
    }
  });
});
