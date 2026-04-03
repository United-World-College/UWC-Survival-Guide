const { db, FieldValue, LANG_MAP } = require("./config");
const { makeSlug, makeAuthorSlug, toBase64 } = require("./helpers");
const { githubApi } = require("./github");

const TRANSLATE_MODEL = "gemini-2.5-flash";
const TRANSLATE_MAX_TOKENS = 16000;
const TRANSLATE_SYSTEM_PROMPT =
  "You are the lead translation editor for the UWC Changshu China Survival Guide. " +
  "Produce publication-ready translations that preserve the original author's voice, " +
  "tone, pacing, and meaning. Return the translated fields as JSON.";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    category: { type: "STRING" },
    description: { type: "STRING" },
    body: { type: "STRING" },
  },
  required: ["title", "category", "description", "body"],
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

async function getGeminiKey() {
  const doc = await db.collection("config").doc("gemini").get();
  return doc.exists && doc.data().apiKey ? doc.data().apiKey : null;
}

async function translateGuide(apiKey, sourceLang, targetLang, guideData) {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);

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

  const model = genAI.getGenerativeModel({
    model: TRANSLATE_MODEL,
    systemInstruction: TRANSLATE_SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: TRANSLATE_MAX_TOKENS,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const result = await model.generateContent(
    buildTranslationPrompt(sourceLang, targetLang, payload)
  );

  const text = result.response.text();
  const parsed = JSON.parse(text);

  for (const field of ["title", "category", "description", "body"]) {
    if (typeof parsed[field] !== "string") {
      throw new Error(`Gemini response missing required string field: ${field}`);
    }
  }

  // Track Gemini API usage
  const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const usageRef = db.collection("config").doc("usage");
  await usageRef.set(
    { gemini: { [month]: FieldValue.increment(1) } },
    { merge: true }
  );

  return parsed;
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
  md += `original_language: "${originalData.language || "en"}"\n`;
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

async function translateMissingVariants(apiKey, d, slug, authors, editorName) {
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

      results.push({
        lang: targetLang, filePath, markdown, success: true,
        title: translation.title,
        category: translation.category,
        description: translation.description,
      });
    } catch (err) {
      results.push({ lang: targetLang, error: err.message, success: false });
    }
  }

  return results;
}

module.exports = {
  TRANSLATE_MODEL,
  TRANSLATE_MAX_TOKENS,
  TRANSLATE_SYSTEM_PROMPT,
  RESPONSE_SCHEMA,
  STYLE_NOTES,
  PROMPT_NAMES,
  buildTranslationPrompt,
  getGeminiKey,
  translateGuide,
  buildTranslatedMarkdown,
  translateMissingVariants,
};
