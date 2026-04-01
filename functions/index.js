const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

let _adminEmailsCache = null;
let _adminEmailsCacheTime = 0;
const ADMIN_CACHE_TTL = 5 * 60 * 1000; // 5 min cache

async function getAdminEmails() {
  const now = Date.now();
  if (_adminEmailsCache && now - _adminEmailsCacheTime < ADMIN_CACHE_TTL) {
    return _adminEmailsCache;
  }
  const snap = await db.collection("config").doc("admins").get();
  if (!snap.exists || !Array.isArray(snap.data().emails)) {
    throw new HttpsError("internal", "Admin configuration not found.");
  }
  _adminEmailsCache = snap.data().emails;
  _adminEmailsCacheTime = now;
  return _adminEmailsCache;
}
const REPO = "United-World-College/UWC-Survival-Guide";
const LANG_MAP = {
  "en":    { name: "English",  folder: "default", sort: 1, suffix: "" },
  "zh-CN": { name: "\u7b80\u4f53\u4e2d\u6587", folder: "chinese", sort: 2, suffix: "-CN" },
  "zh-TW": { name: "\u53f0\u7063\u7e41\u9ad4", folder: "chinese", sort: 3, suffix: "-TW" },
};

// ── Helpers ──

function assertAuth(auth) {
  if (!auth) throw new HttpsError("unauthenticated", "Sign in required.");
}

async function assertAdmin(auth) {
  assertAuth(auth);
  if (auth.token.email_verified !== true) {
    throw new HttpsError("permission-denied", "Verified email required.");
  }
  const adminEmails = await getAdminEmails();
  if (!adminEmails.includes(auth.token.email)) {
    throw new HttpsError("permission-denied", "Admin access required.");
  }
}

async function getGitHubToken() {
  const doc = await db.collection("config").doc("github").get();
  return doc.exists && doc.data().token ? doc.data().token : null;
}

