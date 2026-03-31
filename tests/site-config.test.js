/**
 * Validates Jekyll config, Firebase config, and project structure.
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = path.join(__dirname, "..");
const WEBSITE = path.join(ROOT, "website");

// ══════════════════════════════════════
// Jekyll _config.yml
// ══════════════════════════════════════

describe("Jekyll _config.yml", () => {
  let config;

  beforeAll(() => {
    const raw = fs.readFileSync(path.join(WEBSITE, "_config.yml"), "utf-8");
    config = yaml.load(raw);
  });

  test("is valid YAML", () => {
    expect(config).toBeDefined();
    expect(typeof config).toBe("object");
  });

  test("has title", () => {
    expect(config.title).toBeTruthy();
  });

  test("has guides collection with output enabled", () => {
    expect(config.collections).toBeDefined();
    expect(config.collections.guides).toBeDefined();
    expect(config.collections.guides.output).toBe(true);
  });

  test("has authors collection with output enabled", () => {
    expect(config.collections.authors).toBeDefined();
    expect(config.collections.authors.output).toBe(true);
  });

  test("has correct default layouts", () => {
    const defaults = config.defaults;
    expect(Array.isArray(defaults)).toBe(true);

    const guideDefault = defaults.find(
      (d) => d.scope && d.scope.type === "guides"
    );
    expect(guideDefault).toBeDefined();
    expect(guideDefault.values.layout).toBe("guide");

    const authorDefault = defaults.find(
      (d) => d.scope && d.scope.type === "authors"
    );
    expect(authorDefault).toBeDefined();
    expect(authorDefault.values.layout).toBe("author");
  });
});

// ══════════════════════════════════════
// Firebase Configuration
// ══════════════════════════════════════

describe("firebase.json", () => {
  let fbConfig;

  beforeAll(() => {
    const raw = fs.readFileSync(path.join(ROOT, "firebase.json"), "utf-8");
    fbConfig = JSON.parse(raw);
  });

  test("is valid JSON", () => {
    expect(fbConfig).toBeDefined();
  });

  test("points functions source to functions/", () => {
    expect(fbConfig.functions).toBeDefined();
    expect(fbConfig.functions.source).toBe("functions");
  });

  test("points firestore rules correctly", () => {
    expect(fbConfig.firestore.rules).toBe("firebase/firestore.rules");
  });

  test("points firestore indexes correctly", () => {
    expect(fbConfig.firestore.indexes).toBe("firebase/firestore.indexes.json");
  });

  test("points storage rules correctly", () => {
    expect(fbConfig.storage.rules).toBe("firebase/storage.rules");
  });

  test("has emulator configuration", () => {
    expect(fbConfig.emulators).toBeDefined();
    expect(fbConfig.emulators.functions).toBeDefined();
    expect(fbConfig.emulators.auth).toBeDefined();
    expect(fbConfig.emulators.firestore).toBeDefined();
    expect(fbConfig.emulators.storage).toBeDefined();
  });

  test("emulator ports are distinct", () => {
    const ports = [
      fbConfig.emulators.functions.port,
      fbConfig.emulators.auth.port,
      fbConfig.emulators.firestore.port,
      fbConfig.emulators.storage.port,
    ];
    expect(new Set(ports).size).toBe(ports.length);
  });
});

// ══════════════════════════════════════
// Firestore Rules Syntax
// ══════════════════════════════════════

describe("Firestore rules file", () => {
  let rules;

  beforeAll(() => {
    rules = fs.readFileSync(
      path.join(ROOT, "firebase", "firestore.rules"),
      "utf-8"
    );
  });

  test("starts with rules_version", () => {
    expect(rules).toMatch(/^rules_version\s*=\s*'2'/);
  });

  test("contains service declaration", () => {
    expect(rules).toContain("service cloud.firestore");
  });

  test("has rules for users collection", () => {
    expect(rules).toContain("match /users/{uid}");
  });

  test("has rules for submissions collection", () => {
    expect(rules).toContain("match /submissions/{docId}");
  });

  test("has rules for config collection", () => {
    expect(rules).toContain("match /config/{docId}");
  });

  test("submissions deny client-side update and delete", () => {
    expect(rules).toContain("allow update: if false");
    expect(rules).toContain("allow delete: if false");
  });

  test("config is read-only for admins", () => {
    // Config should have allow read but no allow write
    const configSection = rules.substring(
      rules.indexOf("match /config/{docId}")
    );
    expect(configSection).toContain("allow read:");
    // Should not have allow write for config
    const nextMatch = configSection.indexOf("}", configSection.indexOf("{") + 1);
    const configBlock = configSection.substring(0, nextMatch);
    expect(configBlock).not.toContain("allow write");
  });
});

// ══════════════════════════════════════
// Storage Rules Syntax
// ══════════════════════════════════════

describe("Storage rules file", () => {
  let rules;

  beforeAll(() => {
    rules = fs.readFileSync(
      path.join(ROOT, "firebase", "storage.rules"),
      "utf-8"
    );
  });

  test("starts with rules_version", () => {
    expect(rules).toMatch(/^rules_version\s*=\s*'2'/);
  });

  test("has avatar upload rules", () => {
    expect(rules).toContain("match /avatars/{uid}");
  });

  test("enforces 2MB size limit on avatars", () => {
    expect(rules).toContain("request.resource.size < 2 * 1024 * 1024");
  });

  test("enforces image content type on avatars", () => {
    expect(rules).toContain("request.resource.contentType.matches('image/.*')");
  });

  test("requires auth and ownership for avatar writes", () => {
    expect(rules).toContain("request.auth != null");
    expect(rules).toContain("request.auth.uid == uid");
  });
});

// ══════════════════════════════════════
// Project Structure
// ══════════════════════════════════════

describe("Project structure", () => {
  const requiredFiles = [
    "firebase.json",
    "functions/index.js",
    "functions/package.json",
    "firebase/firestore.rules",
    "firebase/storage.rules",
    "firebase/firestore.indexes.json",
    "website/_config.yml",
    "website/Gemfile",
    "website/_data/page_copy.yml",
    "website/_data/about.yml",
    "website/_layouts/admin_page.html",
    "website/_layouts/guide.html",
    "website/_layouts/author.html",
    "website/assets/css/styles.css",
    ".github/workflows/deploy.yml",
  ];

  test.each(requiredFiles)("%s exists", (file) => {
    const fullPath = path.join(ROOT, file);
    expect(fs.existsSync(fullPath)).toBe(true);
  });

  test("_guides directory has both default and chinese subdirectories", () => {
    expect(
      fs.existsSync(path.join(WEBSITE, "_guides", "default"))
    ).toBe(true);
    expect(
      fs.existsSync(path.join(WEBSITE, "_guides", "chinese"))
    ).toBe(true);
  });

  test("_authors directory has both default and chinese subdirectories", () => {
    expect(
      fs.existsSync(path.join(WEBSITE, "_authors", "default"))
    ).toBe(true);
    expect(
      fs.existsSync(path.join(WEBSITE, "_authors", "chinese"))
    ).toBe(true);
  });
});
