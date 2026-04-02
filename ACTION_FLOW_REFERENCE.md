# Action Flow Reference

Complete reference of every action in the UWC Survival Guide project, documenting triggers, inputs, outputs, and side effects.

---

## Table of Contents

- [Cloud Functions (Callable)](#cloud-functions-callable)
  - [checkAdminStatus](#checkadminstatus)
  - [submitArticle](#submitarticle)
  - [resubmitArticle](#resubmitarticle)
  - [approveSubmission](#approvesubmission)
  - [rejectSubmission](#rejectsubmission)
  - [requestRevision](#requestrevision)
  - [deleteSubmission](#deletesubmission)
- [Internal Library Functions](#internal-library-functions)
  - [Auth](#auth)
  - [GitHub](#github)
  - [Translation](#translation)
  - [Firestore Helpers](#firestore-helpers)
  - [Utility Helpers](#utility-helpers)
- [GitHub Actions Workflows](#github-actions-workflows)
  - [deploy.yml](#deployyml)
- [CLI Scripts](#cli-scripts)
  - [script/translate](#scripttranslate)
  - [script/serve](#scriptserve)
  - [script/bootstrap](#scriptbootstrap)
  - [script/firebase](#scriptfirebase)
  - [script/test](#scripttest)
- [Migration & Backfill Scripts](#migration--backfill-scripts)
  - [backfill-submissions.js](#backfill-submissionsjs)
  - [migrate-submission-actor-audit.js](#migrate-submission-actor-auditjs)
  - [migrate-submission-authors.js](#migrate-submission-authorsjs)
  - [migrate-author-id.js](#migrate-author-idjs)
- [Data Flow Diagrams](#data-flow-diagrams)
  - [Submission → Publication](#submission--publication-flow)
  - [Revision Workflow](#revision-workflow)
  - [Auto-Translation](#auto-translation-workflow)
- [Firestore Data Structures](#firestore-data-structures)
- [Summary Table](#summary-table)

---

## Cloud Functions (Callable)

All callable functions are defined in `functions/index.js` and invoked via Firebase `onCall`.

---

### checkAdminStatus

**Location:** `functions/index.js`

**Trigger:** Client calls via Firebase SDK

**Auth:** Any authenticated user

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | *(none)* | — | Uses `request.auth` context only |
| **Output** | `isAdmin` | `boolean` | Whether the caller's email is in the admin list |

**Logic:**
1. Verifies caller has a verified email
2. Fetches admin email list from `config/admins` Firestore doc
3. Returns `true` if email is in the list

**Side Effects:** None

---

### submitArticle

**Location:** `functions/index.js`

**Trigger:** Client calls via Firebase SDK

**Auth:** Any authenticated user

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `title` | `string` | Guide title |
| **Input** | `category` | `string` | Guide category |
| **Input** | `language` | `string` | One of `en`, `zh-CN`, `zh-TW` |
| **Input** | `description` | `string` | Short description |
| **Input** | `content` | `string` | Markdown body |
| **Input** | `authorName` | `string` | Display name of submitter |
| **Input** | `coAuthors` | `array` | `[{ uid?, author_id?, name, order? }]` |
| **Output** | `success` | `boolean` | Always `true` on success |
| **Output** | `docId` | `string` | Firestore document ID |
| **Output** | `guideId` | `string` | Generated unique slug (e.g. `college-application`) |

**Logic:**
1. Validates all required fields are present and non-empty
2. Generates `guide_id` slug from title via `makeSlug()`
3. Ensures slug uniqueness via `ensureUniqueGuideSlug()`
4. Resolves author slug via `resolveAuthorSlug()`
5. Creates `submissions/{docId}` document with status `"pending"`

**Side Effects:**
- Creates Firestore document in `submissions` collection
- May set `author_id` on `users/{uid}` if first submission
- Appends audit event (`type: "submitted"`) to `submissionAudit/{docId}`

---

### resubmitArticle

**Location:** `functions/index.js`

**Trigger:** Client calls via Firebase SDK

**Auth:** Submission owner or listed co-author

**Precondition:** Submission status must be `"revise_resubmit"`

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `docId` | `string` | Submission document ID |
| **Input** | `title` | `string` | Updated title |
| **Input** | `category` | `string` | Updated category |
| **Input** | `language` | `string` | Updated language code |
| **Input** | `description` | `string` | Updated description |
| **Input** | `content` | `string` | Updated markdown body |
| **Input** | `authorMessage` | `string?` | Optional message to reviewer |
| **Output** | `success` | `boolean` | Always `true` on success |

**Logic:**
1. Validates ownership (caller is `uid` owner or in `coauthorUids`)
2. Validates status is `"revise_resubmit"`
3. Updates content fields on submission document
4. Marks latest revision round with `resubmittedAt` timestamp and `authorMessage`
5. Sets status back to `"pending"`

**Side Effects:**
- Updates `submissions/{docId}` document
- Appends audit event (`type: "resubmitted"`) to `submissionAudit/{docId}`

---

### approveSubmission

**Location:** `functions/index.js`

**Trigger:** Admin calls via Firebase SDK

**Auth:** Admin only (verified email in admin list)

**Precondition:** Submission status is `"pending"` or `"revise_resubmit"`

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `docId` | `string` | Submission document ID |
| **Input** | `approveMessage` | `string?` | Optional approval message |
| **Output** | `success` | `boolean` | Overall success |
| **Output** | `published` | `boolean` | Whether GitHub publish succeeded |
| **Output** | `githubError` | `string?` | Error message if publish failed |
| **Output** | `markdown` | `string` | Generated markdown content |
| **Output** | `filePath` | `string` | Path within repo (e.g. `website/_guides/default/college-application.md`) |
| **Output** | `fileName` | `string` | File name only |
| **Output** | `folder` | `string` | Target folder (e.g. `website/_guides/default`) |
| **Output** | `authorSlug` | `string` | Primary author's slug |
| **Output** | `authorName` | `string` | Primary author's display name |
| **Output** | `authors` | `array` | Ordered list of `{ author_id, name }` |
| **Output** | `slug` | `string` | Guide slug |
| **Output** | `translationResults` | `array?` | `[{ lang, filePath, success, title, category, description, error? }]` |

**Logic:**
1. Asserts admin auth
2. Fetches and validates submission document
3. Resolves all submission authors via `resolveSubmissionAuthors()`
4. Determines target folder from `LANG_MAP[language]`
5. Generates markdown with frontmatter via `generateMarkdown()`
6. Publishes to GitHub via `publishToGitHub()`
   - Creates/updates guide file
   - Ensures author presence (author pages + about.yml entry)
7. If GitHub publish succeeds:
   - Sets status to `"approved"`
   - Records `reviewedAt`, `approveMessage`
   - Adds `guide_id` to each author's `featuredGuideIds`
   - Auto-translates missing language variants via `translateAndPublishMissingVariants()`
   - Stores `translationResults` and `translations` metadata on submission
8. If GitHub publish fails: returns success but with `published: false` and error

**Side Effects:**
- Creates/updates file on GitHub repository
- Creates author markdown files on GitHub (if new author)
- Updates `website/_data/about.yml` on GitHub
- Calls Anthropic Claude API for translation (up to 2 calls)
- Creates translated guide files on GitHub
- Updates `submissions/{docId}` with status, translation results, metadata
- Updates `users/{uid}` `featuredGuideIds` for each author
- Appends audit event (`type: "approved"`) to `submissionAudit/{docId}`

---

### rejectSubmission

**Location:** `functions/index.js`

**Trigger:** Admin calls via Firebase SDK

**Auth:** Admin only

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `docId` | `string` | Submission document ID |
| **Input** | `reason` | `string` | Rejection reason |
| **Output** | `success` | `boolean` | Always `true` on success |

**Logic:**
1. Asserts admin auth
2. Fetches submission, verifies it exists
3. Sets status to `"rejected"`, stores `rejectionReason`

**Side Effects:**
- Updates `submissions/{docId}` document
- Appends audit event (`type: "rejected"`) to `submissionAudit/{docId}`

---

### requestRevision

**Location:** `functions/index.js`

**Trigger:** Admin calls via Firebase SDK

**Auth:** Admin only

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `docId` | `string` | Submission document ID |
| **Input** | `comments` | `string` | Reviewer comments for the author |
| **Output** | `success` | `boolean` | Always `true` on success |
| **Output** | `revisionHistory` | `array` | Sanitized revision history (PII removed) |

**Logic:**
1. Asserts admin auth
2. Fetches submission, verifies it exists
3. Calculates next revision round number
4. Creates revision history entry with:
   - `round` number
   - `reviewerComments`
   - Content snapshot (`title`, `category`, `language`, `description`, `content`)
   - `reviewedAt` timestamp
5. Sets status to `"revise_resubmit"`
6. Returns sanitized revision history (UIDs/emails stripped)

**Side Effects:**
- Updates `submissions/{docId}` with new revision round and status
- Appends audit event (`type: "revision_requested"`) to `submissionAudit/{docId}`

---

### deleteSubmission

**Location:** `functions/index.js`

**Trigger:** Admin calls via Firebase SDK

**Auth:** Admin only

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `docId` | `string` | Submission document ID |
| **Output** | `success` | `boolean` | Always `true` on success |
| **Output** | `guideId` | `string?` | Guide slug (if was approved) |
| **Output** | `language` | `string?` | Language code (if was approved) |
| **Output** | `wasApproved` | `boolean` | Whether submission was previously approved |

**Logic:**
1. Asserts admin auth
2. Fetches submission, verifies it exists
3. If previously approved:
   - Removes `guide_id` from all authors' `featuredGuideIds` arrays
   - Determines file path from `LANG_MAP`
   - Deletes file from GitHub via API
4. Deletes `submissions/{docId}` from Firestore

**Side Effects:**
- Deletes file from GitHub repository (if was approved)
- Updates `users/{uid}` `featuredGuideIds` for each author (if was approved)
- Deletes Firestore document
- Appends audit event (`type: "deleted"`) with full original data to `submissionAudit/{docId}`

---

## Internal Library Functions

### Auth

**Location:** `functions/lib/auth.js`

#### getAdminEmails()

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | *(none)* | — | — |
| **Output** | `emails` | `string[]` | Cached admin email list (5 min TTL) |

**Source:** Reads `config/admins` Firestore document.

#### assertAuth(auth)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `auth` | `object` | Firebase auth context from request |
| **Output** | *(none)* | — | Throws `unauthenticated` if no auth |

#### assertAdmin(auth)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `auth` | `object` | Firebase auth context from request |
| **Output** | *(none)* | — | Throws if not admin or email not verified |

---

### GitHub

**Location:** `functions/lib/github.js`

#### getGitHubToken()

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | *(none)* | — | — |
| **Output** | `token` | `string` | GitHub API token from `config/github` doc |

#### githubApi(method, path, token, body)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `method` | `string` | HTTP method (`GET`, `PUT`, `DELETE`) |
| **Input** | `path` | `string` | Path relative to repo contents URL |
| **Input** | `token` | `string` | GitHub API token |
| **Input** | `body` | `object?` | Request body |
| **Output** | `response` | `object\|null` | Parsed JSON response; `null` on 404 for GET |

**Base URL:** `https://api.github.com/repos/United-World-College/UWC-Survival-Guide/contents/`

#### publishToGitHub(token, d, markdown, filePath, primaryAuthor)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `token` | `string` | GitHub API token |
| **Input** | `d` | `object` | Submission data |
| **Input** | `markdown` | `string` | Generated markdown content |
| **Input** | `filePath` | `string` | Target file path in repo |
| **Input** | `primaryAuthor` | `object` | `{ author_id, name }` |
| **Output** | *(none)* | — | Throws on failure |

**Side Effects:**
- Creates or updates guide file on GitHub
- Calls `ensureAuthorPresenceOnGitHub()` for primary author

#### ensureAuthorPresenceOnGitHub(token, author)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `token` | `string` | GitHub API token |
| **Input** | `author` | `object` | `{ author_id, name }` |
| **Output** | *(none)* | — | — |

**Side Effects (if author files don't exist):**
- Creates `website/_authors/default/{slug}.md`
- Creates `website/_authors/chinese/{slug}-cn.md`
- Creates `website/_authors/chinese/{slug}-tw.md`
- Appends contributor entry to `website/_data/about.yml`

---

### Translation

**Location:** `functions/lib/translation.js`

**Constants:**
- `TRANSLATE_MODEL`: `"claude-sonnet-4-6"`
- `TRANSLATE_MAX_TOKENS`: `16000`

#### getAnthropicKey()

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | *(none)* | — | — |
| **Output** | `apiKey` | `string\|null` | API key from `config/gemini` doc |

#### buildTranslationPrompt(sourceLang, targetLang, payload)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `sourceLang` | `string` | Source language code |
| **Input** | `targetLang` | `string` | Target language code |
| **Input** | `payload` | `object` | `{ title, category, description, body }` |
| **Output** | `messages` | `array` | Claude API message array |

#### translateGuide(apiKey, sourceLang, targetLang, guideData)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `apiKey` | `string` | Anthropic API key |
| **Input** | `sourceLang` | `string` | Source language code |
| **Input** | `targetLang` | `string` | Target language code |
| **Input** | `guideData` | `object` | `{ title, category, description, content }` |
| **Output** | `translation` | `object` | `{ title, category, description, body }` |

**Side Effects:** Calls Anthropic Claude API (Claude Sonnet with tool use)

#### buildTranslatedMarkdown(originalData, translation, targetLang, authors, editorName, slug)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `originalData` | `object` | Original submission data |
| **Input** | `translation` | `object` | `{ title, category, description, body }` |
| **Input** | `targetLang` | `string` | Target language code |
| **Input** | `authors` | `array` | `[{ author_id, name }]` |
| **Input** | `editorName` | `string` | Reviewer/editor name |
| **Input** | `slug` | `string` | Guide slug |
| **Output** | `markdown` | `string` | Complete markdown with frontmatter |

#### translateAndPublishMissingVariants(token, apiKey, d, slug, authors, editorName)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `token` | `string` | GitHub API token |
| **Input** | `apiKey` | `string` | Anthropic API key |
| **Input** | `d` | `object` | Submission data |
| **Input** | `slug` | `string` | Guide slug |
| **Input** | `authors` | `array` | Author list |
| **Input** | `editorName` | `string` | Reviewer name |
| **Output** | `results` | `array` | `[{ lang, filePath, success, title, category, description, error? }]` |

**Side Effects:**
- Calls Claude API for each missing language (up to 2 calls)
- Creates translated guide files on GitHub

---

### Firestore Helpers

**Location:** `functions/lib/firestore.js`

#### appendSubmissionAuditEvent(docId, type, auth, details)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `docId` | `string` | Submission document ID |
| **Input** | `type` | `string` | Event type (`submitted`, `approved`, etc.) |
| **Input** | `auth` | `object` | Caller auth context |
| **Input** | `details` | `object` | Additional event-specific fields |
| **Output** | *(none)* | — | — |

**Side Effects:** Creates or updates `submissionAudit/{docId}` with new event appended

#### resolveAuthorSlug(uid, authorName)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `uid` | `string` | Firebase user UID |
| **Input** | `authorName` | `string` | Fallback display name |
| **Output** | `authorSlug` | `string` | Resolved `author_id` |

**Side Effects:** May set `author_id` on `users/{uid}` via `ensureAuthorId()`

#### resolveSubmissionAuthors(d)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `d` | `object` | Submission data (needs `uid`, `authorName`, `coAuthors`) |
| **Output** | `authors` | `array` | `[{ author_id, name }]` ordered and deduplicated |

#### ensureUniqueGuideSlug(baseSlug, excludeDocId)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `baseSlug` | `string` | Base slug from title |
| **Input** | `excludeDocId` | `string?` | Doc ID to exclude from uniqueness check |
| **Output** | `slug` | `string` | Unique slug (appends `-2`, `-3`, etc. if needed) |

#### ensureUniqueAuthorSlug(baseSlug)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `baseSlug` | `string` | Base slug from author name |
| **Output** | `slug` | `string` | Unique author slug |

#### ensureAuthorId(uid, authorSlug)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `uid` | `string` | Firebase user UID |
| **Input** | `authorSlug` | `string` | Author slug to set |
| **Output** | *(none)* | — | — |

**Side Effects:** Sets immutable `author_id` on `users/{uid}` if not already set

---

### Utility Helpers

**Location:** `functions/lib/helpers.js`

#### toBase64(str)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `str` | `string` | Plain text |
| **Output** | `encoded` | `string` | Base64-encoded string |

#### makeSlug(text)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `text` | `string` | Title or text |
| **Output** | `slug` | `string` | Kebab-case slug (handles Chinese via pinyin-style) |

#### makeAuthorSlug(text)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `text` | `string` | Author name |
| **Output** | `slug` | `string` | Normalized author slug (handles accents, special chars) |

#### getOrderedSubmissionAuthors(d)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `d` | `object` | Submission data with `authorName`, `author_id`, `coAuthors` |
| **Output** | `authors` | `array` | Deduplicated, ordered `[{ author_id, name }]` |

#### sanitizeRevisionHistory(history)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `history` | `array` | Revision history entries |
| **Output** | `sanitized` | `array` | Same entries with `uid` and `email` fields removed |

#### generateMarkdown(d, authors, editorName, overrideSlug)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `d` | `object` | Submission data |
| **Input** | `authors` | `array` | `[{ author_id, name }]` |
| **Input** | `editorName` | `string` | Reviewer/editor display name |
| **Input** | `overrideSlug` | `string?` | Optional slug override |
| **Output** | `markdown` | `string` | Complete markdown with YAML frontmatter and body |

**Frontmatter fields generated:** `title`, `category`, `description`, `order`, `author` (first author name), `author_id`, `co_authors` (if multiple), `guide_id`, `language_code`, `language_name`, `language_folder`, `language_sort`, `published_date`, `editor`

---

## GitHub Actions Workflows

### deploy.yml

**Location:** `.github/workflows/deploy.yml`

**Triggers:**
- Push to `main` branch
- Manual `workflow_dispatch`

| Phase | Step | Input | Output |
|-------|------|-------|--------|
| **Test** | Setup Node.js 22 | — | Node environment |
| **Test** | Install function deps | `functions/package.json` | `functions/node_modules/` |
| **Test** | Install test deps | `tests/package.json` | `tests/node_modules/` |
| **Test** | Run function tests | `functions/__tests__/*.test.js` | Pass/fail (blocks build) |
| **Test** | Run site tests | `tests/*.test.js` | Pass/fail (blocks build) |
| **Build** | Setup Ruby 3.3 | `website/Gemfile` | Ruby + Bundler |
| **Build** | Jekyll build | `website/` (all source) | `website/_site/` (static HTML) |
| **Deploy** | Deploy to Pages | `website/_site/` artifact | Live site at GitHub Pages URL |

**Environment variables:**
- `JEKYLL_ENV=production` during build

**Side Effects:**
- Deploys static site to GitHub Pages
- Tests must pass before build proceeds
- Build must succeed before deploy proceeds

---

## CLI Scripts

### script/translate

**Location:** `script/translate` → `auto-translator/main.py`

**Trigger:** Manual: `./script/translate [options]`

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `--dry-run` | flag | Show what would be translated (default behavior) |
| **Input** | `--guide-id <id>` | `string` | Translate a specific guide only |
| **Input** | `--target-language <code>` | `string` | Translate into a specific language only |
| **Output** | New `.md` files | files | Written to `website/_guides/` |

**Logic:**
1. Scans `website/_guides/default/` and `website/_guides/chinese/`
2. Groups files by `guide_id` (from frontmatter or filename)
3. Identifies missing language variants for each guide
4. Selects preferred source language (prefers `zh-CN` when available)
5. Calls Claude Sonnet with language-specific style notes
6. Rewrites internal Liquid links to target language folder
7. Writes translated markdown files

**Source preference rules:**
- Translating to English → prefer `zh-CN` source
- Translating to `zh-TW` → prefer `zh-CN` source
- Translating to `zh-CN` → prefer English source

**Environment:**
- `GEMINI_API_KEY` (required)
- `GEMINI_MODEL` (optional, default: `gemini-2.5-flash`)

---

### script/serve

**Location:** `script/serve`

**Trigger:** Manual: `./script/serve [args]`

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | CLI args | passthrough | Forwarded to Jekyll (e.g. `--port 8000`) |
| **Output** | Local server | HTTP | Jekyll dev server on auto-detected port (starting from 4000) |

**Environment:** `JEKYLL_ENV` (default: `development`)

---

### script/bootstrap

**Location:** `script/bootstrap`

**Trigger:** Manual: `./script/bootstrap`

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `website/Gemfile` | file | Ruby dependency list |
| **Output** | Installed gems | directory | `website/vendor/bundle/` |

---

### script/firebase

**Location:** `script/firebase`

**Trigger:** Manual: `./script/firebase [--import] [--export]`

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `--import` | flag | Restore from `.firebase-data/` |
| **Input** | `--export` | flag | Save to `.firebase-data/` on exit |
| **Output** | Emulator suite | services | Auth (9099), Firestore (8080), Storage (9199), UI (4010) |

---

### script/test

**Location:** `script/test`

**Trigger:** Manual: `./script/test`

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | Test files | `*.test.js` | `functions/__tests__/` and `tests/` |
| **Output** | Test results | stdout | Jest verbose output |

---

## Migration & Backfill Scripts

### backfill-submissions.js

**Location:** `functions/backfill-submissions.js`

**Trigger:** Manual: `node backfill-submissions.js [--dry-run]`

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `--dry-run` | flag | Preview without writing |
| **Input** | Hardcoded guide paths | constants | `college-application.md`, `school-selection.md`, `terminology.md` |
| **Output** | Firestore documents | `submissions/` | Backfilled submission records with status `"approved"` |

**Logic:** Parses guide frontmatter, looks up user by `author_id`, creates submission docs.

---

### migrate-submission-actor-audit.js

**Location:** `scripts/migrate-submission-actor-audit.js`

**Trigger:** Manual: `node scripts/migrate-submission-actor-audit.js [--write]`

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `--write` | flag | Actually persist changes (default: dry-run) |
| **Output** | Migrated submissions | Firestore | PII removed from `revisionHistory`, moved to `submissionAudit` |

---

### migrate-submission-authors.js

**Location:** `scripts/migrate-submission-authors.js`

**Purpose:** Normalize `coAuthors` format in existing submissions.

---

### migrate-author-id.js

**Location:** `scripts/migrate-author-id.js`

**Purpose:** Migrate author identifier fields.

---

## Data Flow Diagrams

### Submission → Publication Flow

```
User fills form in admin UI
         │
         ▼
  submitArticle()
    ├─ Validate fields
    ├─ Generate guide_id slug
    ├─ Create submissions/{docId}  ──►  Firestore
    ├─ Status: "pending"
    └─ Audit event: "submitted"    ──►  submissionAudit/{docId}
         │
         ▼
  [Admin reviews in dashboard]
         │
         ▼
  approveSubmission()
    ├─ Resolve all authors
    ├─ Generate markdown + frontmatter
    ├─ publishToGitHub()
    │   ├─ PUT guide file             ──►  GitHub repo
    │   └─ ensureAuthorPresence()
    │       ├─ PUT author .md files   ──►  GitHub repo
    │       └─ Update about.yml       ──►  GitHub repo
    ├─ Status: "approved"             ──►  Firestore
    ├─ Update featuredGuideIds        ──►  users/{uid}
    ├─ translateAndPublishMissing()
    │   ├─ Call Claude API            ──►  Anthropic
    │   └─ PUT translated files       ──►  GitHub repo
    └─ Audit event: "approved"        ──►  submissionAudit/{docId}
         │
         ▼
  Push to main triggers deploy.yml
    ├─ Run tests (Jest)
    ├─ Build Jekyll site
    │   ├─ Read _guides/**/*.md
    │   ├─ Read _data/**/*.yml
    │   ├─ Apply _layouts/
    │   └─ Output _site/
    └─ Deploy to GitHub Pages         ──►  Live website
```

### Revision Workflow

```
  requestRevision()
    ├─ Record revisionHistory round
    │   ├─ reviewerComments
    │   ├─ Content snapshot
    │   └─ reviewedAt timestamp
    ├─ Status: "revise_resubmit"      ──►  Firestore
    └─ Audit: "revision_requested"    ──►  submissionAudit/{docId}
         │
         ▼
  [Author edits and resubmits]
         │
         ▼
  resubmitArticle()
    ├─ Validate ownership
    ├─ Update content fields
    ├─ Mark round resubmittedAt
    ├─ Status: "pending"              ──►  Firestore
    └─ Audit: "resubmitted"          ──►  submissionAudit/{docId}
         │
         ▼
  [Returns to admin review]
```

### Auto-Translation Workflow

```
  ./script/translate
         │
         ▼
  Scan _guides/default/ and _guides/chinese/
    ├─ Parse frontmatter from all guide files
    └─ Group by guide_id
         │
         ▼
  For each guide, identify missing language variants
    ├─ Has en but not zh-CN?  → translate
    ├─ Has en but not zh-TW?  → translate
    ├─ Has zh-CN but not en?  → translate
    └─ (etc. for all 3 languages)
         │
         ▼
  Select best source language
    ├─ Target en  → prefer zh-CN source
    ├─ Target zh-TW → prefer zh-CN source
    └─ Target zh-CN → prefer en source
         │
         ▼
  Call Claude Sonnet (tool use)
    ├─ System: "You are a translation editor"
    ├─ User: source content + style notes
    └─ Tool: guide_translation
         │       ├─ title
         │       ├─ category
         │       ├─ description
         │       └─ body
         ▼
  Post-process
    ├─ Rewrite Liquid links to target folder
    └─ Normalize frontmatter field order
         │
         ▼
  Write .md file to _guides/
```

---

## Firestore Data Structures

### submissions/{docId}

```javascript
{
  // Identity
  uid: string,                    // Creator's Firebase UID
  authorName: string,             // Creator's display name
  guide_id: string,               // Unique slug

  // Content
  title: string,
  category: string,
  language: "en" | "zh-CN" | "zh-TW",
  description: string,
  content: string,                // Markdown body

  // Status
  status: "pending" | "revise_resubmit" | "approved" | "rejected",
  createdAt: Timestamp,           // Set once on submitArticle
  updatedAt?: Timestamp,          // Set on resubmitArticle only (not on initial creation)
  reviewedAt?: Timestamp,         // Set on approve, reject, or requestRevision

  // Co-authorship
  coAuthors: [{ uid?, author_id?, name, order? }],
  coauthorUids?: [string],        // Only present when coAuthors have UIDs; used for array-contains queries

  // Revision history
  revisionHistory?: [{
    round: number,
    reviewerComments: string,     // Set by requestRevision
    reviewedAt: string,           // ISO timestamp, set by requestRevision
    contentSnapshot: {            // Snapshot of content at time of review
      title, category, language, description, content
    },
    authorMessage?: string,       // Set by resubmitArticle
    resubmittedAt?: string        // ISO timestamp, set by resubmitArticle
  }],

  // Review messages (transient — deleted on state transitions)
  approveMessage?: string,        // Set on approve; deleted on resubmit/reject/requestRevision
  reviewerComments?: string,      // Set on requestRevision; deleted on approve/reject
  rejectionReason?: string,       // Set on reject; deleted on resubmit/requestRevision
  authorMessage?: string,         // Set on resubmit; deleted on approve/reject/requestRevision

  // Translation (post-approval)
  translationResults?: [{         // Results of each auto-translation attempt
    lang: string,
    filePath: string,
    success: boolean,
    title: string,
    category: string,
    description: string,
    error?: string
  }],
  translations?: {                // Aggregated metadata for multi-language display
    en?: { title, category, description },
    "zh-CN"?: { title, category, description },
    "zh-TW"?: { title, category, description }
  }
}
```

### submissionAudit/{docId}

```javascript
{
  updatedAt: Timestamp,
  submissionId?: string,          // Set by migration script; may not exist on organic records
  events: [{
    type: "submitted" | "resubmitted" | "approved" | "rejected"
         | "revision_requested" | "deleted",
    actorUid: string,
    actorAuthorId?: string,       // Resolved from users/{uid}.author_id if available
    actedAt: string,              // ISO timestamp
    // Event-specific fields:
    guideId?: string,             // On submitted, approved, deleted
    authorMessage?: string,       // On resubmitted
    reviewerComments?: string,    // On revision_requested
    approveMessage?: string,      // On approved
    rejectionReason?: string,     // On rejected
    round?: number,               // On revision_requested
    status?: string,              // On deleted (original status)
    language?: string,            // On deleted (original language)
    title?: string                // On deleted (original title)
  }]
}
```

### users/{uid}

```javascript
{
  // Set on registration, updated via profile edit
  displayName: string,
  email: string,
  photoURL: string,               // Avatar download URL (from Firebase Storage), or ""
  author_id: string,              // Immutable after first set, format: /^[a-z0-9]+(-[a-z0-9]+)*$/
  affiliation: string,            // School or organization
  cohort: string,                 // Graduating year/class
  summary: string,                // Short bio (max 120 chars in UI)
  profileLinks: [{                // Up to 3 custom links
    label: string,
    url: string
  }],
  showEmail: boolean,             // Whether to display email publicly
  createdAt: Timestamp,           // Set once on account creation

  // Set by admin.js featured toggle; cleaned up by deleteSubmission
  featuredGuideIds?: [string]     // Guide slugs starred by this user
}
```

### config/*

| Document | Fields |
|----------|--------|
| `config/admins` | `{ emails: [string] }` |
| `config/github` | `{ token: string }` |
| `config/gemini` | `{ apiKey: string }` |

---

## Summary Table

| Action | Type | Trigger | Key Input | Key Output | Side Effects |
|--------|------|---------|-----------|------------|--------------|
| `checkAdminStatus` | Cloud Fn | Client call | auth context | `{ isAdmin }` | None |
| `submitArticle` | Cloud Fn | Client call | title, content, language, coAuthors | `{ docId, guideId }` | Firestore write, audit |
| `resubmitArticle` | Cloud Fn | Client call | docId, updated content | `{ success }` | Firestore update, audit |
| `approveSubmission` | Cloud Fn | Admin call | docId | `{ published, translationResults }` | GitHub publish, translate, Firestore, audit |
| `rejectSubmission` | Cloud Fn | Admin call | docId, reason | `{ success }` | Firestore update, audit |
| `requestRevision` | Cloud Fn | Admin call | docId, comments | `{ revisionHistory }` | Firestore update, audit |
| `deleteSubmission` | Cloud Fn | Admin call | docId | `{ wasApproved }` | GitHub delete, Firestore delete, audit |
| `deploy.yml` | GitHub Action | Push to main | Repo code | Live site | Tests, build, deploy to Pages |
| `script/translate` | CLI | Manual | guide-id, target-lang | Translated .md files | Filesystem write, Claude API |
| `backfill-submissions.js` | Script | Manual | Hardcoded guides | Firestore docs | Firestore write |
| `migrate-*` | Scripts | Manual | --write flag | Migrated data | Firestore updates |
