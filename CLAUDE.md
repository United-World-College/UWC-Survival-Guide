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