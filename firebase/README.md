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
- **Write:** Owner only (`auth.uid == uid`)

### `submissions/{docId}`
Article submissions with full revision history.

- **Create:** Any authenticated user
- **Read/Update:** Author (`uid` match) or admin

Key fields: `uid`, `title`, `category`, `language`, `description`, `content`, `status`, `authorName`, `createdAt`, `revisionHistory[]`, `reviewerComments`, `authorMessage`, `rejectionReason`, `approveMessage`

Status lifecycle: `pending` &rarr; `approved` | `rejected` | `revise_resubmit` &rarr; `pending` (resubmitted) &rarr; ...

### `config/{docId}`
Admin-only configuration (e.g. GitHub deploy token).

- **Read:** Admin emails only
- **Write:** None (manual via console)

## Composite Indexes

| Collection | Fields | Purpose |
|---|---|---|
| `submissions` | `uid` ASC, `createdAt` DESC | "My Submissions" query |

## Storage

| Path | Read | Write | Purpose |
|---|---|---|---|
| `avatars/{uid}` | Public | Owner only | Profile photos |

## Admin Emails

Defined in `firestore.rules` and `admin_page.html`:
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
