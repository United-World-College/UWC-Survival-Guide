const { LANG_MAP } = require("./config");

function toBase64(str) {
  return Buffer.from(str, "utf-8").toString("base64");
}

function makeSlug(text) {
  const slug = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "untitled";
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
  const { FieldValue } = require("./config");
  return {
    ...updateData,
    reviewerUid: FieldValue.delete(),
    reviewerEmail: FieldValue.delete(),
  };
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
  // order: -1 is a placeholder — a globally-unique order is assigned
  // editorially after publish. See CODEBASE_README.md for conventions.
  md += "order: -1\n";
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
  md += `original_language: "${lang}"\n`;
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

module.exports = {
  toBase64,
  makeSlug,
  makeAuthorSlug,
  getAuthorKey,
  getOrderedSubmissionAuthors,
  sanitizeRevisionHistory,
  withoutPublicActorFields,
  generateMarkdown,
};
