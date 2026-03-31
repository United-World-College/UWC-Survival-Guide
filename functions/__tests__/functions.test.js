/**
 * Unit tests for exported Cloud Functions (callable functions).
 *
 * Each function is tested with mocked Firestore, Auth, and GitHub API.
 * The onCall wrapper is replaced with an identity function so we can
 * call the handler directly with { auth, data }.
 */

// ── Firestore mock infrastructure ──

const mockDocs = {};
let mockUpdateCalls = [];
let mockSetCalls = [];
let mockDeleteCalls = [];

function resetMockDb() {
  for (const key of Object.keys(mockDocs)) delete mockDocs[key];
  mockUpdateCalls = [];
  mockSetCalls = [];
  mockDeleteCalls = [];
}

function setMockDoc(collection, docId, data) {
  const key = `${collection}/${docId}`;
  mockDocs[key] = data;
}

const mockDoc = jest.fn((docId) => {
  // The collection is captured in closure via mockCollection
  const collectionName = mockDoc._currentCollection;
  const key = `${collectionName}/${docId}`;
  return {
    get: jest.fn(async () => ({
      exists: key in mockDocs,
      data: () => mockDocs[key] || null,
      id: docId,
    })),
    set: jest.fn(async (data, opts) => {
      mockSetCalls.push({ collection: collectionName, docId, data, opts });
      mockDocs[key] = { ...(mockDocs[key] || {}), ...data };
    }),
    update: jest.fn(async (data) => {
      mockUpdateCalls.push({ collection: collectionName, docId, data });
      if (key in mockDocs) {
        mockDocs[key] = { ...mockDocs[key], ...data };
      }
    }),
    delete: jest.fn(async () => {
      mockDeleteCalls.push({ collection: collectionName, docId });
      delete mockDocs[key];
    }),
  };
});

const mockCollection = jest.fn((name) => {
  mockDoc._currentCollection = name;
  return { doc: mockDoc };
});

jest.mock("firebase-admin/app", () => ({ initializeApp: jest.fn() }));
jest.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection }),
  FieldValue: {
    serverTimestamp: () => "SERVER_TIMESTAMP",
    arrayUnion: (...args) => ({ _arrayUnion: args }),
  },
}));

// Capture HttpsError so tests can assert on it
class MockHttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

jest.mock("firebase-functions/v2/https", () => ({
  onCall: (fn) => fn,
  HttpsError: MockHttpsError,
}));

// Mock global fetch for GitHub API calls
global.fetch = jest.fn();

// ── Require the module under test ──
const funcs = require("../index");

// ── Auth helper factories ──

function userAuth(uid, email = "user@test.com", verified = true) {
  return { uid, token: { email, email_verified: verified } };
}

function adminAuth(uid = "admin-uid") {
  return {
    uid,
    token: {
      email: "jingranhuang590@gmail.com",
      email_verified: true,
    },
  };
}

function admin2Auth(uid = "admin2-uid") {
  return {
    uid,
    token: {
      email: "li.dongyuan@ufl.edu",
      email_verified: true,
    },
  };
}

// ══════════════════════════════════════
// checkAdminStatus
// ══════════════════════════════════════

describe("checkAdminStatus", () => {
  beforeEach(() => resetMockDb());

  test("returns isAdmin=true for verified admin email", async () => {
    const result = await funcs.checkAdminStatus({ auth: adminAuth() });
    expect(result.isAdmin).toBe(true);
  });

  test("returns isAdmin=true for second admin email", async () => {
    const result = await funcs.checkAdminStatus({ auth: admin2Auth() });
    expect(result.isAdmin).toBe(true);
  });

  test("returns isAdmin=false for non-admin email", async () => {
    const result = await funcs.checkAdminStatus({
      auth: userAuth("u1", "nobody@test.com"),
    });
    expect(result.isAdmin).toBe(false);
  });

  test("returns isAdmin=false for unverified admin email", async () => {
    const result = await funcs.checkAdminStatus({
      auth: {
        uid: "u1",
        token: {
          email: "jingranhuang590@gmail.com",
          email_verified: false,
        },
      },
    });
    expect(result.isAdmin).toBe(false);
  });

  test("throws unauthenticated when auth is null", async () => {
    await expect(
      funcs.checkAdminStatus({ auth: null })
    ).rejects.toThrow("Sign in required.");
  });
});

