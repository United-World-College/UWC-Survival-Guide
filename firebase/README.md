# Firebase Configuration

This folder contains the Firebase security rules and index definitions for the UWC Survival Guide project.

## Project

- **Project ID:** `uwc-survival-guide`
- **Config file:** `../firebase.json` (references files in this folder)
- **RC file:** `../.firebaserc`

## Files

| File | Purpose |
|---|---|
| `firestore.rules` | Firestore security rules |
| `firestore.indexes.json` | Composite index definitions |
| `storage.rules` | Cloud Storage security rules |

## Firestore Collections

### `users/{uid}`
User profiles (display name, photo, profile links, featured articles).

- **Read:** Public (needed for author pages)
- **Create:** Owner only (`auth.uid == uid`), must include a valid `author_id` (non-empty string matching `^[a-z0-9]+(-[a-z0-9]+)*$`)
- **Update:** Owner only; `author_id` cannot be changed once set. Legacy docs without `author_id` may backfill it once using the same slug rules.

### `submissions/{docId}`
Article submissions with full revision history.

All writes (create, update, delete) are blocked at the rules level — they go through **Cloud Functions** using the Admin SDK, which bypasses security rules.

- **Read (approved):** Public (needed for author pages)
- **Read (non-approved):** Author (`uid` match), coauthor (`coauthorUids` contains), or admin

Key fields: `uid`, `title`, `category`, `language`, `description`, `content`, `status`, `authorName`, `coAuthors[]`, `coauthorUids[]`, `createdAt`, `revisionHistory[]`, `reviewerComments`, `authorMessage`, `rejectionReason`, `approveMessage`

`coAuthors[]` is the canonical ordered author list for portal submissions. The first entry becomes the published front-matter `author`, and the remaining entries become front-matter `coauthors`.

Status lifecycle: `pending` &rarr; `approved` | `rejected` | `revise_resubmit` &rarr; `pending` (resubmitted) &rarr; ...

### `submissionAudit/{docId}`
Private workflow audit trail for editor/coauthor actions.

- **Read:** Admin only
- **Write:** Cloud Functions only (Admin SDK)

### `config/{docId}`
Admin-only configuration (e.g. GitHub deploy token, admin email list, Gemini API key).

- **Read:** Admin emails only (verified email required)
- **Write:** None (manual via console)

Known config documents:
- `config/admins` — `{ emails: [...] }` — admin email list (used by the `isAdmin()` rule)
- `config/github` — `{ token: "ghp_..." }` — GitHub API token for committing
- `config/gemini` — `{ apiKey: "AIza..." }` — Gemini API key for translation

## Composite Indexes

| Collection | Fields | Purpose |
|---|---|---|
| `submissions` | `uid` ASC, `createdAt` DESC | "My Submissions" query |
| `submissions` | `status` ASC, `uid` ASC, `createdAt` DESC | Filtered submissions by status and author |
| `submissions` | `status` ASC, `coauthorUids` CONTAINS, `createdAt` DESC | Coauthor submissions query |

## Storage

| Path | Read | Write | Constraints | Purpose |
|---|---|---|---|---|
| `avatars/{uid}` | Public | Owner only | < 2 MB, must be image (`image/*`) | Profile photos |

## Admin Emails

Stored in the Firestore document `config/admins` (an `emails` array). The `isAdmin()` function in `firestore.rules` reads this document at runtime. Current admins:
- `li.dongyuan@ufl.edu`
- `jingranhuang590@gmail.com`

## Deploy Commands

```bash
# Deploy everything (rules + indexes)
firebase deploy --only firestore,storage

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only indexes
firebase deploy --only firestore:indexes

# Deploy only Storage rules
firebase deploy --only storage
```

## Emulators

Configured in `../firebase.json`. Start with:

```bash
./script/firebase
```

| Service | Port |
|---|---|
| Auth | 9099 |
| Firestore | 8080 |
| Storage | 9199 |
| Emulator UI | 4010 |

Emulator data persists in `../.firebase-data/` (gitignored).
