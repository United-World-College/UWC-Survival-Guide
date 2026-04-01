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

  test("has rules for submission audit collection", () => {
    expect(rules).toContain("match /submissionAudit/{docId}");
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
    "website/_data/i18n/en.yml",
    "website/_data/i18n/zh-CN.yml",
    "website/_data/i18n/zh-TW.yml",
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

// ══════════════════════════════════════
// Firestore Indexes
// ══════════════════════════════════════

describe("Firestore indexes file", () => {
  let indexes;

  beforeAll(() => {
    const raw = fs.readFileSync(
      path.join(ROOT, "firebase", "firestore.indexes.json"),
      "utf-8"
    );
    indexes = JSON.parse(raw);
  });

  test("is valid JSON with indexes array", () => {
    expect(indexes).toBeDefined();
    expect(Array.isArray(indexes.indexes)).toBe(true);
  });

  test("has fieldOverrides array", () => {
    expect(Array.isArray(indexes.fieldOverrides)).toBe(true);
  });

  test("each index has collectionGroup, queryScope, and fields", () => {
    for (const idx of indexes.indexes) {
      expect(idx.collectionGroup).toBeTruthy();
      expect(idx.queryScope).toBeTruthy();
      expect(Array.isArray(idx.fields)).toBe(true);
      expect(idx.fields.length).toBeGreaterThan(0);
    }
  });

  test("submissions index exists with uid and createdAt", () => {
    const submissionIdx = indexes.indexes.find(
      (i) => i.collectionGroup === "submissions"
    );
    expect(submissionIdx).toBeDefined();
    const fieldPaths = submissionIdx.fields.map((f) => f.fieldPath);
    expect(fieldPaths).toContain("uid");
    expect(fieldPaths).toContain("createdAt");
  });
});

// ══════════════════════════════════════
// CI/CD Workflow
// ══════════════════════════════════════

describe("Deploy workflow", () => {
  let workflow;

  beforeAll(() => {
    const raw = fs.readFileSync(
      path.join(ROOT, ".github", "workflows", "deploy.yml"),
      "utf-8"
    );
    workflow = yaml.load(raw);
  });

  test("is valid YAML", () => {
    expect(workflow).toBeDefined();
  });

  test("triggers on push to main", () => {
    expect(workflow.on.push.branches).toContain("main");
  });

  test("has build and deploy jobs", () => {
    expect(workflow.jobs.build).toBeDefined();
    expect(workflow.jobs.deploy).toBeDefined();
  });

  test("deploy depends on build", () => {
    expect(workflow.jobs.deploy.needs).toBe("build");
  });

  test("build job runs both functions and site tests", () => {
    const steps = workflow.jobs.build.steps;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Run Cloud Functions tests");
    expect(stepNames).toContain("Run site validation tests");
  });

  test("build job caches Node modules", () => {
    const steps = workflow.jobs.build.steps;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Cache Node modules (functions)");
    expect(stepNames).toContain("Cache Node modules (tests)");
  });
});