// ══════════════════════════════════════
// resubmitArticle
// ══════════════════════════════════════

describe("resubmitArticle", () => {
  beforeEach(() => resetMockDb());

  const validData = {
    docId: "sub-1",
    title: "Updated Title",
    category: "Academics",
    language: "en",
    description: "Updated desc",
    content: "Updated content",
    authorMessage: "Fixed typos",
  };

  test("succeeds for owner with revise_resubmit status", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "user-1",
      status: "revise_resubmit",
      revisionHistory: [
        { round: 1, reviewerComments: "Fix this" },
      ],
    });

    const result = await funcs.resubmitArticle({
      auth: userAuth("user-1"),
      data: validData,
    });

    expect(result.success).toBe(true);
  });

  test("throws unauthenticated when not signed in", async () => {
    await expect(
      funcs.resubmitArticle({ auth: null, data: validData })
    ).rejects.toThrow("Sign in required.");
  });

  test("throws invalid-argument when required fields are missing", async () => {
    await expect(
      funcs.resubmitArticle({
        auth: userAuth("user-1"),
        data: { docId: "sub-1" },
      })
    ).rejects.toThrow("All content fields are required.");
  });

  test("throws not-found when submission does not exist", async () => {
    await expect(
      funcs.resubmitArticle({
        auth: userAuth("user-1"),
        data: validData,
      })
    ).rejects.toThrow("Submission not found.");
  });

  test("throws permission-denied when user is not the owner", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "other-user",
      status: "revise_resubmit",
    });

    await expect(
      funcs.resubmitArticle({
        auth: userAuth("user-1"),
        data: validData,
      })
    ).rejects.toThrow("You can only resubmit your own articles.");
  });

  test("throws failed-precondition when status is not revise_resubmit", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "user-1",
      status: "pending",
    });

    await expect(
      funcs.resubmitArticle({
        auth: userAuth("user-1"),
        data: validData,
      })
    ).rejects.toThrow("This submission is not awaiting revision.");
  });

  test("updates revision history with author message and resubmittedAt", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "user-1",
      status: "revise_resubmit",
      revisionHistory: [
        { round: 1, reviewerComments: "Fix this" },
      ],
    });

    await funcs.resubmitArticle({
      auth: userAuth("user-1"),
      data: validData,
    });

    const updateCall = mockUpdateCalls.find(
      (c) => c.collection === "submissions" && c.docId === "sub-1"
    );
    expect(updateCall).toBeDefined();
    expect(updateCall.data.status).toBe("pending");
    expect(updateCall.data.title).toBe("Updated Title");
    expect(updateCall.data.revisionHistory[0].authorMessage).toBe("Fixed typos");
    expect(updateCall.data.revisionHistory[0].resubmittedAt).toBeDefined();
  });
});

// ══════════════════════════════════════
// rejectSubmission
// ══════════════════════════════════════

