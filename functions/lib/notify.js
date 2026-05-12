const nodemailer = require("nodemailer");
const { getAdminEmails } = require("./auth");
const { getOrderedSubmissionAuthors } = require("./helpers");

const SMTP_USER = "mclemore880@gmail.com";
const FROM = `UWC Survival Guide <${SMTP_USER}>`;
const ADMIN_URL = "https://uwc-survival-guide.pages.dev/admin/";

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) {
    throw new Error("GMAIL_APP_PASSWORD not set");
  }
  _transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: SMTP_USER, pass },
  });
  return _transporter;
}

function escapeHtml(str) {
  return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
}

function truncate(str, max) {
  const s = String(str == null ? "" : str);
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function buildSubject(kind, title) {
  const prefix = kind === "resubmit" ? "Resubmission" : "New submission";
  return `[UWC Survival Guide] ${prefix}: ${truncate(title, 80)}`;
}

function formatAuthors(data) {
  const ordered = getOrderedSubmissionAuthors(data);
  const names = ordered.map((a) => a.name).filter(Boolean);
  const primary = data.authorName || (names[0] || "");
  if (names.length <= 1) return primary;
  return `${primary} (with ${names.slice(1).join(", ")})`;
}

function buildBody(docId, data, kind) {
  const link = `${ADMIN_URL}?submission=${encodeURIComponent(docId)}`;
  const heading = kind === "resubmit"
      ? "An article has been resubmitted after revision."
      : "A new article has been submitted.";
  const authors = formatAuthors(data);
  const title = data.title || "(untitled)";
  const category = data.category || "";
  const language = data.language || "";
  const description = truncate(data.description || "", 300);

  const text = [
    heading,
    "",
    `Title: ${title}`,
    `Author: ${authors}`,
    `Category: ${category}`,
    `Language: ${language}`,
    "",
    "Description:",
    description,
    "",
    `Review in admin panel: ${link}`,
  ].join("\n");

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#222;line-height:1.5">
  <p style="margin:0 0 16px;font-size:15px;">${escapeHtml(heading)}</p>
  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin:0 0 20px;">
    <tr><td style="padding:4px 12px 4px 0;color:#666;width:90px;">Title</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(title)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666;">Author</td><td style="padding:4px 0;">${escapeHtml(authors)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666;">Category</td><td style="padding:4px 0;">${escapeHtml(category)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666;">Language</td><td style="padding:4px 0;">${escapeHtml(language)}</td></tr>
  </table>
  <p style="margin:0 0 8px;color:#666;font-size:13px;">Description</p>
  <blockquote style="margin:0 0 24px;padding:8px 14px;border-left:3px solid #ddd;color:#444;background:#fafafa;">${escapeHtml(description)}</blockquote>
  <p style="margin:0 0 24px;">
    <a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Review in admin panel</a>
  </p>
  <p style="margin:0;color:#888;font-size:12px;">If the button doesn't work, paste this URL: ${escapeHtml(link)}</p>
</div>`.trim();

  return { text, html };
}

async function notifyAdminsOfSubmission(docId, data, kind, submitterEmail) {
  try {
    const adminEmails = await getAdminEmails();
    const recipients = adminEmails.filter((e) => e && e !== submitterEmail);
    if (recipients.length === 0) {
      console.log("[notify] no recipients (submitter is sole admin or list empty)");
      return;
    }

    const subject = buildSubject(kind, data.title || "(untitled)");
    const { text, html } = buildBody(docId, data, kind);

    await getTransporter().sendMail({
      from: FROM,
      to: SMTP_USER,
      bcc: recipients,
      subject,
      text,
      html,
    });
    console.log(`[notify] sent ${kind} email for ${docId} to ${recipients.length} recipient(s)`);
  } catch (err) {
    console.error("[notify] failed:", err && err.message ? err.message : err);
  }
}

module.exports = { notifyAdminsOfSubmission };