async function githubApi(method, path, token, body) {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "uwc-survival-guide-functions",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (method === "GET" && res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub ${method} ${path}: ${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function toBase64(str) {
  return Buffer.from(str, "utf-8").toString("base64");
}

function makeSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/(^-|-$)/g, "");
}

function makeAuthorSlug(text) {
  return (text || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[ß]/g, "ss")
      .replace(/[Ææ]/g, "ae")
      .replace(/[Œœ]/g, "oe")
      .replace(/[Øø]/g, "o")
      .replace(/[ÐðĐđ]/g, "d")
      .replace(/[Þþ]/g, "th")
      .replace(/[Łł]/g, "l")
      .replace(/[Ħħ]/g, "h")
      .replace(/[ı]/g, "i")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
}

function getAuthorKey(author) {
  if (!author) return "";
  if (author.uid) return `uid:${author.uid}`;
  if (author.author_id) return `author:${author.author_id}`;
  const name = (author.name || "").trim().toLowerCase();
  return name ? `name:${name}` : "";
}

function getOrderedSubmissionAuthors(d) {
  const seen = new Set();
  return (Array.isArray(d.coAuthors) ? d.coAuthors : [])
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((author, index) => ({
        uid: author.uid || null,
        author_id: author.author_id || null,
        name: (author.name || "").trim(),
        order: author.order || index + 1,
      }))
      .filter((author) => {
        if (!author.name) return false;
        const key = getAuthorKey(author);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
}

function sanitizeRevisionHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.map((entry, index) => {
    if (!entry || typeof entry !== "object") return null;
    const cleaned = { ...entry };
    delete cleaned.reviewerUid;
    delete cleaned.reviewerEmail;
    delete cleaned.authorUid;
    delete cleaned.authorEmail;
    delete cleaned.actorUid;
    delete cleaned.actorEmail;
    if (!cleaned.round) cleaned.round = index + 1;
    return cleaned;
  }).filter(Boolean);
}

function withoutPublicActorFields(updateData) {
  return {
    ...updateData,
    reviewerUid: FieldValue.delete(),
    reviewerEmail: FieldValue.delete(),
  };
}

async function appendSubmissionAuditEvent(docId, type, auth, details = {}) {
  const auditRef = db.collection("submissionAudit").doc(docId);
  const snap = await auditRef.get();
  const existingEvents = snap.exists && Array.isArray(snap.data().events) ?
    snap.data().events.slice() :
    [];
  const userDoc = await db.collection("users").doc(auth.uid).get();
  const actorAuthorId = userDoc.exists && userDoc.data().author_id ? userDoc.data().author_id : null;
  existingEvents.push({
    type,
    actorUid: auth.uid,
    actorAuthorId,
    actedAt: new Date().toISOString(),
    ...details,
  });
  await auditRef.set({
    submissionId: docId,
    updatedAt: FieldValue.serverTimestamp(),
    events: existingEvents,
  }, { merge: true });
}

async function resolveSubmissionAuthors(d) {
  const authors = getOrderedSubmissionAuthors(d);
  if (!authors.length) {
    throw new HttpsError("failed-precondition", "Submission is missing ordered authors.");
  }
  return Promise.all(authors.map(async (author) => ({
    ...author,
    author_id: author.author_id || await resolveAuthorSlug(author.uid, author.name),
  })));
}

function generateMarkdown(d, authors, editorName, overrideSlug) {
  if (!authors || !authors.length) {
    throw new Error("Ordered authors are required to generate markdown.");
  }
  const lang = d.language || "en";
  const langInfo = LANG_MAP[lang] || LANG_MAP["en"];
  const slug = overrideSlug || makeSlug(d.title);
  const today = new Date().toISOString().slice(0, 10);
  const submittedDate = d.createdAt ? d.createdAt.toDate().toISOString().slice(0, 10) : "";
  const primaryAuthor = authors[0];
  const coAuthors = authors.slice(1);

  let md = "---\n";
  md += `title: "${d.title.replace(/"/g, '\\"')}"\n`;
  md += `category: "${d.category}"\n`;
  md += `description: "${d.description.replace(/"/g, '\\"')}"\n`;
  md += "order: 99\n";
  md += `author: "${primaryAuthor.name.replace(/"/g, '\\"')}"\n`;
  md += `author_id: "${primaryAuthor.author_id}"\n`;
  if (coAuthors.length > 0) {
    md += "coauthors:\n";
    coAuthors.forEach((ca) => {
      md += `  - name: "${ca.name.replace(/"/g, '\\"')}"\n`;
      if (ca.author_id) {
        md += `    author_id: "${ca.author_id}"\n`;
      }
    });
  }
  md += `guide_id: "${slug}"\n`;
  md += `language_code: "${lang}"\n`;
  md += `language_name: "${langInfo.name}"\n`;
  md += `language_folder: "${langInfo.folder}"\n`;
  md += `language_sort: ${langInfo.sort}\n`;
  if (submittedDate) md += `submitted: ${submittedDate}\n`;
  md += `published: ${today}\n`;
  md += `updated: ${today}\n`;
  if (editorName) {
    const editorSlug = makeAuthorSlug(editorName) || makeSlug(editorName);
    md += `editor: "${editorName.replace(/"/g, '\\"')}"\n`;
    if (editorSlug) md += `editor_id: "${editorSlug}"\n`;
  }
  md += "---\n\n";
  md += d.content;

  return {
    markdown: md,
    slug,
    fileName: slug + langInfo.suffix + ".md",
    folder: langInfo.folder,
    filePath: "website/_guides/" + langInfo.folder + "/" + slug + langInfo.suffix + ".md",
  };
}

async function resolveAuthorSlug(uid, authorName) {
  if (uid) {
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.exists && userDoc.data().author_id) {
      return userDoc.data().author_id;
    }
  }
  return makeAuthorSlug(authorName) || (uid ? uid.toLowerCase() : makeSlug(authorName));
}

async function ensureAuthorPresenceOnGitHub(token, author) {
  const authorSlug = author.author_id ||
    makeAuthorSlug(author.name) ||
    (author.uid ? author.uid.toLowerCase() : "") ||
    makeSlug(author.name);
  const esc = author.name.replace(/"/g, '\\"');
  const tKey = "author-" + authorSlug;
  const authorFiles = [
    {
      path: `website/_authors/default/${authorSlug}.md`,
      content: `---\ntitle: "${esc}"\nauthor_id: ${authorSlug}\npermalink: /authors/${authorSlug}/\ntranslation_key: ${tKey}\nlanguage_code: en\nlanguage_name: English\nlanguage_sort: 1\n---\n`,
    },
    {
      path: `website/_authors/chinese/${authorSlug}-cn.md`,
      content: `---\ntitle: "${esc}"\nauthor_id: ${authorSlug}\npermalink: /zh-cn/authors/${authorSlug}/\ntranslation_key: ${tKey}\nlanguage_code: zh-CN\nlanguage_name: "\u7b80\u4f53\u4e2d\u6587"\nlanguage_sort: 2\n---\n`,
    },
    {
      path: `website/_authors/chinese/${authorSlug}-tw.md`,
      content: `---\ntitle: "${esc}"\nauthor_id: ${authorSlug}\npermalink: /zh-tw/authors/${authorSlug}/\ntranslation_key: ${tKey}\nlanguage_code: zh-TW\nlanguage_name: "\u7e41\u9ad4\u4e2d\u6587"\nlanguage_sort: 3\n---\n`,
    },
  ];

  await Promise.all(authorFiles.map(async (f) => {
    const check = await githubApi("GET", f.path, token);
    if (check) return;
    await githubApi("PUT", f.path, token, {
      message: `Add author page: ${author.name}`,
      content: toBase64(f.content),
    });
  }));

  const aboutPath = "website/_data/about.yml";
  const aboutFile = await githubApi("GET", aboutPath, token);
  if (!aboutFile) return;

  const aboutContent = Buffer.from(aboutFile.content, "base64").toString("utf-8");
  if (aboutContent.includes("id: " + authorSlug)) return;

  let entry = "\n  - id: " + authorSlug + "\n";
  entry += '    name: "' + author.name + '"\n';
  entry += "    affiliation:\n    cohort:\n    profile_label:\n    profile_url:\n";
  entry += "    contacts: []\n    photo:\n";
  entry += '    summary: "Contributor."\n';
  let updated = aboutContent.replace("contributors: []", "contributors:" + entry);
  if (updated === aboutContent) updated = aboutContent.trimEnd() + entry;
  await githubApi("PUT", aboutPath, token, {
    message: `Add contributor: ${author.name}`,
    content: toBase64(updated),
    sha: aboutFile.sha,
  });
}

async function publishToGitHub(token, d, markdown, filePath, primaryAuthor) {
  const authorSlug = primaryAuthor.author_id ||
    makeAuthorSlug(primaryAuthor.name) ||
    (primaryAuthor.uid ? primaryAuthor.uid.toLowerCase() : "") ||
    makeSlug(primaryAuthor.name);
  // Push guide file
  const existing = await githubApi("GET", filePath, token);
  const putBody = {
    message: `Add guide: ${d.title} by ${primaryAuthor.name}`,
    content: toBase64(markdown),
  };
  if (existing) {
    putBody.sha = existing.sha;
    putBody.message = `Update guide: ${d.title} by ${primaryAuthor.name}`;
  }
  await githubApi("PUT", filePath, token, putBody);

  await ensureAuthorPresenceOnGitHub(token, {
    ...primaryAuthor,
    author_id: authorSlug,
  });
}

async function ensureUniqueGuideSlug(baseSlug, excludeDocId) {
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const snap = await db.collection("submissions")
        .where("guide_id", "==", slug).get();
    const conflict = snap.docs.some((d) => d.id !== excludeDocId);
    if (!conflict) return slug;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }
}

async function ensureUniqueAuthorSlug(baseSlug) {
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const snap = await db.collection("users").where("author_id", "==", slug).get();
    if (snap.empty) return slug;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }
}