describe("rejectSubmission", () => {
  beforeEach(() => resetMockDb());

  test("rejects submission with reason", async () => {
    setMockDoc("submissions", "sub-1", { status: "pending" });

    const result = await funcs.rejectSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1", reason: "Not relevant" },
    });

    expect(result.success).toBe(true);
    const updateCall = mockUpdateCalls.find(
      (c) => c.collection === "submissions"
    );
    expect(updateCall.data.status).toBe("rejected");
    expect(updateCall.data.rejectionReason).toBe("Not relevant");
  });

  test("throws for non-admin", async () => {
    await expect(
      funcs.rejectSubmission({
        auth: userAuth("user-1"),
        data: { docId: "sub-1", reason: "No" },
      })
    ).rejects.toThrow("Admin access required.");
  });

  test("throws when no docId provided", async () => {
    await expect(
      funcs.rejectSubmission({
        auth: adminAuth(),
        data: { reason: "No" },
      })
    ).rejects.toThrow("docId is required.");
  });

  test("throws when no reason provided", async () => {
    await expect(
      funcs.rejectSubmission({
        auth: adminAuth(),
        data: { docId: "sub-1" },
      })
    ).rejects.toThrow("Rejection reason is required.");
  });

  test("throws not-found for missing submission", async () => {
    await expect(
      funcs.rejectSubmission({
        auth: adminAuth(),
        data: { docId: "nonexistent", reason: "No" },
      })
    ).rejects.toThrow("Submission not found.");
  });

  test("throws for unverified admin email", async () => {
    await expect(
      funcs.rejectSubmission({
        auth: {
          uid: "admin",
          token: {
            email: "jingranhuang590@gmail.com",
            email_verified: false,
          },
        },
        data: { docId: "sub-1", reason: "No" },
      })
    ).rejects.toThrow("Verified email required.");
  });
});

// ══════════════════════════════════════
// requestRevision
// ══════════════════════════════════════

describe("requestRevision", () => {
  beforeEach(() => resetMockDb());

  test("creates revision history entry", async () => {
    setMockDoc("submissions", "sub-1", {
      title: "Test",
      category: "Academics",
      language: "en",
      description: "Desc",
      content: "Content",
      status: "pending",
      revisionHistory: [],
    });

    const result = await funcs.requestRevision({
      auth: adminAuth(),
      data: { docId: "sub-1", comments: "Please fix section 2" },
    });

    expect(result.success).toBe(true);
    expect(result.revisionHistory).toHaveLength(1);
    expect(result.revisionHistory[0].round).toBe(1);
    expect(result.revisionHistory[0].reviewerComments).toBe(
      "Please fix section 2"
    );
    expect(result.revisionHistory[0].contentSnapshot).toEqual({
      title: "Test",
      category: "Academics",
      language: "en",
      description: "Desc",
      content: "Content",
    });
  });

  test("appends to existing revision history", async () => {
    setMockDoc("submissions", "sub-1", {
      title: "Test",
      category: "Academics",
      language: "en",
      description: "Desc",
      content: "Updated content",
      status: "pending",
      revisionHistory: [
        { round: 1, reviewerComments: "First round" },
      ],
    });

    const result = await funcs.requestRevision({
      auth: adminAuth(),
      data: { docId: "sub-1", comments: "Second round comments" },
    });

    expect(result.revisionHistory).toHaveLength(2);
    expect(result.revisionHistory[1].round).toBe(2);
  });

  test("throws for non-admin", async () => {
    await expect(
      funcs.requestRevision({
        auth: userAuth("u1"),
        data: { docId: "sub-1", comments: "Fix" },
      })
    ).rejects.toThrow("Admin access required.");
  });

  test("throws when comments are missing", async () => {
    await expect(
      funcs.requestRevision({
        auth: adminAuth(),
        data: { docId: "sub-1" },
      })
    ).rejects.toThrow("Reviewer comments are required.");
  });
});

// ══════════════════════════════════════
// deleteSubmission
// ══════════════════════════════════════

