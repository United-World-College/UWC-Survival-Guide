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
const mockDeleteField = Symbol("DELETE_FIELD");

function resetMockDb() {
  for (const key of Object.keys(mockDocs)) delete mockDocs[key];
  mockUpdateCalls = [];
  mockSetCalls = [];
  mockDeleteCalls = [];
  // Seed admin config so getAdminEmails() works in all tests
  mockDocs["config/admins"] = {
    emails: ["jingranhuang590@gmail.com", "li.dongyuan@ufl.edu"],
  };
}

function setMockDoc(collection, docId, data) {
  const key = `${collection}/${docId}`;
  mockDocs[key] = data;
}

function getMockDocData(collection, docId) {
  return mockDocs[`${collection}/${docId}`];
}

function applyMockWrite(existing, data, opts = {}) {
  const next = opts.merge ? { ...(existing || {}) } : {};
  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === mockDeleteField) {
      delete next[key];
      return;
    }
    next[key] = value;
  });
  return next;
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
      mockDocs[key] = applyMockWrite(mockDocs[key], data, opts || {});
    }),
    update: jest.fn(async (data) => {
      mockUpdateCalls.push({ collection: collectionName, docId, data });
      if (key in mockDocs) {
        mockDocs[key] = applyMockWrite(mockDocs[key], data, { merge: true });
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
  return {
    doc: mockDoc,
    where: jest.fn((field, op, value) => ({
      get: jest.fn(async () => {
        // Search all docs in this collection for matching field value
        const matches = [];
        const prefix = name + "/";
        for (const [key, data] of Object.entries(mockDocs)) {
          if (key.startsWith(prefix) && data && data[field] === value) {
            matches.push({ id: key.slice(prefix.length), data: () => data });
          }
        }
        return { empty: matches.length === 0, docs: matches };
      }),
    })),
  };
});

jest.mock("firebase-admin/app", () => ({ initializeApp: jest.fn() }));
jest.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection }),
  FieldValue: {
    serverTimestamp: () => "SERVER_TIMESTAMP",
    arrayUnion: (...args) => ({ _arrayUnion: args }),
    delete: () => mockDeleteField,
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

function mockGitHubSuccess() {
  setMockDoc("config", "github", { token: "gh-token-123" });
  global.fetch.mockImplementation(async (url, opts) => {
    if (opts && opts.method === "GET") {
      return { ok: true, status: 404 };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  });
}

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

function orderedAuthors(...authors) {
  return authors.map((author, index) => ({
    ...author,
    order: index + 1,
  }));
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

  test("succeeds for coauthor with revise_resubmit status", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "user-1",
      coauthorUids: ["user-2"],
      status: "revise_resubmit",
      revisionHistory: [
        { round: 1, reviewerComments: "Fix this" },
      ],
    });

    const result = await funcs.resubmitArticle({
      auth: userAuth("user-2"),
      data: validData,
    });

    expect(result.success).toBe(true);
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
      reviewerUid: "reviewer-1",
      reviewerEmail: "reviewer@test.com",
      revisionHistory: [
        {
          round: 1,
          reviewerComments: "Fix this",
          reviewerUid: "reviewer-1",
          reviewerEmail: "reviewer@test.com",
        },
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
    const stored = getMockDocData("submissions", "sub-1");
    expect(stored.reviewerUid).toBeUndefined();
    expect(stored.reviewerEmail).toBeUndefined();
    expect(stored.revisionHistory[0].reviewerUid).toBeUndefined();
    expect(stored.revisionHistory[0].reviewerEmail).toBeUndefined();
    const auditCall = mockSetCalls.find(
      (c) => c.collection === "submissionAudit" && c.docId === "sub-1"
    );
    expect(auditCall).toBeDefined();
    expect(auditCall.data.events[0].type).toBe("resubmitted");
    expect(auditCall.data.events[0].actorUid).toBe("user-1");
  });
});

// ══════════════════════════════════════
// rejectSubmission
// ══════════════════════════════════════

