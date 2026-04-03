const { db, REPO, LANG_MAP } = require("./config");
const { toBase64, makeSlug, makeAuthorSlug } = require("./helpers");

async function getGitHubToken() {
  const doc = await db.collection("config").doc("github").get();
  return doc.exists && doc.data().token ? doc.data().token : null;
}

async function githubRest(method, endpoint, token, body) {
  const url = `https://api.github.com/repos/${REPO}/${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "uwc-survival-guide-functions",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (method === "GET" && res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub ${method} ${endpoint}: ${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function githubApi(method, path, token, body) {
  const endpoint = `contents/${path}`;
  const url = `https://api.github.com/repos/${REPO}/${endpoint}`;
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

/**
 * Commit multiple files to GitHub in a single commit using the Git Data API.
 * @param {string} token - GitHub token
 * @param {Array<{path: string, content: string}>} files - files to commit (content as UTF-8 string)
 * @param {string} message - commit message
 * @param {string} [branch="main"] - branch name
 */
async function batchCommitFiles(token, files, message, branch) {
  branch = branch || "main";

  // 1. Get the latest commit SHA on the branch
  const ref = await githubRest("GET", `git/ref/heads/${branch}`, token);
  const latestCommitSha = ref.object.sha;

  // 2. Get the tree SHA of that commit
  const latestCommit = await githubRest("GET", `git/commits/${latestCommitSha}`, token);
  const baseTreeSha = latestCommit.tree.sha;

  // 3. Create blobs for each file
  const treeItems = [];
  for (const file of files) {
    const blob = await githubRest("POST", "git/blobs", token, {
      content: file.content,
      encoding: "utf-8",
    });
    treeItems.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  // 4. Create a new tree
  const newTree = await githubRest("POST", "git/trees", token, {
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  // 5. Create a new commit
  const newCommit = await githubRest("POST", "git/commits", token, {
    message,
    tree: newTree.sha,
    parents: [latestCommitSha],
  });

  // 6. Update the branch reference
  await githubRest("PATCH", `git/refs/heads/${branch}`, token, {
    sha: newCommit.sha,
  });

  return newCommit;
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

  const filesToCommit = [];
  for (const f of authorFiles) {
    const check = await githubApi("GET", f.path, token);
    if (!check) filesToCommit.push(f);
  }

  if (filesToCommit.length > 0) {
    await batchCommitFiles(token, filesToCommit, `Add author page: ${author.name}`);
  }

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

module.exports = { getGitHubToken, githubApi, githubRest, batchCommitFiles, ensureAuthorPresenceOnGitHub };