describe("deleteSubmission", () => {
  beforeEach(() => {
    resetMockDb();
    global.fetch.mockReset();
  });

  test("deletes a pending submission", async () => {
    setMockDoc("submissions", "sub-1", {
      status: "pending",
      title: "Test",
    });

    const result = await funcs.deleteSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1" },
    });

    expect(result.success).toBe(true);
    expect(result.wasApproved).toBe(false);
    expect(result.guideId).toBeNull();
  });

  test("deletes an approved submission and cleans up author record", async () => {
    setMockDoc("submissions", "sub-1", {
      status: "approved",
      guide_id: "test-guide",
      title: "Test",
      language: "en",
      uid: "user-1",
    });
    setMockDoc("users", "user-1", {
      publishedArticles: [
        { guide_id: "test-guide", title: "Test", category: "Academics" },
        { guide_id: "other-guide", title: "Other", category: "Life Reflections" },
      ],
    });
    // No GitHub token
    setMockDoc("config", "github", { token: null });

    const result = await funcs.deleteSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1" },
    });

    expect(result.success).toBe(true);
    expect(result.wasApproved).toBe(true);
    expect(result.guideId).toBe("test-guide");

    // Verify the author's publishedArticles was updated
    const userUpdate = mockUpdateCalls.find(
      (c) => c.collection === "users" && c.docId === "user-1"
    );
    expect(userUpdate).toBeDefined();
    expect(userUpdate.data.publishedArticles).toEqual([
      { guide_id: "other-guide", title: "Other", category: "Life Reflections" },
    ]);
  });

  test("throws for non-admin", async () => {
    await expect(
      funcs.deleteSubmission({
        auth: userAuth("u1"),
        data: { docId: "sub-1" },
      })
    ).rejects.toThrow("Admin access required.");
  });

  test("throws when docId is missing", async () => {
    await expect(
      funcs.deleteSubmission({
        auth: adminAuth(),
        data: {},
      })
    ).rejects.toThrow("docId is required.");
  });

  test("throws not-found for missing submission", async () => {
    await expect(
      funcs.deleteSubmission({
        auth: adminAuth(),
        data: { docId: "ghost" },
      })
    ).rejects.toThrow("Submission not found.");
  });
});

// ══════════════════════════════════════
// approveSubmission
// ══════════════════════════════════════

describe("approveSubmission", () => {
  beforeEach(() => {
    resetMockDb();
    global.fetch.mockReset();
  });

  test("approves a pending submission", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "user-1",
      authorName: "Alice",
      title: "My Article",
      category: "Academics",
      language: "en",
      description: "Desc",
      content: "Content here",
      status: "pending",
      createdAt: { toDate: () => new Date("2026-01-15T00:00:00Z") },
    });
    setMockDoc("users", "admin-uid", { displayName: "Editor Bob" });
    setMockDoc("users", "user-1", { authorPage: "/authors/alice/" });
    // No GitHub token
    setMockDoc("config", "github", { token: null });

    const result = await funcs.approveSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1", approveMessage: "Good article!" },
    });

    expect(result.success).toBe(true);
    expect(result.published).toBe(false);
    expect(result.markdown).toContain('title: "My Article"');
    expect(result.markdown).toContain('author: "Alice"');
    expect(result.markdown).toContain('editor: "Editor Bob"');
    expect(result.authorSlug).toBe("alice");
    expect(result.slug).toBe("my-article");
  });

  test("throws for non-pending submission", async () => {
    setMockDoc("submissions", "sub-1", {
      status: "rejected",
    });

    await expect(
      funcs.approveSubmission({
        auth: adminAuth(),
        data: { docId: "sub-1" },
      })
    ).rejects.toThrow("Cannot approve in current state.");
  });

  test("can approve a revise_resubmit submission", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "user-1",
      authorName: "Alice",
      title: "Article",
      category: "Academics",
      language: "en",
      description: "Desc",
      content: "Content",
      status: "revise_resubmit",
      createdAt: { toDate: () => new Date("2026-01-15T00:00:00Z") },
    });
    setMockDoc("users", "admin-uid", { displayName: "" });
    setMockDoc("users", "user-1", {});
    setMockDoc("config", "github", {});

    const result = await funcs.approveSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1" },
    });

    expect(result.success).toBe(true);
  });

  test("throws for non-admin", async () => {
    await expect(
      funcs.approveSubmission({
        auth: userAuth("u1"),
        data: { docId: "sub-1" },
      })
    ).rejects.toThrow("Admin access required.");
  });

  test("throws when docId is missing", async () => {
    await expect(
      funcs.approveSubmission({
        auth: adminAuth(),
        data: {},
      })
    ).rejects.toThrow("docId is required.");
  });
});