async function updateAuthorRecord(uid, authorSlug, slug, title, category) {
  if (!uid) return;
  // Only set author_id if user doesn't already have one — author_id is immutable
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists || !userDoc.data().author_id) {
    const baseSlug = authorSlug || uid.toLowerCase();
    const uniqueSlug = await ensureUniqueAuthorSlug(baseSlug);
    await db.collection("users").doc(uid).set(
      { author_id: uniqueSlug },
      { merge: true }
    );
  }
  await db.collection("users").doc(uid).update({
    publishedArticles: FieldValue.arrayUnion({
      guide_id: slug, title, category,
    }),
  }).catch(() => {});
}

// ══════════════════════════════════════
// 0. checkAdminStatus — returns whether the caller is an admin
// ══════════════════════════════════════

exports.checkAdminStatus = onCall(async (request) => {
  assertAuth(request.auth);
  const email = request.auth.token.email;
  const verified = request.auth.token.email_verified === true;
  const adminEmails = await getAdminEmails();
  return { isAdmin: verified && adminEmails.includes(email) };
});

// ══════════════════════════════════════
// 0. submitArticle — author creates a new submission
// ══════════════════════════════════════

exports.submitArticle = onCall(async (request) => {
  assertAuth(request.auth);
  const { title, category, language, description, content, authorName, coAuthors } = request.data;
  if (!title || !category || !language || !description || !content || !authorName) {
    throw new HttpsError("invalid-argument", "All content fields are required.");
  }

  const guideId = await ensureUniqueGuideSlug(makeSlug(title));
  const coAuthorList = Array.isArray(coAuthors) ? coAuthors : [];
  const uids = coAuthorList.map((c) => c.uid).filter(Boolean);

  const ref = await db.collection("submissions").add({
    uid: request.auth.uid,
    authorName,
    title,
    category,
    language,
    description,
    content,
    status: "pending",
    guide_id: guideId,
    createdAt: FieldValue.serverTimestamp(),
    coAuthors: coAuthorList,
    ...(uids.length > 0 ? { coauthorUids: uids } : {}),
  });

  await appendSubmissionAuditEvent(ref.id, "submitted", request.auth, {
    guideId,
  });

  return { success: true, docId: ref.id, guideId };
});

