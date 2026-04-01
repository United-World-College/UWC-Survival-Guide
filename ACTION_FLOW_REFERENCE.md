# Action Flow Reference

Complete mapping of every user action — what triggers it, what fields are involved (frontend & database), and where each action reads from / writes to.

---

## Table of Contents

- [Authentication](#authentication)
- [Profile Management](#profile-management)
- [Article Submission](#article-submission)
- [Resubmit Article](#resubmit-article)
- [View My Submissions](#view-my-submissions)
- [Admin: Approve Submission](#admin-approve-submission)
- [Admin: Reject Submission](#admin-reject-submission)
- [Admin: Request Revision](#admin-request-revision)
- [Admin: Delete Submission](#admin-delete-submission)
- [Admin: Review Panel](#admin-review-panel)
- [Register Published Article](#register-published-article)
- [Feature Articles](#feature-articles)
- [Coauthor Search & Add](#coauthor-search--add)
- [Database Schema Summary](#database-schema-summary)
- [Status Flow Diagram](#status-flow-diagram)

---

## Authentication

### Sign In

| | Details |
|---|---|
| **Trigger** | User fills sign-in form and clicks "Sign In" |
| **Frontend fields** | Email, Password |
| **Frontend location** | `website/_layouts/admin_page.html` — `#signin-form` |
| **API call** | `firebase.auth().signInWithEmailAndPassword()` |
| **Reads from** | Firebase Auth |
| **Writes to** | Nothing (session only) |

### Sign Up

| | Details |
|---|---|
| **Trigger** | User fills sign-up form and clicks "Sign Up" |
| **Frontend fields** | Email, Password, Confirm Password, Display Name, Cohort |
| **Frontend location** | `website/_layouts/admin_page.html` — `#signup-form` |
| **API call** | `firebase.auth().createUserWithEmailAndPassword()` + direct Firestore write |
| **Reads from** | Nothing |
| **Writes to** | **Firebase Auth** (new user) + **`users/{uid}`** (profile document with `displayName`, `author_id`, `cohort`, `email`, `createdAt`) |

### Forgot Password

| | Details |
|---|---|
| **Trigger** | User enters email and clicks reset button |
| **Frontend fields** | Email |
| **API call** | `firebase.auth().sendPasswordResetEmail()` |
| **Reads from** | Firebase Auth |
| **Writes to** | Nothing (sends email) |

---

## Profile Management

| | Details |
|---|---|
| **Trigger** | User edits profile fields and clicks "Save Profile" |
| **Frontend fields** | Avatar (file upload), Display Name, Show Email (checkbox), Affiliation, Cohort, Summary, Profile Links (up to 5, each with label + URL) |
| **Frontend location** | `website/_layouts/admin_page.html` — profile card section |
| **API call** | Direct Firestore write: `db.collection('users').doc(uid).set(data, { merge: true })` |
| **Reads from** | **`users/{uid}`** (to populate form on page load) |
| **Writes to** | **`users/{uid}`** — fields: `displayName`, `photoURL`, `showEmail`, `affiliation`, `cohort`, `summary`, `profileLinks`, `updatedAt` |
| **Storage** | Avatar uploaded to **Firebase Storage** at `/avatars/{uid}/*` (<5MB, images only) |

**Database fields written:**

| Field | Type | Notes |
|---|---|---|
| `displayName` | string | Max 40 chars |
| `photoURL` | string | Firebase Storage URL |
| `showEmail` | boolean | Public visibility toggle |
| `affiliation` | string | Max 80 chars |
| `cohort` | string | Max 60 chars |
| `summary` | string | Max 120 chars |
| `profileLinks` | array of `{label, url}` | Max 5 entries |
| `updatedAt` | timestamp | Auto-set |

---

## Article Submission

| | Details |
|---|---|
| **Trigger** | Author fills article form and clicks "Submit Article" |
| **Frontend fields** | Title, Category (dropdown: College Application / Life Reflections / Academics), Language (en / zh-CN / zh-TW), Author Name (auto-filled, disabled), Coauthors (optional, up to 5), Description, Content (markdown) |
| **Frontend location** | `website/_layouts/admin_page.html` — `#article-form` |
| **API call** | `functions.httpsCallable('submitArticle')` |
| **Reads from** | **`users/{uid}`** (for author info, `author_id`) |
| **Writes to** | **`submissions/{newDocId}`** (new document) + **`submissionAudit/{newDocId}`** (audit event) |

**Payload sent to backend:**

```js
{
  title, category, language, description, content, authorName,
  coAuthors: [{ uid, author_id, name, order }]
}
```

**Database fields written to `submissions/{docId}`:**

| Field | Value |
|---|---|
| `uid` | Author's Firebase UID |
| `authorName` | Author display name |
| `title` | From form |
| `category` | From form |
| `language` | From form |
| `description` | From form |
| `content` | Markdown from form |
| `guide_id` | Auto-generated slug from title |
| `status` | `"pending"` |
| `coAuthors` | Array from form |
| `coauthorUids` | Array of coauthor UIDs |
| `createdAt` | Server timestamp |
| `updatedAt` | Server timestamp |

**Audit event:** `{ type: "submitted", guideId }`

---

## Resubmit Article

| | Details |
|---|---|
| **Trigger** | Author clicks "Resubmit" on a submission with status `revise_resubmit`; opens pop-up window |
| **Frontend fields** | Title, Category, Language, Description, Content (all editable, pre-filled with current values), Author Message (optional, max 500 chars) |
| **Frontend location** | `website/_layouts/admin_page.html` — separate pop-up window, `#rs-form` |
| **API call** | `functions.httpsCallable('resubmitArticle')` |
| **Reads from** | **`submissions/{docId}`** (to populate form + verify status is `revise_resubmit` and user is owner/coauthor) |
| **Writes to** | **`submissions/{docId}`** (update) + **`submissionAudit/{docId}`** (audit event) |

**Payload:**

```js
{ docId, title, category, language, description, content, authorMessage }
```

**Database changes to `submissions/{docId}`:**

| Field | Change |
|---|---|
| `title` | Updated |
| `category` | Updated |
| `language` | Updated |
| `description` | Updated |
| `content` | Updated |
| `status` | Changed to `"pending"` |
| `revisionHistory[last]` | Adds `resubmittedAt` and `authorMessage` to last entry |
| `approveMessage` | Removed |
| `rejectionReason` | Removed |
| `updatedAt` | Server timestamp |

**Audit event:** `{ type: "resubmitted", authorMessage, round }`

---

## View My Submissions

| | Details |
|---|---|
| **Trigger** | Page load (authenticated user) |
| **Frontend location** | `website/_layouts/admin_page.html` — `#submissions-list` |
| **API call** | Two direct Firestore queries, results merged |
| **Reads from** | **`submissions`** — (1) `where('uid', '==', currentUid)` (own submissions) + (2) `where('coauthorUids', 'array-contains', currentUid)` (coauthored submissions) |
| **Writes to** | Nothing |

**Data displayed per submission:**

- Title, Category, Language, Status badge (color-coded), Submission date, Approved/Reviewed date
- Rejection reason (if rejected)
- Resubmit link (if `revise_resubmit`)

---

## Admin: Approve Submission

| | Details |
|---|---|
| **Trigger** | Admin clicks "Approve" in review modal, optionally adds message, clicks confirm |
| **Frontend fields** | Approve Message (optional, max 500 chars) |
| **Frontend location** | `website/_layouts/admin_page.html` — `#modal-approve-form` |
| **API call** | `functions.httpsCallable('approveSubmission')` |
| **Auth required** | Verified email in `ADMIN_EMAILS` list |
| **Reads from** | **`submissions/{docId}`**, **`users/{authorUid}`** (for all authors), **`config/github`** (token), **`config/anthropic`** (API key for translation) |
| **Writes to** | **`submissions/{docId}`**, **`users/{authorUid}`** (all authors), **GitHub repo**, **`submissionAudit/{docId}`** |

**Payload:** `{ docId, approveMessage }`

**Full process:**

1. Validates submission status is `pending` or `revise_resubmit`
2. Reuses the existing `guide_id` (generated at submission time; immutable)
3. Resolves all coauthors — fetches/generates `author_id` for each
4. Generates markdown file with YAML frontmatter
5. **GitHub writes:**
   - `PUT website/_guides/{lang_folder}/{guide_id}{suffix}.md` (article file)
   - `PUT website/_authors/{lang_folder}/{author_id}{suffix}.md` (author pages, if missing)
6. Auto-translates to missing language variants via **Claude API** (`claude-sonnet-4-6`)
7. Updates `submissions/{docId}`: `status → "approved"`, `reviewedAt`, `approveMessage`
8. Updates each author's `users/{uid}`: appends to `publishedArticles` array

**Audit event:** `{ type: "approved", approveMessage, guideId }`

---

## Admin: Reject Submission

| | Details |
|---|---|
| **Trigger** | Admin clicks "Reject" in review modal, enters reason, clicks confirm |
| **Frontend fields** | Rejection Reason (required, max 1000 chars) |
| **Frontend location** | `website/_layouts/admin_page.html` — `#modal-reject-form` |
| **API call** | `functions.httpsCallable('rejectSubmission')` |
| **Reads from** | **`submissions/{docId}`** (verify exists) |
| **Writes to** | **`submissions/{docId}`** + **`submissionAudit/{docId}`** |

**Payload:** `{ docId, reason }`

**Database changes to `submissions/{docId}`:**

| Field | Change |
|---|---|
| `status` | `"rejected"` |
| `rejectionReason` | Set to provided reason |
| `approveMessage` | Removed |
| `reviewedAt` | Server timestamp |
| `updatedAt` | Server timestamp |

**Audit event:** `{ type: "rejected", rejectionReason }`

---

## Admin: Request Revision

| | Details |
|---|---|
| **Trigger** | Admin clicks "Revise & Resubmit" in review modal, enters feedback, clicks confirm |
| **Frontend fields** | Reviewer Comments (required, max 1000 chars) |
| **Frontend location** | `website/_layouts/admin_page.html` — `#modal-rnr-form` |
| **API call** | `functions.httpsCallable('requestRevision')` |
| **Reads from** | **`submissions/{docId}`** (current content for snapshot) |
| **Writes to** | **`submissions/{docId}`** + **`submissionAudit/{docId}`** |

**Payload:** `{ docId, comments }`

**Database changes to `submissions/{docId}`:**

| Field | Change |
|---|---|
| `status` | `"revise_resubmit"` |
| `reviewerComments` | Set to provided comments |
| `approveMessage` | Removed |
| `rejectionReason` | Removed |
| `revisionHistory` | Appends new entry (see below) |
| `reviewedAt` | Server timestamp |
| `updatedAt` | Server timestamp |

**Revision history entry appended:**

```js
{
  round: <next round number>,
  reviewerComments: "...",
  reviewedAt: "<ISO string>",
  resubmittedAt: null,
  contentSnapshot: { title, category, language, description, content }
}
```

**Audit event:** `{ type: "revision_requested", reviewerComments, round }`

---

## Admin: Delete Submission

| | Details |
|---|---|
| **Trigger** | Admin clicks "Delete" in review modal and confirms |
| **Frontend fields** | None (confirmation only) |
| **Frontend location** | `website/_layouts/admin_page.html` — `#modal-delete-form` |
| **API call** | `functions.httpsCallable('deleteSubmission')` |
| **Reads from** | **`submissions/{docId}`** (to get guide_id, language, status, author info) |
| **Writes to** | **`submissions/{docId}`** (deleted), **`users/{authorUid}`** (if was approved — removes from `publishedArticles` and `featuredGuideIds`), **GitHub repo** (if was approved — deletes file), **`submissionAudit/{docId}`** |

**Payload:** `{ docId }`

**If submission was approved, additional cleanup:**
- Removes article from all authors' `publishedArticles` arrays
- Removes `guide_id` from all authors' `featuredGuideIds` arrays
- Deletes file from GitHub: `DELETE website/_guides/{lang_folder}/{guide_id}{suffix}.md`

**Audit event:** `{ type: "deleted", status, guideId, language, title }`

---

## Admin: Review Panel

| | Details |
|---|---|
| **Trigger** | Page load (admin user) |
| **Frontend location** | `website/_layouts/admin_page.html` — review panel with status filter tabs |
| **API call** | Direct Firestore query |
| **Reads from** | **`submissions`** — all documents (admin has global read access) |
| **Writes to** | Nothing |

**Filter tabs:** Pending, Approved, Rejected, Revise & Resubmit, All

**Data displayed per submission:** Title, Author, Category, Language, Status, Date, Coauthors

**Modal displays:** Full content, revision history thread, action buttons based on status

---

## Register Published Article

| | Details |
|---|---|
| **Trigger** | Author selects a published guide from dropdown and clicks "Register" |
| **Frontend fields** | Guide selector dropdown (populated from `SITE_GUIDES` — Jekyll-generated list of all published guides by this author) |
| **Frontend location** | `website/_layouts/admin_page.html` — featured articles card |
| **API call** | Direct Firestore write: `db.collection('users').doc(uid).update({ publishedArticles: [...] })` |
| **Reads from** | `SITE_GUIDES` (Jekyll build-time data embedded in page), **`users/{uid}`** (current `publishedArticles`) |
| **Writes to** | **`users/{uid}`** — `publishedArticles` array (appends `{ guide_id, title, category }`) |

---

## Feature Articles

| | Details |
|---|---|
| **Trigger** | Author toggles star/feature on a registered article |
| **Frontend location** | `website/_layouts/admin_page.html` — featured articles card |
| **API call** | Direct Firestore write: `db.collection('users').doc(uid).update({ featuredGuideIds: [...] })` |
| **Reads from** | **`users/{uid}`** (current `featuredGuideIds` and `publishedArticles`) |
| **Writes to** | **`users/{uid}`** — `featuredGuideIds` array (add/remove `guide_id` strings) |

---

## Coauthor Search & Add

| | Details |
|---|---|
| **Trigger** | Author types an `author_id` in coauthor search field and clicks search |
| **Frontend fields** | Coauthor Search Input (`author_id` string) |
| **Frontend location** | `website/_layouts/admin_page.html` — coauthor section in article form |
| **API call** | Direct Firestore query: `db.collection('users').where('author_id', '==', searchValue).get()` |
| **Reads from** | **`users`** collection (query by `author_id`) |
| **Writes to** | Nothing (adds to in-memory coauthor list only; persisted on article submit) |

---

## Database Schema Summary

### `users/{uid}`

| Field | Type | Set By | Notes |
|---|---|---|---|
| `uid` | string | Sign Up | Firebase Auth UID |
| `email` | string | Sign Up | |
| `displayName` | string | Sign Up / Profile | Max 40 chars |
| `author_id` | string | Sign Up (auto-gen) | Immutable after creation |
| `photoURL` | string | Profile | Firebase Storage URL |
| `showEmail` | boolean | Profile | |
| `affiliation` | string | Profile | Max 80 chars |
| `cohort` | string | Sign Up / Profile | Max 60 chars |
| `summary` | string | Profile | Max 120 chars |
| `profileLinks` | array | Profile | `[{label, url}]`, max 5 |
| `publishedArticles` | array | Approve / Register | `[{guide_id, title, category}]` |
| `featuredGuideIds` | array | Feature toggle | `[guide_id, ...]` |
| `createdAt` | timestamp | Sign Up | |
| `updatedAt` | timestamp | Profile / Approve | |

### `submissions/{docId}`

| Field | Type | Set By | Notes |
|---|---|---|---|
| `uid` | string | Submit | Primary author UID |
| `authorName` | string | Submit | |
| `title` | string | Submit / Resubmit | |
| `category` | string | Submit / Resubmit | |
| `language` | string | Submit / Resubmit | en, zh-CN, zh-TW |
| `description` | string | Submit / Resubmit | |
| `content` | string | Submit / Resubmit | Markdown |
| `guide_id` | string | Submit | Auto-generated slug, immutable after approval |
| `status` | string | Submit / Admin actions | pending, approved, rejected, revise_resubmit |
| `coAuthors` | array | Submit | `[{uid, author_id, name, order}]` |
| `coauthorUids` | array | Submit | UIDs for permission checks |
| `approveMessage` | string | Approve | Cleared on reject/revise |
| `rejectionReason` | string | Reject | Cleared on revise |
| `reviewerComments` | string | Request Revision | |
| `authorMessage` | string | Resubmit | |
| `revisionHistory` | array | Request Revision / Resubmit | See revision entry format above |
| `createdAt` | timestamp | Submit | |
| `updatedAt` | timestamp | All mutations | |
| `reviewedAt` | timestamp | Approve / Reject / Revise | |

### `submissionAudit/{docId}`

| Field | Type | Notes |
|---|---|---|
| `submissionId` | string | Matches `submissions` doc ID |
| `updatedAt` | timestamp | |
| `events` | array | `[{type, actorUid, actorAuthorId, actedAt, ...type-specific fields}]` |

### `config/github` & `config/anthropic`

| Field | Collection | Purpose |
|---|---|---|
| `token` | `config/github` | GitHub API personal access token |
| `apiKey` | `config/anthropic` | Claude API key for auto-translation |

---

## Status Flow Diagram

```
                    ┌──────────┐
                    │  Submit   │
                    └────┬─────┘
                         │
                         ▼
                    ┌──────────┐
              ┌─────│  pending  │─────┐
              │     └────┬─────┘     │
              │          │           │
              ▼          ▼           ▼
        ┌──────────┐ ┌────────┐ ┌──────────────────┐
        │ approved  │ │rejected│ │ revise_resubmit  │
        └──────────┘ └────────┘ └────────┬─────────┘
                                         │
                                    Resubmit
                                         │
                                         ▼
                                    ┌──────────┐
                                    │  pending  │  (cycle continues)
                                    └──────────┘
```

**Any status → Deleted** (admin can delete from any state)

---

## Author Page Creation (on Approval)

When a submission is approved, author pages are auto-created on GitHub for every author (primary + coauthors) via `ensureAuthorPresenceOnGitHub()` in `functions/index.js:231`.

**Trigger:** Part of the `approveSubmission` flow — runs after the guide file is pushed to GitHub.

**Condition:** Only creates files that don't already exist (idempotent — skips if author page is already present).

### Files created per author

| File | Path | Permalink |
|---|---|---|
| English | `website/_authors/default/{author_id}.md` | `/authors/{author_id}/` |
| Simplified Chinese | `website/_authors/chinese/{author_id}-cn.md` | `/zh-cn/authors/{author_id}/` |
| Traditional Chinese | `website/_authors/chinese/{author_id}-tw.md` | `/zh-tw/authors/{author_id}/` |

### Author page frontmatter

```yaml
---
title: "Author Display Name"
author_id: author-slug
permalink: /authors/author-slug/
translation_key: author-author-slug
language_code: en
language_name: English
language_sort: 1
---
```

### Contributor entry in `about.yml`

Also appends to `website/_data/about.yml` under `contributors:` if the `author_id` is not already listed:

```yaml
- id: author-slug
  name: "Author Display Name"
  affiliation:
  cohort:
  profile_label:
  profile_url:
  contacts: []
  photo:
  summary: "Contributor."
```

### Reads from
- **GitHub API** (`GET` each file path to check existence, `GET` `about.yml` to check for existing entry)
- **`users/{uid}`** (author's `author_id` and `displayName`)

### Writes to
- **GitHub repo** (`PUT` up to 3 author page files + `PUT` updated `about.yml`)

---

## Author Page Display (Public)

**File:** `website/_layouts/author.html`

The author page combines **static build-time data** (Jekyll) and **dynamic runtime data** (Firestore JS).

### Articles — "Latest" section (dynamic, runtime JS)

| | Details |
|---|---|
| **Reads from** | **Firestore `submissions` collection** — two queries: (1) `where('status', '==', 'approved').where('uid', '==', authorUid)` and (2) `where('status', '==', 'approved').where('coauthorUids', 'array-contains', authorUid)` |
| **Prerequisite** | First resolves `author_id` → `uid` via a `users` collection query |
| **Deduplication** | By document ID (merged from both queries) |
| **Sorting** | By `reviewedAt` (approval date) descending, fallback to `createdAt` |
| **Displays** | Date, category, title (linked), description |
| **URL construction** | Built from `guide_id` + `language` using the language map: `/guides/{folder}/{guide_id}{suffix}/` |

Articles appear here **as soon as the submission is marked approved in Firestore** — no need to wait for a Jekyll rebuild. Requires approved submissions to be publicly readable (Firestore security rules allow unauthenticated read when `status == 'approved'`).

### Featured articles section (dynamic, runtime JS)

| | Details |
|---|---|
| **Reads from** | **Firestore `users` collection** — `featuredGuideIds` array from the user doc |
| **Cross-referenced with** | The approved submissions already loaded for the Latest section |
| **Logic** | Filters the loaded submissions to only those whose `guide_id` is in `featuredGuideIds` |
| **Displays** | Same card format as Latest (date, category, title, description) |
| **Hidden if** | `featuredGuideIds` is empty or no matches found |

### Profile info (layered: static base + dynamic override)

| Data | Static source (build time) | Dynamic source (runtime JS) |
|---|---|---|
| Name | `about.yml` → `person.name` | Firestore `users` → `displayName` |
| Photo | `about.yml` → `person.photo` | Firestore `users` → `photoURL` |
| Affiliation | `about.yml` → `person.affiliation` | Firestore `users` → `affiliation` |
| Cohort | `about.yml` → `person.cohort` | Firestore `users` → `cohort` |
| Summary | `about.yml` → `person.summary` | Firestore `users` → `summary` |
| Role badge | `about.yml` EIC list + locale strings | JS recalculates: EIC > Core Member (≥5 articles) > Member |
| Email | Not shown statically | Firestore `users` → `email` (only if `showEmail` is true) |
| Profile links | `about.yml` → `person.profile_label/url` | Firestore `users` → `profileLinks` (merged with static links) |
| Contacts | Author page frontmatter or `about.yml` | Not overridden dynamically |

**Static reads:** `website/_data/about.yml` (editors_in_chief + contributors arrays), author page frontmatter

**Dynamic reads:** Firestore `users` collection (queried by `author_id`) + Firestore `submissions` collection (approved, queried by `uid`)

### Coauthors section (static, build time)

| | Details |
|---|---|
| **Reads from** | **`site.guides`** — same Jekyll collection |
| **Logic** | For each guide this author is part of, collects all *other* authors (primary + coauthors excluding self) |
| **Displays** | Coauthor name (linked to their author page), number of shared articles, sorted by count descending |

---

## External Systems Touched

| System | When | Operation |
|---|---|---|
| **GitHub API** | Approve | PUT article file + author pages to repo |
| **GitHub API** | Delete (if approved) | DELETE article file from repo |
| **Claude API** | Approve | Auto-translate to missing language variants |
| **Firebase Storage** | Profile update | Upload avatar image |
| **Firebase Auth** | Sign In / Sign Up / Reset | Authentication |

---

## Language Mapping

| Code | Folder | File Suffix | Sort Order |
|---|---|---|---|
| `en` | `default` | _(none)_ | 1 |
| `zh-CN` | `chinese` | `-CN` | 2 |
| `zh-TW` | `chinese` | `-TW` | 3 |

**File path pattern:** `website/_guides/{folder}/{guide_id}{suffix}.md`
