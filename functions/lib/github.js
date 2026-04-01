const { db, REPO, LANG_MAP } = require("./config");
const { toBase64, makeSlug, makeAuthorSlug } = require("./helpers");

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
      content: `---\ntitle: "${esc}"\nauthor_id: ${authorSlug}\npermalink: /zh-cn/authors/${authorSlug}/\ntranslation_key: ${tKey}\nlanguage_code: zh-CN\nlanguage_name: "简体中文"\nlanguage_sort: 2\n---\n`,
    },
    {
      path: `website/_authors/chinese/${authorSlug}-tw.md`,
      content: `---\ntitle: "${esc}"\nauthor_id: ${authorSlug}\npermalink: /zh-tw/authors/${authorSlug}/\ntranslation_key: ${tKey}\nlanguage_code: zh-TW\nlanguage_name: "繁體中文"\nlanguage_sort: 3\n---\n`,
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

module.exports = { getGitHubToken, githubApi, publishToGitHub, ensureAuthorPresenceOnGitHub };