// ══════════════════════════════════════
// 1. resubmitArticle — author resubmits revised content
// ══════════════════════════════════════

exports.resubmitArticle = onCall(async (request) => {
  assertAuth(request.auth);
  const { docId, title, category, language, description, content, authorMessage } = request.data;
  if (!docId || !title || !category || !language || !description || !content) {
    throw new HttpsError("invalid-argument", "All content fields are required.");
  }

  const ref = db.collection("submissions").doc(docId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Submission not found.");
  const data = snap.data();

  const isOwner = data.uid === request.auth.uid;
  const isCoauthor = data.coauthorUids && data.coauthorUids.includes(request.auth.uid);
  if (!isOwner && !isCoauthor) {
    throw new HttpsError("permission-denied", "You can only resubmit your own articles.");
  }
  if (data.status !== "revise_resubmit") {
    throw new HttpsError("failed-precondition", "This submission is not awaiting revision.");
  }

  const history = sanitizeRevisionHistory(data.revisionHistory);
  if (history.length > 0 && !history[history.length - 1].resubmittedAt) {
    history[history.length - 1].authorMessage = authorMessage || null;
    history[history.length - 1].resubmittedAt = new Date().toISOString();
  }

  const update = withoutPublicActorFields({
    title, category, language, description, content,
    status: "pending",
    updatedAt: FieldValue.serverTimestamp(),
    revisionHistory: history,
    approveMessage: FieldValue.delete(),
    rejectionReason: FieldValue.delete(),
  });
  if (authorMessage) {
    update.authorMessage = authorMessage;
  } else {
    update.authorMessage = FieldValue.delete();
  }
  await ref.update(update);
  await appendSubmissionAuditEvent(docId, "resubmitted", request.auth, {
    authorMessage: authorMessage || null,
    round: history.length ? history[history.length - 1].round : null,
  });

  return { success: true };
});

// ══════════════════════════════════════
// Auto-translation helpers (Anthropic Claude)
// ══════════════════════════════════════

const TRANSLATE_MODEL = "claude-sonnet-4-6";
const TRANSLATE_MAX_TOKENS = 16000;
const TRANSLATE_SYSTEM_PROMPT =
  "You are the lead translation editor for the UWC Changshu China Survival Guide. " +
  "Produce publication-ready translations that preserve the original author's voice, " +
  "tone, pacing, and meaning. You MUST call the guide_translation tool with the " +
  "translated fields. Do not return plain text.";

const TRANSLATE_TOOL = {
  name: "guide_translation",
  description: "Return the translated guide fields.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      category: { type: "string" },
      description: { type: "string" },
      body: { type: "string" },
    },
    required: ["title", "category", "description", "body"],
    additionalProperties: false,
  },
};

