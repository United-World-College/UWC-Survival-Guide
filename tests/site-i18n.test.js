/**
 * Validates i18n completeness: every key that exists in the English
 * locale must also exist in zh-CN and zh-TW locales.
 *
 * Locale files live in website/_data/i18n/{code}.yml.
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const I18N_DIR = path.join(__dirname, "..", "website", "_data", "i18n");

let locales;

beforeAll(() => {
  locales = {};
  for (const file of fs.readdirSync(I18N_DIR)) {
    if (!file.endsWith(".yml")) continue;
    const code = file.replace(".yml", "");
    locales[code] = yaml.load(fs.readFileSync(path.join(I18N_DIR, file), "utf-8"));
  }
});

function flattenKeys(obj, prefix = "") {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getLocale(code) {
  return locales[code];
}

describe("i18n locale files validation", () => {
  test("i18n directory contains en, zh-CN, and zh-TW files", () => {
    expect(locales["en"]).toBeDefined();
    expect(locales["zh-CN"]).toBeDefined();
    expect(locales["zh-TW"]).toBeDefined();
  });

  test("each locale has a code field matching its filename", () => {
    for (const [code, data] of Object.entries(locales)) {
      expect(data.code).toBe(code);
    }
  });

  test("all English keys exist in zh-CN", () => {
    const en = getLocale("en");
    const zhCN = getLocale("zh-CN");
    const enKeys = flattenKeys(en);
    const cnKeys = new Set(flattenKeys(zhCN));

    const missing = enKeys.filter((k) => !cnKeys.has(k));
    if (missing.length > 0) {
      console.warn("Keys missing in zh-CN:", missing);
    }
    expect(missing).toEqual([]);
  });

  test("all English keys exist in zh-TW", () => {
    const en = getLocale("en");
    const zhTW = getLocale("zh-TW");
    const enKeys = flattenKeys(en);
    const twKeys = new Set(flattenKeys(zhTW));

    const missing = enKeys.filter((k) => !twKeys.has(k));
    if (missing.length > 0) {
      console.warn("Keys missing in zh-TW:", missing);
    }
    expect(missing).toEqual([]);
  });

  test("no extra keys in zh-CN that are not in English", () => {
    const en = getLocale("en");
    const zhCN = getLocale("zh-CN");
    const enKeys = new Set(flattenKeys(en));
    const cnKeys = flattenKeys(zhCN);

    const extra = cnKeys.filter((k) => !enKeys.has(k));
    if (extra.length > 0) {
      console.warn("Extra keys in zh-CN not in en:", extra);
    }
    expect(extra).toEqual([]);
  });

  test("no extra keys in zh-TW that are not in English", () => {
    const en = getLocale("en");
    const zhTW = getLocale("zh-TW");
    const enKeys = new Set(flattenKeys(en));
    const twKeys = flattenKeys(zhTW);

    const extra = twKeys.filter((k) => !enKeys.has(k));
    if (extra.length > 0) {
      console.warn("Extra keys in zh-TW not in en:", extra);
    }
    expect(extra).toEqual([]);
  });
});

describe("i18n admin strings", () => {
  test("admin section exists in all locales", () => {
    for (const code of ["en", "zh-CN", "zh-TW"]) {
      const locale = getLocale(code);
      expect(locale.admin).toBeDefined();
      expect(typeof locale.admin).toBe("object");
    }
  });

  test("all admin string values are non-empty in English", () => {
    const en = getLocale("en");
    const adminKeys = flattenKeys(en.admin);
    for (const key of adminKeys) {
      const parts = key.split(".");
      let val = en.admin;
      for (const p of parts) val = val[p];
      expect(val).toBeTruthy();
    }
  });

  test("coauthor i18n keys exist in all locales", () => {
    const coauthorKeys = [
      "coauthors_label",
      "coauthors_hint",
      "coauthor_name_placeholder",
      "coauthor_add_btn",
      "coauthor_add_toggle",
      "coauthors_max",
      "coauthor_id_placeholder",
      "coauthor_lookup_btn",
      "coauthor_searching",
      "coauthor_not_found",
      "coauthor_lookup_error",
      "coauthor_already_added",
      "coauthor_no_profile",
    ];
    for (const code of ["en", "zh-CN", "zh-TW"]) {
      const admin = getLocale(code).admin;
      for (const key of coauthorKeys) {
        expect(admin[key]).toBeDefined();
        expect(admin[key]).toBeTruthy();
      }
    }
  });

  test("author coauthor i18n keys exist in all locales", () => {
    const authorCoauthorKeys = [
      "coauthor_singular",
      "coauthor_plural",
      "coauthors_label",
      "coauthor_article_singular",
      "coauthor_article_plural",
    ];
    for (const code of ["en", "zh-CN", "zh-TW"]) {
      const author = getLocale(code).author;
      for (const key of authorCoauthorKeys) {
        expect(author[key]).toBeDefined();
        expect(author[key]).toBeTruthy();
      }
    }
  });
});

describe("i18n navigation strings", () => {
  test("nav section exists in all locales", () => {
    for (const code of ["en", "zh-CN", "zh-TW"]) {
      const locale = getLocale(code);
      expect(locale.nav).toBeDefined();
      expect(typeof locale.nav).toBe("object");
    }
  });

  test("required nav keys exist in all locales", () => {
    const navKeys = ["logo", "about", "campus_life", "daily_essentials", "explore_nearby", "all_guides"];
    for (const code of ["en", "zh-CN", "zh-TW"]) {
      const nav = getLocale(code).nav;
      for (const key of navKeys) {
        expect(nav[key]).toBeDefined();
        expect(nav[key]).toBeTruthy();
      }
    }
  });

  test("common section exists in all locales", () => {
    for (const code of ["en", "zh-CN", "zh-TW"]) {
      const locale = getLocale(code);
      expect(locale.common).toBeDefined();
      expect(typeof locale.common).toBe("object");
    }
  });

  test("short_label exists in all locales", () => {
    for (const code of ["en", "zh-CN", "zh-TW"]) {
      const locale = getLocale(code);
      expect(locale.short_label).toBeTruthy();
    }
  });
});

describe("i18n string values are non-empty", () => {
  // Keys that are legitimately empty or are identifiers/separators, not user-facing strings
  const SKIP_KEYS = new Set(["code", "path_prefix", "title_prefix", "bibliography_title_prefix", "no_filter_sep"]);

  test("all leaf values in zh-CN are non-empty strings", () => {
    const zhCN = getLocale("zh-CN");
    const keys = flattenKeys(zhCN);
    for (const key of keys) {
      const leafKey = key.split(".").pop();
      if (SKIP_KEYS.has(leafKey) || SKIP_KEYS.has(key)) continue;
      const parts = key.split(".");
      let val = zhCN;
      for (const p of parts) val = val[p];
      if (typeof val === "string") {
        expect(val.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test("all leaf values in zh-TW are non-empty strings", () => {
    const zhTW = getLocale("zh-TW");
    const keys = flattenKeys(zhTW);
    for (const key of keys) {
      const leafKey = key.split(".").pop();
      if (SKIP_KEYS.has(leafKey) || SKIP_KEYS.has(key)) continue;
      const parts = key.split(".");
      let val = zhTW;
      for (const p of parts) val = val[p];
      if (typeof val === "string") {
        expect(val.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
