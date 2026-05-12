/**
 * Unit tests for functions/lib/notify.js — admin email notification
 * helper for new submissions and resubmissions.
 */

// Stub firebase-admin so transitive requires (helpers -> config) don't init real Firebase.
jest.mock("firebase-admin/app", () => ({ initializeApp: jest.fn() }));
jest.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({}),
  FieldValue: { delete: () => Symbol("DELETE") },
}));

// Capture nodemailer activity.
const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));
jest.mock("nodemailer", () => ({ createTransport: mockCreateTransport }));

// Control admin list without hitting Firestore.
let mockAdminEmails = [];
jest.mock("../lib/auth", () => ({
  getAdminEmails: jest.fn(async () => mockAdminEmails),
}));

const { notifyAdminsOfSubmission } = require("../lib/notify");

beforeEach(() => {
  mockSendMail.mockReset();
  mockSendMail.mockResolvedValue({ messageId: "ok" });
  mockCreateTransport.mockClear();
  mockAdminEmails = ["jingranhuang590@gmail.com", "li.dongyuan@ufl.edu"];
  process.env.GMAIL_APP_PASSWORD = "test-app-password";
});

function baseData(overrides = {}) {
  return {
    title: "How to survive Y1",
    category: "Academics",
    language: "en",
    description: "A practical guide to acing your first year.",
    authorName: "Alice",
    coAuthors: [{ name: "Alice", order: 1 }],
    ...overrides,
  };
}

describe("notifyAdminsOfSubmission", () => {
  test("sends one email to all admins with correct subject + deep link (new)", async () => {
    await notifyAdminsOfSubmission("docABC", baseData(), "new", "submitter@x.com");

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const call = mockSendMail.mock.calls[0][0];

    expect(call.from).toContain("mclemore880@gmail.com");
    expect(call.to).toBe("mclemore880@gmail.com");
    expect(call.bcc).toEqual(["jingranhuang590@gmail.com", "li.dongyuan@ufl.edu"]);
    expect(call.subject).toBe("[UWC Survival Guide] New submission: How to survive Y1");
    expect(call.html).toContain("https://uwc-survival-guide.pages.dev/admin/?submission=docABC");
    expect(call.text).toContain("https://uwc-survival-guide.pages.dev/admin/?submission=docABC");
    expect(call.html).toContain("How to survive Y1");
  });

  test("uses Resubmission subject prefix for kind=resubmit", async () => {
    await notifyAdminsOfSubmission("docXYZ", baseData(), "resubmit", "submitter@x.com");

    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toBe("[UWC Survival Guide] Resubmission: How to survive Y1");
    expect(call.text).toContain("resubmitted after revision");
  });

  test("excludes submitter from recipients when submitter is also an admin", async () => {
    await notifyAdminsOfSubmission("doc1", baseData(), "new", "li.dongyuan@ufl.edu");

    const call = mockSendMail.mock.calls[0][0];
    expect(call.bcc).toEqual(["jingranhuang590@gmail.com"]);
    expect(call.bcc).not.toContain("li.dongyuan@ufl.edu");
  });

  test("does not send when submitter is the only admin", async () => {
    mockAdminEmails = ["solo@admin.com"];
    await notifyAdminsOfSubmission("doc2", baseData(), "new", "solo@admin.com");
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  test("swallows sendMail failures (best-effort; must not throw)", async () => {
    mockSendMail.mockRejectedValueOnce(new Error("SMTP timeout"));
    await expect(
        notifyAdminsOfSubmission("doc3", baseData(), "new", "submitter@x.com"),
    ).resolves.toBeUndefined();
  });

  test("escapes HTML in title and description (no XSS in mail body)", async () => {
    const data = baseData({
      title: "<script>alert(1)</script>",
      description: "evil & <img onerror=x>",
    });
    await notifyAdminsOfSubmission("doc4", data, "new", "submitter@x.com");

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).not.toContain("<script>");
    expect(call.html).toContain("&lt;script&gt;");
    expect(call.html).toContain("evil &amp; ");
  });

  test("truncates very long descriptions in the HTML body", async () => {
    const data = baseData({ description: "x".repeat(500) });
    await notifyAdminsOfSubmission("doc5", data, "new", "submitter@x.com");

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain("…");
  });

  test("includes co-author names when present", async () => {
    const data = baseData({
      authorName: "Alice",
      coAuthors: [
        { name: "Alice", order: 1 },
        { name: "Bob", order: 2 },
      ],
    });
    await notifyAdminsOfSubmission("doc6", data, "new", "submitter@x.com");

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain("Bob");
    expect(call.text).toContain("Bob");
  });
});