const STYLE_NOTES = {
  "en": "Write natural, idiomatic English for internationally minded high school students " +
    "and recent graduates. Avoid calques from Chinese. The result should feel like a " +
    "thoughtful, candid alum speaking directly to younger students, not like generic " +
    "AI-polished prose.",
  "zh-CN": "Write fluent, contemporary Simplified Chinese that preserves the original voice, " +
    "including any intentional code-switching or informal spoken cadence.",
  "zh-TW": "Use Traditional Chinese characters and Taiwan-preferred wording when it improves " +
    "readability, but do not relocate the setting or alter mainland-specific facts, " +
    "institutions, apps, or cultural references.",
};

const PROMPT_NAMES = {
  "en": "English",
  "zh-CN": "Simplified Chinese written for readers in mainland China",
  "zh-TW": "Taiwan Traditional Chinese written for readers in Taiwan",
};

function buildTranslationPrompt(sourceLang, targetLang, payload) {
  return `You are translating one guide from the UWC Changshu China Survival Guide.

Translate the guide from ${PROMPT_NAMES[sourceLang]} into ${PROMPT_NAMES[targetLang]}.

Your priorities, in order:
1. Preserve meaning exactly.
2. Preserve the author's personality, rhythm, humor, hesitation, and emotional texture.
3. Write idiomatic, publication-ready ${PROMPT_NAMES[targetLang]}.
4. Preserve formatting and non-translatable syntax exactly.

Target-language note:
${STYLE_NOTES[targetLang]}

Rules:
- Translate reader-facing prose in \`title\`, \`category\`, \`description\`, and \`body\`.
- Keep intentional English acronyms and institution-specific terms when students naturally use them: UWC, FP, DP1, DP2, CAS, NSF, NIH, TTAP, IOI, UIUC, and similar terms.
- When translating between Simplified Chinese and Traditional Chinese, keep citations, source attributions, English titles of cited works, and any text intentionally already written in English in English. Only convert the surrounding Chinese text and script.
- If the source intentionally mixes languages, preserve that effect naturally instead of flattening everything into one register.
- Do not mirror Chinese sentence structure when translating into English. The English should feel fluent, candid, and native, while preserving the same amount of detail and the same level of intimacy.
- For Taiwan Traditional Chinese, use Traditional characters and Taiwan-preferred wording where it sounds natural, but do not change mainland-specific realities, apps, institutions, place names, or social context.
- Do not translate or alter Liquid tags, HTML tags, URLs, image paths, Markdown link destinations, inline code, fenced code blocks, or placeholder markers such as \`*\\[Placeholder\\]*\`.
- Preserve Markdown structure exactly: headings, emphasis, bullet markers, numbered lists, block quotes, blank lines, and horizontal rules.
- Do not add translator notes, summaries, explanations, extra examples, or clarifying context.
- Do not omit rhetorical questions, repetitions, side comments, or stylistic detours if they are part of the voice.
- Keep contributor lines, bylines, and named people faithful to the original.
- If a title or category is intentionally already in English or is a proper noun, keep it unchanged unless translating it is clearly more natural and still faithful.

Return only the schema-valid fields requested by the API.

Guide payload:
${JSON.stringify(payload, null, 2)}`;
}

async function getAnthropicKey() {
  const doc = await db.collection("config").doc("anthropic").get();
  return doc.exists && doc.data().apiKey ? doc.data().apiKey : null;
}

