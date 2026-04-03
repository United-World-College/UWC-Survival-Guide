# Codebase Action Flow Reference

> **Maintainer note for AI agents:** This document is the authoritative reference
> for every action in the UWC Survival Guide project. **You MUST read this file
> before modifying any code.** After making code changes that alter function
> signatures, side effects, data flows, or add/remove functions, **update this
> file to match.** Every claim here must have a 1:1 correspondence with the
> actual code — no stale descriptions, no missing functions, no phantom APIs.

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
  - [getServiceUsage](#getserviceusage)
- [Internal Library Functions](#internal-library-functions)
  - [Auth](#auth)
  - [Config](#config)
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

All callable functions are defined in `functions/index.js` and invoked via Firebase `onCall` (v2).

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
1. Calls `assertAuth()` — throws if no auth
2. Fetches admin email list from `config/admins` Firestore doc (cached 5 min)
3. Returns `true` if email is verified AND in the list

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
1. Calls `assertAuth()` — throws if no auth
2. Validates all required fields are present and non-empty
3. Generates `guide_id` slug via `makeSlug(title)` then `ensureUniqueGuideSlug()`
4. Extracts `coauthorUids` from coAuthors entries that have a `uid`
5. Creates `submissions/{docId}` document with status `"pending"`

**Side Effects:**
- Creates Firestore document in `submissions` collection
- Appends audit event (`type: "submitted"`) to `submissionAudit/{docId}`

---

### resubmitArticle

**Location:** `functions/index.js`

**Trigger:** Client calls via Firebase SDK

**Auth:** Submission owner or listed co-author (via `coauthorUids`)

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
3. Sanitizes revision history (strips PII fields)
4. Marks latest revision round with `resubmittedAt` timestamp and `authorMessage`
5. Updates content fields; sets status back to `"pending"`
6. Deletes transient review fields (`approveMessage`, `rejectionReason`) via `withoutPublicActorFields`

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
1. Calls `assertAdmin()` — throws if not admin or email not verified
2. Fetches and validates submission document (must be `pending` or `revise_resubmit`)
3. Resolves all submission authors via `resolveSubmissionAuthors()`
4. Looks up editor's display name from `users/{adminUid}`
5. Generates markdown with frontmatter via `generateMarkdown()`
6. Fetches GitHub token — throws `HttpsError("internal")` if not configured
7. Collects source guide file into `filesToCommit` array
8. Auto-translates via `translateMissingVariants()` (Gemini API) — appends successful translations to `filesToCommit`
9. Batch commits all files (source + translations) in a single GitHub commit via `batchCommitFiles()`
10. **If batch commit fails: throws `HttpsError("internal")` — status unchanged**
11. On success:
    - Sets status to `"approved"`, stores `reviewedAt`, sanitized `revisionHistory`
    - Calls `ensureAuthorId()` for each author with a UID
    - Calls `ensureAuthorPresenceOnGitHub()` for all authors (non-fatal if fails)
    - Stores `translationResults` and `translations` metadata on submission

**Side Effects:**
- Batch commits guide files (source + translations) to GitHub in a single commit
- Creates author markdown files on GitHub (separate commit, if new author)
- Appends contributor entry to `website/_data/about.yml` (if new author)
- Calls Google Gemini API for translation (up to 2 calls)
- Updates `submissions/{docId}` with status, translation results, metadata
- Calls `ensureAuthorId()` for each author UID (sets `author_id` if missing)
- Appends audit event (`type: "approved"`) to `submissionAudit/{docId}`

---

### rejectSubmission

**Location:** `functions/index.js`

**Trigger:** Admin calls via Firebase SDK

**Auth:** Admin only

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `docId` | `string` | Submission document ID |
| **Input** | `reason` | `string` | Rejection reason (required) |
| **Output** | `success` | `boolean` | Always `true` on success |

**Logic:**
1. Calls `assertAdmin()`
2. Fetches submission, verifies it exists
3. Sets status to `"rejected"`, stores `rejectionReason`, `reviewedAt`
4. Sanitizes `revisionHistory`, deletes `approveMessage` via `withoutPublicActorFields`

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
| **Input** | `comments` | `string` | Reviewer comments for the author (required) |
| **Output** | `success` | `boolean` | Always `true` on success |
| **Output** | `revisionHistory` | `array` | Updated revision history (PII already sanitized) |

**Logic:**
1. Calls `assertAdmin()`
2. Fetches submission, verifies it exists
3. Sanitizes existing revision history
4. Appends new revision entry with:
   - `round` number (sequential)
   - `reviewerComments`
   - `contentSnapshot` (`title`, `category`, `language`, `description`, `content`)
   - `reviewedAt` timestamp (ISO string)
5. Sets status to `"revise_resubmit"`, stores `reviewerComments`
6. Deletes `approveMessage`, `rejectionReason` via `withoutPublicActorFields`

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
1. Calls `assertAdmin()`
2. Fetches submission, verifies it exists
3. If previously approved:
   - Gets ordered authors via `getOrderedSubmissionAuthors()`, plus `d.uid` as fallback
   - Removes `guide_id` from each author's `featuredGuideIds` array in `users/{uid}`
   - Determines file path from `LANG_MAP`
   - Fetches file SHA from GitHub, then deletes the file via Contents API
4. Appends audit event with original submission data
5. Deletes `submissions/{docId}` from Firestore

**Side Effects:**
- Deletes guide file from GitHub repository (if was approved)
- Updates `users/{uid}` `featuredGuideIds` for each author (if was approved)
- Deletes Firestore document
- Appends audit event (`type: "deleted"`) with original metadata to `submissionAudit/{docId}`

---

### getServiceUsage

**Location:** `functions/index.js`

**Trigger:** Admin calls via Firebase SDK

**Auth:** Admin only

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `forceRefresh` | `boolean?` | Bypass 5-min server cache |
| **Output** | `firestore` | `object` | Document counts per collection (`users`, `submissions`, `submissionAudit`, `config`) |
| **Output** | `submissions` | `object` | Breakdown by status (`pending`, `approved`, `rejected`, `revise_resubmit`, `total`) |
| **Output** | `storage` | `object` | `{ avatarCount, totalSizeMB }` |
| **Output** | `cachedAt` | `string` | ISO timestamp of when data was gathered |

**Logic:**
1. Calls `assertAdmin()`
2. Returns cached result if within 5-min TTL and `forceRefresh` is not true
3. Gathers metrics in parallel: Firestore aggregation counts, submission status counts, Storage file listing
4. Caches result in memory

---

## Internal Library Functions

### Auth

**Location:** `functions/lib/auth.js`

#### getAdminEmails()

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | *(none)* | — | — |
| **Output** | `emails` | `string[]` | Cached admin email list (5 min TTL) |

**Source:** Reads `config/admins` Firestore document. Throws `HttpsError("internal")` if doc missing or `emails` is not an array.

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

**Logic:** Calls `assertAuth()`, checks `email_verified === true`, then checks email is in admin list.

---

### Config

**Location:** `functions/lib/config.js`

**Exports:**
- `db` — Firestore instance (from `firebase-admin`)
- `FieldValue` — Firestore `FieldValue` (for `serverTimestamp()`, `delete()`, etc.)
- `REPO` — `"United-World-College/UWC-Survival-Guide"`
- `LANG_MAP` — Language configuration:

| Key | `name` | `folder` | `sort` | `suffix` |
|-----|--------|----------|--------|----------|
| `en` | `English` | `default` | `1` | `""` |
| `zh-CN` | `简体中文` | `chinese` | `2` | `"-CN"` |
| `zh-TW` | `台灣繁體` | `chinese` | `3` | `"-TW"` |

---

### GitHub

**Location:** `functions/lib/github.js`

#### getGitHubToken()

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | *(none)* | — | — |
| **Output** | `token` | `string\|null` | GitHub API token from `config/github` doc |

#### githubRest(method, endpoint, token, body)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `method` | `string` | HTTP method |
| **Input** | `endpoint` | `string` | Path relative to `https://api.github.com/repos/{REPO}/` |
| **Input** | `token` | `string` | GitHub API token |
| **Input** | `body` | `object?` | Request body |
| **Output** | `response` | `object\|null` | Parsed JSON response; `null` on 404 for GET or 204 |

Used internally by `batchCommitFiles` for Git Data API calls.

#### githubApi(method, path, token, body)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `method` | `string` | HTTP method (`GET`, `PUT`, `DELETE`) |
| **Input** | `path` | `string` | Path relative to repo contents URL |
| **Input** | `token` | `string` | GitHub API token |
| **Input** | `body` | `object?` | Request body |
| **Output** | `response` | `object\|null` | Parsed JSON response; `null` on 404 for GET or 204 |

**Base URL:** `https://api.github.com/repos/United-World-College/UWC-Survival-Guide/contents/`

Used for single-file operations (GET to check existence, PUT for single writes, DELETE for file removal).

#### batchCommitFiles(token, files, message, branch)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `token` | `string` | GitHub API token |
| **Input** | `files` | `array` | `[{ path: string, content: string }]` — files to commit |
| **Input** | `message` | `string` | Commit message |
| **Input** | `branch` | `string?` | Branch name (default: `"main"`) |
| **Output** | `commit` | `object` | GitHub commit object |

**Logic (Git Data API):**
1. Get latest commit SHA on branch (`git/ref/heads/{branch}`)
2. Get base tree SHA from that commit
3. Create blobs for each file (`git/blobs`)
4. Create new tree with all files (`git/trees`)
5. Create new commit pointing to new tree (`git/commits`)
6. Update branch reference (`git/refs/heads/{branch}`)

**Side Effects:** Creates a single atomic commit with all files on GitHub.

#### ensureAuthorPresenceOnGitHub(token, author)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `token` | `string` | GitHub API token |
| **Input** | `author` | `object` | `{ author_id, name, uid? }` |
| **Output** | *(none)* | — | — |

**Logic:**
1. Resolves author slug from `author_id`, falling back to `makeAuthorSlug(name)`, `uid`, then `makeSlug(name)`
2. Checks if author files already exist via `githubApi("GET", ...)`
3. If any author files are missing, batch commits them via `batchCommitFiles()`
4. Checks if author is in `website/_data/about.yml`; if not, appends a contributor entry

**Side Effects (if author files don't exist):**
- Creates `website/_authors/default/{slug}.md`
- Creates `website/_authors/chinese/{slug}-cn.md`
- Creates `website/_authors/chinese/{slug}-tw.md`
- Appends contributor entry to `website/_data/about.yml` (separate commit via Contents API PUT)

---

### Translation

**Location:** `functions/lib/translation.js`

**Constants:**
- `TRANSLATE_MODEL`: `"gemini-2.5-flash"`
- `TRANSLATE_MAX_TOKENS`: `16000`
- `TRANSLATE_SYSTEM_PROMPT`: System instruction for Gemini (translation editor role)
- `RESPONSE_SCHEMA`: JSON schema for structured output (`{ title, category, description, body }`)
- `STYLE_NOTES`: Per-language style guidance (`en`, `zh-CN`, `zh-TW`)
- `PROMPT_NAMES`: Human-readable language names for prompts

#### getGeminiKey()

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | *(none)* | — | — |
| **Output** | `apiKey` | `string\|null` | API key from `config/gemini` doc |

#### buildTranslationPrompt(sourceLang, targetLang, payload)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `sourceLang` | `string` | Source language code |
| **Input** | `targetLang` | `string` | Target language code |
| **Input** | `payload` | `object` | `{ guide_id, author, source_language, target_language, title, category, description, body }` |
| **Output** | `prompt` | `string` | Complete prompt string for Gemini |

#### translateGuide(apiKey, sourceLang, targetLang, guideData)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `apiKey` | `string` | Google Gemini API key |
| **Input** | `sourceLang` | `string` | Source language code |
| **Input** | `targetLang` | `string` | Target language code |
| **Input** | `guideData` | `object` | `{ guide_id, author, title, category, description, content }` |
| **Output** | `translation` | `object` | `{ title, category, description, body }` |

**Logic:** Uses `@google/generative-ai` SDK with `responseMimeType: "application/json"` and `responseSchema` for structured output. Validates all 4 required fields are present strings.

**Side Effects:** Calls Google Gemini API (structured JSON output, not tool use)

#### buildTranslatedMarkdown(originalData, translation, targetLang, authors, editorName, slug)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `originalData` | `object` | Original submission data |
| **Input** | `translation` | `object` | `{ title, category, description, body }` |
| **Input** | `targetLang` | `string` | Target language code |
| **Input** | `authors` | `array` | `[{ author_id, name }]` |
| **Input** | `editorName` | `string` | Reviewer/editor name |
| **Input** | `slug` | `string` | Guide slug |
| **Output** | `result` | `object` | `{ markdown, fileName, folder, filePath }` |

#### translateMissingVariants(apiKey, d, slug, authors, editorName)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `apiKey` | `string` | Google Gemini API key |
| **Input** | `d` | `object` | Submission data |
| **Input** | `slug` | `string` | Guide slug |
| **Input** | `authors` | `array` | Author list |
| **Input** | `editorName` | `string` | Reviewer name |
| **Output** | `results` | `array` | `[{ lang, filePath, markdown, success, title, category, description, error? }]` |

**Logic:** Iterates over all languages in `LANG_MAP` except the source language; calls `translateGuide()` then `buildTranslatedMarkdown()` for each. Errors per-language are caught and included in results (does not throw).

**Note:** This function does NOT publish to GitHub. It returns the generated markdown and metadata. The caller (`approveSubmission`) handles committing to GitHub.

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

**Logic:** Reads existing events from `submissionAudit/{docId}`, looks up `author_id` from `users/{auth.uid}`, appends new event with `actorUid`, `actorAuthorId`, `actedAt` (ISO), and details. Uses `set({ merge: true })`.

**Side Effects:** Creates or updates `submissionAudit/{docId}` with new event appended

#### resolveAuthorSlug(uid, authorName)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `uid` | `string` | Firebase user UID |
| **Input** | `authorName` | `string` | Fallback display name |
| **Output** | `authorSlug` | `string` | Resolved `author_id` |

**Logic:** If UID provided, checks `users/{uid}` for existing `author_id`. Falls back to `makeAuthorSlug(authorName)`, then `uid.toLowerCase()`, then `makeSlug(authorName)`.

#### resolveSubmissionAuthors(d)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `d` | `object` | Submission data (needs `coAuthors` with `uid`, `author_id`, `name`, `order`) |
| **Output** | `authors` | `array` | `[{ author_id, name, uid?, order }]` ordered and deduplicated |

**Logic:** Calls `getOrderedSubmissionAuthors(d)` to get sorted/deduped list, then resolves `author_id` for each via `resolveAuthorSlug()`. Throws `HttpsError("failed-precondition")` if no authors found.

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

**Logic:** Only sets `author_id` if user doc doesn't have one yet. Calls `ensureUniqueAuthorSlug()` to avoid collisions. Uses `set({ merge: true })`.

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
| **Output** | `slug` | `string` | Kebab-case slug (NFKD normalize, strip diacritics, lowercase, non-alphanum → `-`). Returns `"untitled"` if empty. |

#### makeAuthorSlug(text)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `text` | `string` | Author name |
| **Output** | `slug` | `string` | Normalized author slug (handles accents, ß→ss, Æ→ae, Ø→o, Ð→d, Þ→th, Ł→l, Ħ→h, ı→i, etc.) |

#### getAuthorKey(author)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `author` | `object` | `{ uid?, author_id?, name? }` |
| **Output** | `key` | `string` | Deduplication key: `uid:{uid}`, `author:{author_id}`, or `name:{lowered}` |

Used internally by `getOrderedSubmissionAuthors` for deduplication.

#### getOrderedSubmissionAuthors(d)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `d` | `object` | Submission data with `coAuthors` array |
| **Output** | `authors` | `array` | Deduplicated, sorted by `order`, `[{ uid, author_id, name, order }]` |

**Logic:** Sorts `coAuthors` by `order` field, deduplicates via `getAuthorKey()`, filters out entries without a name.

#### sanitizeRevisionHistory(history)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `history` | `array` | Revision history entries |
| **Output** | `sanitized` | `array` | Same entries with PII fields removed (`reviewerUid`, `reviewerEmail`, `authorUid`, `authorEmail`, `actorUid`, `actorEmail`) |

#### withoutPublicActorFields(updateData)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `updateData` | `object` | Firestore update payload |
| **Output** | `cleaned` | `object` | Same payload with `reviewerUid` and `reviewerEmail` set to `FieldValue.delete()` |

Used by all state-transition functions to strip legacy PII fields on every update.

#### generateMarkdown(d, authors, editorName, overrideSlug)

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | `d` | `object` | Submission data |
| **Input** | `authors` | `array` | `[{ author_id, name }]` |
| **Input** | `editorName` | `string` | Reviewer/editor display name |
| **Input** | `overrideSlug` | `string?` | Optional slug override |
| **Output** | `result` | `object` | `{ markdown, slug, fileName, folder, filePath }` |

**Frontmatter fields generated:** `title`, `category`, `description`, `order` (hardcoded 99), `author` (first author name), `author_id`, `coauthors` (if multiple — note: lowercase, not `co_authors`), `guide_id`, `original_language`, `language_code`, `language_name`, `language_folder`, `language_sort`, `submitted` (from `createdAt`), `published` (today), `updated` (today), `editor`, `editor_id`

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
- `--baseurl /UWC-Survival-Guide` passed to Jekyll

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
| **Input** | `--dry-run` | flag | Show what would be translated without writing |
| **Input** | `--guide-id <id>` | `string` | Translate a specific guide only |
| **Input** | `--target-language <code>` | `string` | Translate into a specific language only (`en`, `zh-CN`, `zh-TW`) |
| **Output** | New `.md` files | files | Written to `website/_guides/` |

**Logic:**
1. Scans `website/_guides/default/` and `website/_guides/chinese/`
2. Groups files by `guide_id` (from frontmatter or filename)
3. Identifies missing language variants for each guide
4. Selects preferred source language per `PREFERRED_SOURCES` mapping
5. Calls Google Gemini API (`google-generativeai` Python SDK) with structured JSON output
6. Rewrites internal Liquid links to target language folder
7. Writes translated markdown files

**Source preference rules:**
- Translating to English → prefer `zh-CN` source, fallback `zh-TW`
- Translating to `zh-TW` → prefer `zh-CN` source, fallback `en`
- Translating to `zh-CN` → prefer `en` source, fallback `zh-TW`

**Environment:**
- `GEMINI_API_KEY` (required, from root `.env`)
- `GEMINI_MODEL` (optional, default: `gemini-2.5-flash`)
- Requires Python >= 3.13, `uv`

---

### script/serve

**Location:** `script/serve`

**Trigger:** Manual: `./script/serve [args]`

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| **Input** | CLI args | passthrough | Forwarded to Jekyll (e.g. `--port 8000`) |
| **Output** | Local server | HTTP | Jekyll dev server with auto-detected port (starting from 4000) |

**Environment:** `JEKYLL_ENV` (default: `development`). Uses rbenv if available.

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
| **Input** | `--dry-run` | flag | Preview without writing (default behavior) |
| **Input** | Hardcoded guide paths | constants | `college-application.md`, `school-selection.md`, `terminology.md` |
| **Output** | Firestore documents | `submissions/` | Backfilled submission records with status `"approved"` |

**Logic:**
- Phase 1: Parses guide frontmatter, looks up user by `author_id`, creates submission docs
- Phase 2: Backfills `translations` map from existing guide file variants (en, zh-CN, zh-TW)

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

**Trigger:** Manual: `node scripts/migrate-submission-authors.js [--write]`

**Purpose:** Converts legacy author format to ordered-author-list format (`coAuthors` array with `order` field). Normalizes, deduplicates, and resolves `author_id` from user docs or name slug. Updates `coAuthors` and `coauthorUids` fields. Dry-run by default.

---

### migrate-author-id.js

**Location:** `scripts/migrate-author-id.js`

**Trigger:** Manual: `node scripts/migrate-author-id.js`

**Purpose:** Backfills `author_id` from deprecated `authorPage` field for all users. Removes `authorPage` field. Writes directly (no dry-run mode).

---

## Data Flow Diagrams

### Submission → Publication Flow

```
User fills form in admin UI
         |
         v
  submitArticle()
    +-- assertAuth()
    +-- Validate fields
    +-- Generate guide_id slug (makeSlug + ensureUniqueGuideSlug)
    +-- Create submissions/{docId}  -->  Firestore
    +-- Status: "pending"
    +-- Audit event: "submitted"    -->  submissionAudit/{docId}
         |
         v
  [Admin reviews in dashboard]
         |
         v
  approveSubmission()
    +-- assertAdmin()
    +-- Resolve all authors (resolveSubmissionAuthors)
    +-- Generate markdown + frontmatter (generateMarkdown)
    +-- Fetch Gemini API key
    +-- translateMissingVariants()
    |   +-- Call Gemini API            -->  Google Gemini
    |   +-- Build translated markdown (per language)
    +-- batchCommitFiles()             -->  GitHub (single atomic commit)
    |   +-- Source guide file
    |   +-- Translated guide files (if successful)
    +-- Status: "approved"             -->  Firestore
    +-- ensureAuthorId()               -->  users/{uid} (set author_id if missing)
    +-- ensureAuthorPresenceOnGitHub()  -->  GitHub (separate commit)
    |   +-- Author .md files (if new)
    |   +-- about.yml entry (if new)
    +-- Store translationResults       -->  submissions/{docId}
    +-- Audit event: "approved"        -->  submissionAudit/{docId}
         |
         v
  Push to main triggers deploy.yml
    +-- Run tests (Jest)
    +-- Build Jekyll site
    |   +-- Read _guides/**/*.md
    |   +-- Read _data/**/*.yml
    |   +-- Apply _layouts/
    |   +-- Output _site/
    +-- Deploy to GitHub Pages         -->  Live website
```

### Revision Workflow

```
  requestRevision()
    +-- assertAdmin()
    +-- Sanitize existing revisionHistory
    +-- Append new revision entry
    |   +-- reviewerComments
    |   +-- contentSnapshot
    |   +-- reviewedAt timestamp
    +-- Status: "revise_resubmit"      -->  Firestore
    +-- Delete approveMessage, rejectionReason
    +-- Audit: "revision_requested"    -->  submissionAudit/{docId}
         |
         v
  [Author edits and resubmits]
         |
         v
  resubmitArticle()
    +-- Validate ownership (uid or coauthorUids)
    +-- Validate status is "revise_resubmit"
    +-- Sanitize revisionHistory
    +-- Mark round resubmittedAt + authorMessage
    +-- Update content fields
    +-- Status: "pending"              -->  Firestore
    +-- Delete approveMessage, rejectionReason
    +-- Audit: "resubmitted"           -->  submissionAudit/{docId}
         |
         v
  [Returns to admin review]
```

### Auto-Translation Workflow

```
  ./script/translate
         |
         v
  Scan _guides/default/ and _guides/chinese/
    +-- Parse frontmatter from all guide files
    +-- Group by guide_id
         |
         v
  For each guide, identify missing language variants
    +-- Has en but not zh-CN?  -> translate
    +-- Has en but not zh-TW?  -> translate
    +-- Has zh-CN but not en?  -> translate
    +-- (etc. for all 3 languages)
         |
         v
  Select best source language (PREFERRED_SOURCES)
    +-- Target en   -> prefer zh-CN source, fallback zh-TW
    +-- Target zh-TW -> prefer zh-CN source, fallback en
    +-- Target zh-CN -> prefer en source, fallback zh-TW
         |
         v
  Call Google Gemini API (structured JSON output)
    +-- System: translation editor role
    +-- User: source content + style notes
    +-- Response schema: { title, category, description, body }
         |
         v
  Post-process
    +-- Rewrite Liquid links to target folder
    +-- Build target metadata (language_code, language_sort, etc.)
    +-- Normalize frontmatter field order
         |
         v
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

  // Review messages (transient — deleted on state transitions via withoutPublicActorFields)
  approveMessage?: string,        // Set on approve; deleted on resubmit
  reviewerComments?: string,      // Set on requestRevision
  rejectionReason?: string,       // Set on reject; deleted on resubmit
  authorMessage?: string,         // Set on resubmit

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
    round?: number,               // On revision_requested, resubmitted
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
| `approveSubmission` | Cloud Fn | Admin call | docId | `{ published, translationResults }` | GitHub batch commit, Gemini translate, Firestore, audit |
| `rejectSubmission` | Cloud Fn | Admin call | docId, reason | `{ success }` | Firestore update, audit |
| `requestRevision` | Cloud Fn | Admin call | docId, comments | `{ revisionHistory }` | Firestore update, audit |
| `deleteSubmission` | Cloud Fn | Admin call | docId | `{ wasApproved }` | GitHub delete, Firestore delete, audit |
| `getServiceUsage` | Cloud Fn | Admin call | forceRefresh? | `{ firestore, submissions, storage, cachedAt }` | Firestore count, Storage list |
| `deploy.yml` | GitHub Action | Push to main | Repo code | Live site | Tests, build, deploy to Pages |
| `script/translate` | CLI | Manual | guide-id, target-lang | Translated .md files | Filesystem write, Gemini API |
| `backfill-submissions.js` | Script | Manual | Hardcoded guides | Firestore docs | Firestore write |
| `migrate-*` | Scripts | Manual | --write flag | Migrated data | Firestore updates |