describe("rejectSubmission", () => {
  beforeEach(() => resetMockDb());

  test("rejects submission with reason", async () => {
    setMockDoc("submissions", "sub-1", {
      status: "pending",
      reviewerUid: "old-reviewer",
      reviewerEmail: "old-reviewer@test.com",
    });

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
    const stored = getMockDocData("submissions", "sub-1");
    expect(stored.reviewerUid).toBeUndefined();
    expect(stored.reviewerEmail).toBeUndefined();
    const auditCall = mockSetCalls.find(
      (c) => c.collection === "submissionAudit" && c.docId === "sub-1"
    );
    expect(auditCall).toBeDefined();
    expect(auditCall.data.events[0].type).toBe("rejected");
    expect(auditCall.data.events[0].actorUid).toBe("admin-uid");
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

  test("throws when docId is missing", async () => {
    await expect(
      funcs.requestRevision({
        auth: adminAuth(),
        data: { comments: "Fix it" },
      })
    ).rejects.toThrow("docId is required.");
  });

  test("throws not-found for missing submission", async () => {
    await expect(
      funcs.requestRevision({
        auth: adminAuth(),
        data: { docId: "nonexistent", comments: "Fix" },
      })
    ).rejects.toThrow("Submission not found.");
  });

  test("stores reviewer actor in private audit log and keeps public history anonymous", async () => {
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
      data: { docId: "sub-1", comments: "Fix this" },
    });

    expect(result.revisionHistory[0].reviewedAt).toBeDefined();
    expect(result.revisionHistory[0].reviewerUid).toBeUndefined();
    expect(result.revisionHistory[0].reviewerEmail).toBeUndefined();
    const stored = getMockDocData("submissions", "sub-1");
    expect(stored.reviewerUid).toBeUndefined();
    expect(stored.reviewerEmail).toBeUndefined();
    expect(stored.revisionHistory[0].reviewerUid).toBeUndefined();
    expect(stored.revisionHistory[0].reviewerEmail).toBeUndefined();
    const auditCall = mockSetCalls.find(
      (c) => c.collection === "submissionAudit" && c.docId === "sub-1"
    );
    expect(auditCall).toBeDefined();
    expect(auditCall.data.events[0].type).toBe("revision_requested");
    expect(auditCall.data.events[0].actorUid).toBe("admin-uid");
    expect(auditCall.data.events[0].actorAuthorId).toBeNull();
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
    const auditCall = mockSetCalls.find(
      (c) => c.collection === "submissionAudit" && c.docId === "sub-1"
    );
    expect(auditCall).toBeDefined();
    expect(auditCall.data.events[0].type).toBe("deleted");
    expect(auditCall.data.events[0].actorUid).toBe("admin-uid");
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
      featuredGuideIds: ["test-guide", "other-guide"],
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

    // Verify the author's publishedArticles and featuredGuideIds were updated
    const userUpdate = mockUpdateCalls.find(
      (c) => c.collection === "users" && c.docId === "user-1"
    );
    expect(userUpdate).toBeDefined();
    expect(userUpdate.data.publishedArticles).toEqual([
      { guide_id: "other-guide", title: "Other", category: "Life Reflections" },
    ]);
    expect(userUpdate.data.featuredGuideIds).toEqual(["other-guide"]);
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

  test("deletes approved submission GitHub file when token exists", async () => {
    setMockDoc("submissions", "sub-1", {
      status: "approved",
      guide_id: "test-guide",
      title: "Test",
      language: "en",
      uid: "user-1",
    });
    setMockDoc("users", "user-1", { publishedArticles: [] });
    setMockDoc("config", "github", { token: "gh-token-123" });

    // GET returns existing file with sha, DELETE succeeds
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ sha: "abc123" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

    const result = await funcs.deleteSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1" },
    });

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    // Second call should be DELETE
    const deleteCall = global.fetch.mock.calls[1];
    expect(deleteCall[1].method).toBe("DELETE");
  });

  test("still succeeds if GitHub delete fails", async () => {
    setMockDoc("submissions", "sub-1", {
      status: "approved",
      guide_id: "test-guide",
      title: "Test",
      language: "en",
      uid: "user-1",
    });
    setMockDoc("users", "user-1", { publishedArticles: [] });
    setMockDoc("config", "github", { token: "gh-token-123" });

    // GitHub API throws error
    global.fetch.mockRejectedValue(new Error("Network error"));

    const result = await funcs.deleteSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1" },
    });

    // Should still succeed — GitHub errors don't block deletion
    expect(result.success).toBe(true);
  });

  test("handles approved submission without uid gracefully", async () => {
    setMockDoc("submissions", "sub-1", {
      status: "approved",
      guide_id: "test-guide",
      title: "Test",
      language: "en",
    });
    setMockDoc("config", "github", {});

    const result = await funcs.deleteSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1" },
    });

    expect(result.success).toBe(true);
    expect(result.wasApproved).toBe(true);
  });

  test("uses correct language suffix for zh-CN guide path", async () => {
    setMockDoc("submissions", "sub-1", {
      status: "approved",
      guide_id: "test-guide",
      title: "Test",
      language: "zh-CN",
      uid: "user-1",
    });
    setMockDoc("users", "user-1", { publishedArticles: [] });
    setMockDoc("config", "github", { token: "gh-token-123" });

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ sha: "abc123" }),
      })
      .mockResolvedValueOnce({ ok: true, status: 204 });

    await funcs.deleteSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1" },
    });

    // GET request should target the zh-CN file path
    const getCall = global.fetch.mock.calls[0];
    expect(getCall[0]).toContain("chinese/test-guide-CN.md");
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
      coAuthors: orderedAuthors({ uid: "user-1", author_id: "alice", name: "Alice" }),
      title: "My Article",
      category: "Academics",
      language: "en",
      description: "Desc",
      content: "Content here",
      status: "pending",
      createdAt: { toDate: () => new Date("2026-01-15T00:00:00Z") },
    });
    setMockDoc("users", "admin-uid", { displayName: "Editor Bob" });
    setMockDoc("users", "user-1", { author_id: "alice" });
    mockGitHubSuccess();

    const result = await funcs.approveSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1", approveMessage: "Good article!" },
    });

    expect(result.success).toBe(true);
    expect(result.published).toBe(true);
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
      coAuthors: orderedAuthors({ uid: "user-1", name: "Alice" }),
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
    mockGitHubSuccess();

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

  test("throws not-found for missing submission", async () => {
    await expect(
      funcs.approveSubmission({
        auth: adminAuth(),
        data: { docId: "nonexistent" },
      })
    ).rejects.toThrow("Submission not found.");
  });

  test("stores approveMessage when provided", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "user-1",
      authorName: "Alice",
      coAuthors: orderedAuthors({ uid: "user-1", name: "Alice" }),
      title: "Article",
      category: "Academics",
      language: "en",
      description: "Desc",
      content: "Content",
      status: "pending",
      reviewerUid: "old-reviewer",
      reviewerEmail: "old-reviewer@test.com",
      revisionHistory: [
        {
          round: 1,
          reviewerComments: "Looks promising",
          reviewerUid: "old-reviewer",
          reviewerEmail: "old-reviewer@test.com",
        },
      ],
      createdAt: { toDate: () => new Date("2026-01-15T00:00:00Z") },
    });
    setMockDoc("users", "admin-uid", { displayName: "" });
    setMockDoc("users", "user-1", {});
    mockGitHubSuccess();

    await funcs.approveSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1", approveMessage: "Great work!" },
    });

    const updateCall = mockUpdateCalls.find(
      (c) => c.collection === "submissions" && c.docId === "sub-1"
    );
    expect(updateCall.data.approveMessage).toBe("Great work!");
    const stored = getMockDocData("submissions", "sub-1");
    expect(stored.reviewerUid).toBeUndefined();
    expect(stored.reviewerEmail).toBeUndefined();
    expect(stored.revisionHistory[0].reviewerUid).toBeUndefined();
    expect(stored.revisionHistory[0].reviewerEmail).toBeUndefined();
    const auditCall = mockSetCalls.find(
      (c) => c.collection === "submissionAudit" && c.docId === "sub-1"
    );
    expect(auditCall).toBeDefined();
    expect(auditCall.data.events[0].type).toBe("approved");
    expect(auditCall.data.events[0].actorUid).toBe("admin-uid");
    expect(auditCall.data.events[0].approveMessage).toBe("Great work!");
  });

  test("resolves authorSlug from user author_id when available", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "user-1",
      authorName: "Alice Smith",
      coAuthors: orderedAuthors({ uid: "user-1", name: "Alice Smith" }),
      title: "Article",
      category: "Academics",
      language: "en",
      description: "Desc",
      content: "Content",
      status: "pending",
      createdAt: { toDate: () => new Date("2026-01-15T00:00:00Z") },
    });
    setMockDoc("users", "admin-uid", { displayName: "" });
    setMockDoc("users", "user-1", { author_id: "custom-slug" });
    mockGitHubSuccess();

    const result = await funcs.approveSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1" },
    });

    expect(result.authorSlug).toBe("custom-slug");
  });

  test("publishes to GitHub when token is available", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "user-1",
      authorName: "Alice",
      coAuthors: orderedAuthors({ uid: "user-1", name: "Alice" }),
      title: "My Article",
      category: "Academics",
      language: "en",
      description: "Desc",
      content: "Content",
      status: "pending",
      createdAt: { toDate: () => new Date("2026-01-15T00:00:00Z") },
    });
    setMockDoc("users", "admin-uid", { displayName: "Editor" });
    setMockDoc("users", "user-1", {});
    setMockDoc("config", "github", { token: "gh-token-123" });

    // Mock GitHub API: GET calls return 404 (not found), PUT calls succeed
    global.fetch.mockImplementation(async (url, opts) => {
      if (opts && opts.method === "GET") {
        return { ok: true, status: 404 };
      }
      // PUT calls for guide and author files
      return { ok: true, status: 200, json: async () => ({}) };
    });

    const result = await funcs.approveSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1" },
    });

    expect(result.published).toBe(true);
    expect(result.githubError).toBeNull();
    expect(global.fetch).toHaveBeenCalled();
  });

  test("throws and keeps status unchanged when GitHub publish fails", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "user-1",
      authorName: "Alice",
      coAuthors: orderedAuthors({ uid: "user-1", name: "Alice" }),
      title: "My Article",
      category: "Academics",
      language: "en",
      description: "Desc",
      content: "Content",
      status: "pending",
      createdAt: { toDate: () => new Date("2026-01-15T00:00:00Z") },
    });
    setMockDoc("users", "admin-uid", { displayName: "" });
    setMockDoc("users", "user-1", {});
    setMockDoc("config", "github", { token: "gh-token-123" });

    // First fetch (GET existing file) returns 404, second (PUT) fails
    global.fetch
      .mockResolvedValueOnce({ ok: true, status: 404 })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });

    await expect(
      funcs.approveSubmission({
        auth: adminAuth(),
        data: { docId: "sub-1" },
      })
    ).rejects.toThrow("Article could not be published to GitHub");

    // Status should remain pending
    const stored = getMockDocData("submissions", "sub-1");
    expect(stored.status).toBe("pending");
  });

  test("updates author record with publishedArticles", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "user-1",
      authorName: "Alice",
      coAuthors: orderedAuthors({ uid: "user-1", name: "Alice" }),
      title: "My Article",
      category: "Academics",
      language: "en",
      description: "Desc",
      content: "Content",
      status: "pending",
      createdAt: { toDate: () => new Date("2026-01-15T00:00:00Z") },
    });
    setMockDoc("users", "admin-uid", { displayName: "" });
    setMockDoc("users", "user-1", {});
    mockGitHubSuccess();

    await funcs.approveSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1" },
    });

    // Should set author_id on user
    const setCall = mockSetCalls.find(
      (c) => c.collection === "users" && c.docId === "user-1"
    );
    expect(setCall).toBeDefined();
    expect(setCall.data.author_id).toBe("alice");
    expect(setCall.data.authorPage).toBeUndefined();
  });

  test("does not overwrite existing author_id on user record", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "user-1",
      authorName: "Alice",
      coAuthors: orderedAuthors({ uid: "user-1", author_id: "alice", name: "Alice" }),
      title: "Second Article",
      category: "Academics",
      language: "en",
      description: "Desc",
      content: "Content",
      status: "pending",
      createdAt: { toDate: () => new Date("2026-01-15T00:00:00Z") },
    });
    setMockDoc("users", "admin-uid", { displayName: "" });
    setMockDoc("users", "user-1", { author_id: "alice-original" });
    mockGitHubSuccess();

    await funcs.approveSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1" },
    });

    // Should NOT overwrite existing author_id
    const setCall = mockSetCalls.find(
      (c) => c.collection === "users" && c.docId === "user-1"
    );
    expect(setCall).toBeUndefined();
    // User should still have original author_id
    const userData = getMockDocData("users", "user-1");
    expect(userData.author_id).toBe("alice-original");
  });

  test("deduplicates author_id when slug collides with existing user", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "user-new",
      authorName: "Alice",
      coAuthors: orderedAuthors({ uid: "user-new", author_id: "alice", name: "Alice" }),
      title: "New Article",
      category: "Academics",
      language: "en",
      description: "Desc",
      content: "Content",
      status: "pending",
      createdAt: { toDate: () => new Date("2026-01-15T00:00:00Z") },
    });
    setMockDoc("users", "admin-uid", { displayName: "" });
    // user-new has no author_id yet, but "alice" is taken by another user
    setMockDoc("users", "user-new", {});
    setMockDoc("users", "user-existing", { author_id: "alice" });
    mockGitHubSuccess();

    await funcs.approveSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1" },
    });

    const setCall = mockSetCalls.find(
      (c) => c.collection === "users" && c.docId === "user-new"
    );
    expect(setCall).toBeDefined();
    // Should get a suffixed slug since "alice" is taken
    expect(setCall.data.author_id).toBe("alice-2");
  });

  test("transliterates accented Latin names when assigning author_id", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "user-1",
      authorName: "José Álvarez",
      coAuthors: orderedAuthors({ uid: "user-1", name: "José Álvarez" }),
      title: "Accent Test",
      category: "Academics",
      language: "en",
      description: "Desc",
      content: "Content",
      status: "pending",
      createdAt: { toDate: () => new Date("2026-01-15T00:00:00Z") },
    });
    setMockDoc("users", "admin-uid", { displayName: "" });
    setMockDoc("users", "user-1", {});
    mockGitHubSuccess();

    const result = await funcs.approveSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1" },
    });

    const setCall = mockSetCalls.find(
      (c) => c.collection === "users" && c.docId === "user-1"
    );
    expect(setCall).toBeDefined();
    expect(setCall.data.author_id).toBe("jose-alvarez");
    expect(result.authorSlug).toBe("jose-alvarez");
  });

  test("falls back to uid when generated author_id would be empty", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "user-1",
      authorName: "李东元",
      coAuthors: orderedAuthors({ uid: "user-1", name: "李东元" }),
      title: "Fallback Test",
      category: "Academics",
      language: "en",
      description: "Desc",
      content: "Content",
      status: "pending",
      createdAt: { toDate: () => new Date("2026-01-15T00:00:00Z") },
    });
    setMockDoc("users", "admin-uid", { displayName: "" });
    setMockDoc("users", "user-1", {});
    mockGitHubSuccess();

    const result = await funcs.approveSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1" },
    });

    const setCall = mockSetCalls.find(
      (c) => c.collection === "users" && c.docId === "user-1"
    );
    expect(setCall).toBeDefined();
    expect(setCall.data.author_id).toBe("user-1");
    expect(result.authorSlug).toBe("user-1");
  });

  test("uses ordered authors for markdown and updates every listed author", async () => {
    setMockDoc("submissions", "sub-1", {
      uid: "user-1",
      authorName: "Alice",
      coAuthors: orderedAuthors(
        { uid: "user-2", author_id: "bob", name: "Bob" },
        { uid: "user-1", author_id: "alice", name: "Alice" },
        { uid: "user-3", author_id: "carol", name: "Carol" }
      ),
      title: "Collaborative Article",
      category: "Academics",
      language: "en",
      description: "Desc",
      content: "Content",
      status: "pending",
      createdAt: { toDate: () => new Date("2026-01-15T00:00:00Z") },
    });
    setMockDoc("users", "admin-uid", { displayName: "" });
    setMockDoc("users", "user-1", { author_id: "alice" });
    setMockDoc("users", "user-2", { author_id: "bob" });
    setMockDoc("users", "user-3", { author_id: "carol" });
    mockGitHubSuccess();

    const result = await funcs.approveSubmission({
      auth: adminAuth(),
      data: { docId: "sub-1" },
    });

    expect(result.authorSlug).toBe("bob");
    expect(result.authorName).toBe("Bob");
    expect(result.markdown).toContain('author: "Bob"');
    expect(result.markdown).toContain('author_id: "bob"');
    expect(result.markdown).toContain('  - name: "Alice"');
    expect(result.markdown).toContain('  - name: "Carol"');
    expect(result.markdown).not.toContain('  - name: "Bob"');

    // Users already have author_id, so no set calls for author_id — only
    // update calls for publishedArticles
    const userSetCalls = mockSetCalls.filter(
      (call) => call.collection === "users" && call.docId !== "admin-uid"
    );
    expect(userSetCalls).toHaveLength(0);

    const updatedUserIds = mockUpdateCalls
      .filter((call) => call.collection === "users")
      .map((call) => call.docId)
      .sort();
    expect(updatedUserIds).toEqual(["user-1", "user-2", "user-3"]);
  });
});