async function translateGuide(apiKey, sourceLang, targetLang, guideData) {
  const Anthropic = require("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });

  const payload = {
    guide_id: guideData.guide_id,
    author: guideData.author || "",
    source_language: PROMPT_NAMES[sourceLang],
    target_language: PROMPT_NAMES[targetLang],
    title: guideData.title || "",
    category: guideData.category || "",
    description: guideData.description || "",
    body: guideData.content || "",
  };

  const response = await client.messages.create({
    model: TRANSLATE_MODEL,
    max_tokens: TRANSLATE_MAX_TOKENS,
    system: TRANSLATE_SYSTEM_PROMPT,
    tools: [TRANSLATE_TOOL],
    tool_choice: { type: "tool", name: "guide_translation" },
    messages: [{ role: "user", content: buildTranslationPrompt(sourceLang, targetLang, payload) }],
  });

  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === "guide_translation") {
      return block.input;
    }
  }
  throw new Error("Anthropic response did not contain a guide_translation tool call.");
}

function buildTranslatedMarkdown(originalData, translation, targetLang, authors, editorName, slug) {
  const langInfo = LANG_MAP[targetLang];
  const today = new Date().toISOString().slice(0, 10);
  const submittedDate = originalData.createdAt
    ? originalData.createdAt.toDate().toISOString().slice(0, 10) : "";
  const primaryAuthor = authors[0];
  const coAuthors = authors.slice(1);

  let md = "---\n";
  md += `title: "${translation.title.replace(/"/g, '\\"')}"\n`;
  md += `category: "${translation.category.replace(/"/g, '\\"')}"\n`;
  md += `description: "${translation.description.replace(/"/g, '\\"')}"\n`;
  md += "order: 99\n";
  md += `author: "${primaryAuthor.name.replace(/"/g, '\\"')}"\n`;
  md += `author_id: "${primaryAuthor.author_id}"\n`;
  if (coAuthors.length > 0) {
    md += "coauthors:\n";
    coAuthors.forEach((ca) => {
      md += `  - name: "${ca.name.replace(/"/g, '\\"')}"\n`;
      if (ca.author_id) {
        md += `    author_id: "${ca.author_id}"\n`;
      }
    });
  }
  md += `guide_id: "${slug}"\n`;
  md += `language_code: "${targetLang}"\n`;
  md += `language_name: "${langInfo.name}"\n`;
  md += `language_folder: "${langInfo.folder}"\n`;
  md += `language_sort: ${langInfo.sort}\n`;
  if (submittedDate) md += `submitted: ${submittedDate}\n`;
  md += `published: ${today}\n`;
  md += `updated: ${today}\n`;
  if (editorName) {
    const editorSlug = makeAuthorSlug(editorName) || makeSlug(editorName);
    md += `editor: "${editorName.replace(/"/g, '\\"')}"\n`;
    if (editorSlug) md += `editor_id: "${editorSlug}"\n`;
  }
  md += "---\n\n";
  md += translation.body;

  return {
    markdown: md,
    fileName: slug + langInfo.suffix + ".md",
    folder: langInfo.folder,
    filePath: "website/_guides/" + langInfo.folder + "/" + slug + langInfo.suffix + ".md",
  };
}

async function translateAndPublishMissingVariants(token, apiKey, d, slug, authors, editorName) {
  const sourceLang = d.language || "en";
  const targetLangs = Object.keys(LANG_MAP).filter((lang) => lang !== sourceLang);
  const results = [];

  for (const targetLang of targetLangs) {
    try {
      const translation = await translateGuide(apiKey, sourceLang, targetLang, {
        guide_id: slug,
        author: authors[0].name,
        title: d.title,
        category: d.category,
        description: d.description,
        content: d.content,
      });

      const { markdown, filePath } = buildTranslatedMarkdown(
        d, translation, targetLang, authors, editorName, slug
      );

      const existing = await githubApi("GET", filePath, token);
      const putBody = {
        message: `Add translated guide (${targetLang}): ${d.title}`,
        content: toBase64(markdown),
      };
      if (existing) {
        putBody.sha = existing.sha;
        putBody.message = `Update translated guide (${targetLang}): ${d.title}`;
      }
      await githubApi("PUT", filePath, token, putBody);

      results.push({ lang: targetLang, filePath, success: true });
    } catch (err) {
      results.push({ lang: targetLang, error: err.message, success: false });
    }
  }

  return results;
}

// ══════════════════════════════════════
// 2. approveSubmission — admin approves and publishes
// ══════════════════════════════════════

