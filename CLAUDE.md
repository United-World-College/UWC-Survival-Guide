# UWC Changshu Survival Guide — Project Rules

## Mandatory Workflow (sequential order for every task)

1. **Read first** — Read all relevant docs and code before making changes.
2. **Check existing code** — Review current implementation to avoid duplication or breaking conventions.
3. **Summarize before acting** — State understanding of the task before implementation.
4. **Ambiguous requirements** — List assumptions first, then implement the most conservative option.
5. **Minimal changes only** — Do the smallest necessary change. No unnecessary refactoring.
6. **No Firebase changes** — Do not modify Firebase rules, config, or deployment settings without asking first.
7. **Error handling** — Always handle errors; no silent failures. Clean up intermediate files/steps.
8. **Debug root cause** — When fixing bugs, locate the root cause; don't patch surface symptoms.
9. **Update tests** — Check and update tests for changed behavior; add tests for new behavior.
10. **Security check** — Review auth, permissions, input validation, secrets, data leakage, and injection risks before finishing.
11. **Conventional commits** — Use prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `style:`.
12. **No Claude in commits** — Don't add Co-Authored-By or any Claude attribution in commit messages.
13. **Never push without permission** — Always commit separately from pushing. Ask before pushing.

## Procedures

- Run `./script/test` before every commit (functions + site validation tests).
- If `tests/` fails with missing modules, run `npm install` in `tests/` first.
- After changing `functions/`, deploy with `firebase deploy --only functions` — CI only builds Jekyll.
- After changing `firebase/firestore.rules` or `firebase/storage.rules`, deploy with `firebase deploy --only firestore,storage`.
- Jekyll dev server uses Homebrew Ruby: `/opt/homebrew/opt/ruby/bin/bundle exec jekyll serve` from `website/`.
- **Dollar signs in guide markdown** — MathJax is enabled with `$...$` as inline math delimiters and `processEscapes: true` (see [website/_layouts/guide.html](website/_layouts/guide.html)). Kramdown strips a single backslash before `$`, so `\$` reaches the browser as `$` and any paired `$...$` (e.g. `$200-300k ... $400k`) gets rendered as italic math. To write a literal dollar sign, use `\\$` in markdown — kramdown outputs `\$`, and MathJax's `processEscapes` renders it as a plain `$`. Real math expressions (e.g. `$\Omega(n \log n)$`, `$f(x) = x^2$`) survive kramdown unchanged and should stay as `$...$`.
- **Guide `order` frontmatter is global, not per-category** — The `order` field in `_guides/*/` frontmatter is a single global sequence across all articles (terminology=0, school-selection=1, computer-science=2, victims-of-the-system=3, ...), even though [section.html](website/_layouts/section.html) sorts each category independently. When adding a new article, pick the next unused global integer, matched across the EN/CN/TW variants of that guide.
- **Quote marks in guide prose** — In CN and TW guides, use straight ASCII double quotes `"..."` with a space before the opening `"` and a space after the closing `"` (English-style spacing in mixed CJK/English text). Never put terminal punctuation (`。`, `？`, `！`) immediately inside the closing quote — keep the quoted content clean and let the outer sentence's punctuation sit outside. Reference format (from [victims-of-the-system-CN.md](website/_guides/chinese/victims-of-the-system-CN.md)): `那句 "如果一个人..." 不仅触动了...`. Exception: when the closing `"` is directly followed by Chinese full-width punctuation (`；`, `，`, `：`), no space is inserted between them. In EN guides, follow the same no-internal-terminal-punctuation rule and standard English spacing.
- **Title marks across languages** — CN files use `《》` for all titled works (books, manuals, articles, guides). TW files strictly distinguish: `〈〉` for articles/essays/individual pieces, `《》` only for books and book-length works. EN files use markdown italics `*Title*` for any book / manual / guide title (the EN equivalent of CN `《》` and TW `〈〉`/`《》`). Apply consistently across all three language variants when syncing content.