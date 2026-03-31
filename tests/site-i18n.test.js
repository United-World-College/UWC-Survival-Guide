/**
 * Validates i18n completeness: every key that exists in the English
 * locale must also exist in zh-CN and zh-TW locales.
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const PAGE_COPY_PATH = path.join(
  __dirname,
  "..",
  "website",
  "_data",
  "page_copy.yml"
);

let locales;

beforeAll(() => {
  const raw = fs.readFileSync(PAGE_COPY_PATH, "utf-8");
  locales = yaml.load(raw);
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
  return locales.find((l) => l.code === code);
}

describe("i18n page_copy.yml validation", () => {
  test("page_copy.yml is valid YAML and is an array", () => {
    expect(Array.isArray(locales)).toBe(true);
    expect(locales.length).toBeGreaterThanOrEqual(3);
  });

  test("contains en, zh-CN, and zh-TW locales", () => {
    const codes = locales.map((l) => l.code);
    expect(codes).toContain("en");
    expect(codes).toContain("zh-CN");
    expect(codes).toContain("zh-TW");
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
      "coauthors_max",
    ];
    for (const code of ["en", "zh-CN", "zh-TW"]) {
      const admin = getLocale(code).admin;
      for (const key of coauthorKeys) {
        expect(admin[key]).toBeDefined();
        expect(admin[key]).toBeTruthy();
      }
    }
  });
});