exports.approveSubmission = onCall(async (request) => {
  await assertAdmin(request.auth);
  const { docId, approveMessage } = request.data;
  if (!docId) throw new HttpsError("invalid-argument", "docId is required.");

  const ref = db.collection("submissions").doc(docId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Submission not found.");
  const d = snap.data();

  if (d.status !== "pending" && d.status !== "revise_resubmit") {
    throw new HttpsError("failed-precondition", "Cannot approve in current state.");
  }

  const authors = await resolveSubmissionAuthors(d);
  const primaryAuthor = authors[0];
  const authorSlug = primaryAuthor.author_id;

  // Get editor name from the admin's own profile
  const adminDoc = await db.collection("users").doc(request.auth.uid).get();
  const editorName = adminDoc.exists ? adminDoc.data().displayName || "" : "";

  // Preserve existing guide_id if the submission was previously approved (e.g. reject → resubmit → re-approve)
  const uniqueSlug = d.guide_id || await ensureUniqueGuideSlug(makeSlug(d.title), docId);
  const { markdown, slug, fileName, folder, filePath } = generateMarkdown(d, authors, editorName, uniqueSlug);

  // Attempt GitHub publish first — only mark as approved if it succeeds
  let published = false;
  let githubError = null;
  const token = await getGitHubToken();
  if (token) {
    try {
      await publishToGitHub(token, d, markdown, filePath, primaryAuthor);
      published = true;
    } catch (err) {
      githubError = err.message;
    }
  }

  if (!published) {
    throw new HttpsError("internal",
      "Article could not be published to GitHub" + (githubError ? ": " + githubError : "") +
      ". Status unchanged.");
  }

  // Update Firestore status only after successful publish
  const updateData = withoutPublicActorFields({
    status: "approved",
    guide_id: slug,
    reviewedAt: FieldValue.serverTimestamp(),
    revisionHistory: sanitizeRevisionHistory(d.revisionHistory),
    rejectionReason: FieldValue.delete(),
  });
  if (approveMessage) updateData.approveMessage = approveMessage;
  await ref.update(updateData);
  await appendSubmissionAuditEvent(docId, "approved", request.auth, {
    approveMessage: approveMessage || null,
    guideId: slug,
  });

  await Promise.all(authors.map(async (author) => {
    if (!author.uid) return;
    await updateAuthorRecord(author.uid, author.author_id, slug, d.title, d.category);
  }));

  if (authors.length > 1) {
    await Promise.all(authors.slice(1).map((author) => ensureAuthorPresenceOnGitHub(token, author)));
  }

  // Auto-translate into missing language variants
  let translationResults = null;
  const anthropicKey = await getAnthropicKey();
  if (anthropicKey) {
    try {
      translationResults = await translateAndPublishMissingVariants(
        token, anthropicKey, d, slug, authors, editorName
      );
    } catch (err) {
      translationResults = [{ error: err.message, success: false }];
    }
  }

  if (translationResults && translationResults.length > 0) {
    await ref.update({ translationResults });
  }

  return {
    success: true,
    published,
    githubError,
    markdown,
    filePath,
    fileName,
    folder,
    authorSlug,
    authorName: primaryAuthor.name,
    authors,
    slug,
    translationResults,
  };
});

// ══════════════════════════════════════
// 3. rejectSubmission — admin rejects an article
// ══════════════════════════════════════

exports.rejectSubmission = onCall(async (request) => {
  await assertAdmin(request.auth);
  const { docId, reason } = request.data;
  if (!docId) throw new HttpsError("invalid-argument", "docId is required.");
  if (!reason) throw new HttpsError("invalid-argument", "Rejection reason is required.");

  const ref = db.collection("submissions").doc(docId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Submission not found.");
  const d = snap.data();

  await ref.update(withoutPublicActorFields({
    status: "rejected",
    rejectionReason: reason,
    reviewedAt: FieldValue.serverTimestamp(),
    revisionHistory: sanitizeRevisionHistory(d.revisionHistory),
    approveMessage: FieldValue.delete(),
  }));
  await appendSubmissionAuditEvent(docId, "rejected", request.auth, {
    rejectionReason: reason,
  });

  return { success: true };
});

// ══════════════════════════════════════
// 4. requestRevision — admin requests revise & resubmit
// ══════════════════════════════════════

exports.requestRevision = onCall(async (request) => {
  await assertAdmin(request.auth);
  const { docId, comments } = request.data;
  if (!docId) throw new HttpsError("invalid-argument", "docId is required.");
  if (!comments) throw new HttpsError("invalid-argument", "Reviewer comments are required.");

  const ref = db.collection("submissions").doc(docId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Submission not found.");
  const d = snap.data();

  const history = sanitizeRevisionHistory(d.revisionHistory);
  history.push({
    round: history.length + 1,
    reviewerComments: comments,
    reviewedAt: new Date().toISOString(),
    contentSnapshot: {
      title: d.title,
      category: d.category,
      language: d.language,
      description: d.description,
      content: d.content,
    },
  });

  await ref.update(withoutPublicActorFields({
    status: "revise_resubmit",
    reviewerComments: comments,
    reviewedAt: FieldValue.serverTimestamp(),
    revisionHistory: history,
    approveMessage: FieldValue.delete(),
    rejectionReason: FieldValue.delete(),
  }));
  await appendSubmissionAuditEvent(docId, "revision_requested", request.auth, {
    reviewerComments: comments,
    round: history[history.length - 1].round,
  });

  return { success: true, revisionHistory: history };
});

// ══════════════════════════════════════
// 5. deleteSubmission — admin deletes a submission
// ══════════════════════════════════════

exports.deleteSubmission = onCall(async (request) => {
  await assertAdmin(request.auth);
  const { docId } = request.data;
  if (!docId) throw new HttpsError("invalid-argument", "docId is required.");

  const ref = db.collection("submissions").doc(docId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Submission not found.");
  const d = snap.data();

  // If approved, clean up the author record and GitHub file
  if (d.status === "approved" && d.guide_id) {
    // Remove from author's publishedArticles (admin SDK bypasses rules)
    const seenUids = new Set();
    const uidsToClean = [];
    getOrderedSubmissionAuthors(d).forEach((author) => {
      if (!author.uid || seenUids.has(author.uid)) return;
      seenUids.add(author.uid);
      uidsToClean.push(author.uid);
    });
    if (d.uid && !seenUids.has(d.uid)) {
      uidsToClean.push(d.uid);
    }
    await Promise.all(uidsToClean.map(async (cleanUid) => {
      if (!cleanUid) return;
      const userDoc = await db.collection("users").doc(cleanUid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const updates = {};
        const articles = userData.publishedArticles || [];
        const filtered = articles.filter((a) => a.guide_id !== d.guide_id);
        if (filtered.length !== articles.length) {
          updates.publishedArticles = filtered;
        }
        const featured = userData.featuredGuideIds || [];
        const filteredFeatured = featured.filter((id) => id !== d.guide_id);
        if (filteredFeatured.length !== featured.length) {
          updates.featuredGuideIds = filteredFeatured;
        }
        if (Object.keys(updates).length > 0) {
          await db.collection("users").doc(cleanUid).update(updates);
        }
      }
    }));

    // Delete from GitHub
    const token = await getGitHubToken();
    if (token) {
      const lang = d.language || "en";
      const langInfo = LANG_MAP[lang] || LANG_MAP["en"];
      const fileName = d.guide_id + langInfo.suffix + ".md";
      const gPath = "website/_guides/" + langInfo.folder + "/" + fileName;
      try {
        const existing = await githubApi("GET", gPath, token);
        if (existing) {
          await githubApi("DELETE", gPath, token, {
            message: "Delete guide: " + d.title,
            sha: existing.sha,
          });
        }
      } catch (err) {
        // Log but don't block deletion
      }
    }
  }

  await appendSubmissionAuditEvent(docId, "deleted", request.auth, {
    status: d.status || null,
    guideId: d.guide_id || null,
    language: d.language || null,
    title: d.title || null,
  });
  await ref.delete();

  return {
    success: true,
    guideId: d.guide_id || null,
    language: d.language || null,
    wasApproved: d.status === "approved",
  };
});
