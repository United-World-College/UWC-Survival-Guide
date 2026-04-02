/**
 * Validates all guide markdown files have correct front matter,
 * consistent translation keys, and required fields.
 */

const fs = require("fs");
const path = require("path");
const { globSync } = require("glob");

const GUIDES_DIR = path.join(__dirname, "..", "website", "_guides");
const REQUIRED_FIELDS = [
  "title",
  "category",
  "guide_id",
  "language_code",
  "language_name",
  "language_folder",
  "language_sort",
];
const VALID_LANGUAGES = ["en", "zh-CN", "zh-TW"];
const VALID_FOLDERS = ["default", "chinese"];
const VALID_CATEGORIES = [
  "College Application",
  "Life Reflections",
  "Life Musings",
  "Academics",
  // Chinese equivalents
  "大学申请",
  "大學申請",
  "人生杂谈",
  "人生雜談",
  "学业",
  "學業",
];

function parseFrontMatter(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fields = {};
  const lines = match[1].split("\n");
  let currentKey = null;
  let inArray = false;
  let arrayValues = [];

  for (const line of lines) {
    // Handle YAML array items
    if (inArray && line.match(/^\s+-\s/)) {
      const val = line.replace(/^\s+-\s*/, "").replace(/^["']|["']$/g, "");
      arrayValues.push(val);
      continue;
    } else if (inArray) {
      fields[currentKey] = arrayValues;
      inArray = false;
      arrayValues = [];
    }

    const kvMatch = line.match(/^(\w+):\s*(.*)/);
    if (kvMatch) {
      const key = kvMatch[1];
      let value = kvMatch[2].trim();

      // Check if this starts a YAML array
      if (value === "") {
        currentKey = key;
        inArray = true;
        arrayValues = [];
        continue;
      }

      // Strip quotes
      value = value.replace(/^["']|["']$/g, "");
      fields[key] = value;
    }
  }

  if (inArray) {
    fields[currentKey] = arrayValues;
  }

  return fields;
}

// ── Collect all guide files ──

const guideFiles = globSync("**/*.md", { cwd: GUIDES_DIR }).map((f) =>
  path.join(GUIDES_DIR, f)
);

// ══════════════════════════════════════
// Front Matter Validation
// ══════════════════════════════════════

describe("Guide front matter validation", () => {
  test("at least one guide file exists", () => {
    expect(guideFiles.length).toBeGreaterThan(0);
  });

  test.each(guideFiles)("%s has valid front matter delimiters", (filePath) => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toMatch(/^---\n[\s\S]*?\n---/);
  });

  test.each(guideFiles)(
    "%s has all required front matter fields",
    (filePath) => {
      const fm = parseFrontMatter(filePath);
      expect(fm).not.toBeNull();
      for (const field of REQUIRED_FIELDS) {
        expect(fm).toHaveProperty(field);
        expect(fm[field]).toBeTruthy();
      }
    }
  );

  test.each(guideFiles)("%s has a valid language_code", (filePath) => {
    const fm = parseFrontMatter(filePath);
    expect(VALID_LANGUAGES).toContain(fm.language_code);
  });

  test.each(guideFiles)("%s has a valid language_folder", (filePath) => {
    const fm = parseFrontMatter(filePath);
    expect(VALID_FOLDERS).toContain(fm.language_folder);
  });

  test.each(guideFiles)("%s has a valid category", (filePath) => {
    const fm = parseFrontMatter(filePath);
    expect(VALID_CATEGORIES).toContain(fm.category);
  });

  test.each(guideFiles)(
    "%s language_sort is a valid number (1-3)",
    (filePath) => {
      const fm = parseFrontMatter(filePath);
      const sort = parseInt(fm.language_sort, 10);
      expect(sort).toBeGreaterThanOrEqual(1);
      expect(sort).toBeLessThanOrEqual(3);
    }
  );
});

// ══════════════════════════════════════
// File Naming Conventions
// ══════════════════════════════════════

describe("Guide file naming conventions", () => {
  test.each(guideFiles)(
    "%s is in the correct folder for its language",
    (filePath) => {
      const fm = parseFrontMatter(filePath);
      const relPath = path.relative(GUIDES_DIR, filePath);
      const folder = relPath.split(path.sep)[0];
      expect(folder).toBe(fm.language_folder);
    }
  );

  test("zh-CN files end with -CN.md", () => {
    const cnFiles = guideFiles.filter((f) => {
      const fm = parseFrontMatter(f);
      return fm && fm.language_code === "zh-CN";
    });
    for (const f of cnFiles) {
      expect(path.basename(f)).toMatch(/-CN\.md$/);
    }
  });

  test("zh-TW files end with -TW.md", () => {
    const twFiles = guideFiles.filter((f) => {
      const fm = parseFrontMatter(f);
      return fm && fm.language_code === "zh-TW";
    });
    for (const f of twFiles) {
      expect(path.basename(f)).toMatch(/-TW\.md$/);
    }
  });

  test("English files do not have language suffix", () => {
    const enFiles = guideFiles.filter((f) => {
      const fm = parseFrontMatter(f);
      return fm && fm.language_code === "en";
    });
    for (const f of enFiles) {
      expect(path.basename(f)).not.toMatch(/-(CN|TW)\.md$/);
    }
  });
});

// ══════════════════════════════════════
// Content Validation
// ══════════════════════════════════════

describe("Guide content validation", () => {
  // Guides with an author field are article guides (not category landing pages)
  const articleGuides = guideFiles.filter((f) => {
    const fm = parseFrontMatter(f);
    return fm && fm.author;
  });

  test("article guides have non-empty body content", () => {
    for (const filePath of articleGuides) {
      const content = fs.readFileSync(filePath, "utf-8");
      const body = content.replace(/^---\n[\s\S]*?\n---/, "").trim();
      expect(body.length).toBeGreaterThan(0);
    }
  });

  test("article guides have both author and author_id fields", () => {
    for (const filePath of articleGuides) {
      const fm = parseFrontMatter(filePath);
      expect(fm.author).toBeTruthy();
      expect(fm.author_id).toBeTruthy();
    }
  });

  test("no duplicate guide_id within the same language", () => {
    const seen = {};
    for (const f of guideFiles) {
      const fm = parseFrontMatter(f);
      if (!fm) continue;
      const key = `${fm.language_code}::${fm.guide_id}`;
      if (!seen[key]) seen[key] = [];
      seen[key].push(path.relative(GUIDES_DIR, f));
    }
    for (const [key, files] of Object.entries(seen)) {
      expect(files.length).toBe(1);
    }
  });
});

// ══════════════════════════════════════
// Translation Completeness
// ══════════════════════════════════════

describe("Translation completeness", () => {
  test("every English guide has a zh-CN translation", () => {
    const enGuides = guideFiles
      .filter((f) => {
        const fm = parseFrontMatter(f);
        return fm && fm.language_code === "en";
      })
      .map((f) => parseFrontMatter(f).guide_id);

    const cnGuides = guideFiles
      .filter((f) => {
        const fm = parseFrontMatter(f);
        return fm && fm.language_code === "zh-CN";
      })
      .map((f) => parseFrontMatter(f).guide_id);

    for (const guideId of enGuides) {
      expect(cnGuides).toContain(guideId);
    }
  });

  test("every English guide has a zh-TW translation", () => {
    const enGuides = guideFiles
      .filter((f) => {
        const fm = parseFrontMatter(f);
        return fm && fm.language_code === "en";
      })
      .map((f) => parseFrontMatter(f).guide_id);

    const twGuides = guideFiles
      .filter((f) => {
        const fm = parseFrontMatter(f);
        return fm && fm.language_code === "zh-TW";
      })
      .map((f) => parseFrontMatter(f).guide_id);

    for (const guideId of enGuides) {
      expect(twGuides).toContain(guideId);
    }
  });

  test("no orphan translations (every guide_id exists in at least two languages)", () => {
    const byGuideId = {};
    for (const f of guideFiles) {
      const fm = parseFrontMatter(f);
      if (!fm || !fm.guide_id) continue;
      if (!byGuideId[fm.guide_id]) byGuideId[fm.guide_id] = new Set();
      byGuideId[fm.guide_id].add(fm.language_code);
    }

    // A guide with only one language variant is orphan — it means
    // translation was expected but never completed.  Guides that are
    // the original source will always have at least two variants once
    // the auto-translator runs (source + one translation).
    for (const [guideId, langs] of Object.entries(byGuideId)) {
      expect(langs.size).toBeGreaterThanOrEqual(2);
    }
  });

  test("guide_id is consistent across translations of the same guide", () => {
    const byGuideId = {};
    for (const f of guideFiles) {
      const fm = parseFrontMatter(f);
      if (!fm) continue;
      const id = fm.guide_id;
      if (!byGuideId[id]) byGuideId[id] = [];
      byGuideId[id].push(fm);
    }
    for (const [guideId, entries] of Object.entries(byGuideId)) {
      // All entries should share the same guide_id
      for (const entry of entries) {
        expect(entry.guide_id).toBe(guideId);
      }
      // Each language should appear at most once
      const langs = entries.map((e) => e.language_code);
      expect(new Set(langs).size).toBe(langs.length);
    }
  });
});
