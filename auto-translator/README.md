# Auto Translator

This CLI scans `website/_guides/default/` and `website/_guides/chinese/`, matches files by `guide_id`, and creates any missing language variants with the Google Gemini API.

## What It Preserves

- Front matter metadata (e.g. `author`, `guide_id`); `order` is replaced with `language_sort` for locale-aware ordering
- The author's tone, structure, and code-switching
- Markdown, HTML, Liquid tags, and image paths
- Internal guide links, rewritten into the target language path
- A stronger translation brief stored in `prompt_instructions.txt`

## Requirements

- Python ≥ 3.13
- `uv`
- `GEMINI_API_KEY` in the repository root `.env`
- Optional: `GEMINI_MODEL` if you do not want the default `gemini-2.5-flash`

## Usage

From the repository root:

```bash
./script/translate --dry-run
./script/translate
./script/translate --guide-id school-selection
./script/translate --target-language en
./script/translate --target-language zh-CN
./script/translate --target-language zh-TW
```

If you want to run it directly inside `auto-translator/`, use `uv run python main.py ...`.

When a Simplified Chinese source exists, the translator prefers that `zh-CN` guide as the source for generating English and `zh-TW`, so regenerated variants are based on the original Chinese draft rather than on a previous machine translation.

## Authoring New Guides

1. Add English source files to `website/_guides/default/<guide-id>.md`.
2. Add Chinese source files to `website/_guides/chinese/<guide-id>-CN.md` or `website/_guides/chinese/<guide-id>-TW.md`.
3. Include front matter. `guide_id` is recommended; if it is missing, the filename stem is normalized automatically.
4. Run `./script/translate` from the repository root, or `uv run python main.py` inside `auto-translator/`, to create the missing variants.
