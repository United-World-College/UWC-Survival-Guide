# UWC Changshu China Survival Guide

[English](./README.md) | [简体中文](./README_CN.md) | [繁體中文](./README_TW.md)

A community-driven survival guide for students at **UWC Changshu China** — covering everything you need to know to thrive on campus and beyond.

## About

Starting at UWC Changshu China can be overwhelming — new country, new culture, new system. This guide is built by students, for students, to help you navigate daily life, academics, and everything in between at UWC Changshu China in Kunshan/Changshu, Jiangsu Province, China.

## Editors-in-Chief

- William Huang 黄靖然 (University of Illinois Urbana-Champaign, UWC Changshu China 24')
- Tom Li 李东源 (University of Florida, UWC Changshu China 24')
- E_P_silon (UWC Changshu China 24')

## Contents

- **Getting Started** — Arrival checklist, orientation tips, what to bring
- **Campus Life** — Dorms, dining hall, facilities, laundry, Wi-Fi & VPN
- **Academics** — IB tips, CAS ideas, study spots, teacher advice
- **Food & Dining** — On-campus meals, nearby restaurants, food delivery apps (Meituan, Eleme)
- **Transportation** — Getting to/from campus, Didi, metro, trains, airport transfers
- **Shopping & Essentials** — Taobao/JD basics, campus store, nearby malls
- **Apps & Tech** — Must-have apps (WeChat, Alipay, Baidu Maps, VPN setup)
- **Health & Wellbeing** — School nurse, nearby hospitals, mental health resources
- **Money & Banking** — Setting up Alipay/WeChat Pay, bank accounts, currency tips
- **Culture & Language** — Basic Mandarin phrases, cultural tips, local customs
- **Travel & Exploration** — Weekend trips, Suzhou, Shanghai, Kunshan Old Town
- **Tips from Alumni** — Lessons learned, things we wish we knew

## Contributing

This guide is only as good as the community behind it. Contributions are welcome!

1. Fork this repository
2. Create a branch (`git checkout -b add-your-topic`)
3. Add or update content
4. Submit a pull request

Whether it's a restaurant recommendation, a survival tip, or a correction — every contribution helps the next generation of UWC Changshu China students.

By submitting source code or configuration changes, you agree that those contributions may be distributed under the MIT License. By submitting guide text, portraits, photos, images, or other non-code material, you agree that those contributions may be published under the content-rights policy described in [CONTENT_LICENSE.md](CONTENT_LICENSE.md).

## Serve Locally

This site is a Jekyll project stored in the `website/` directory.

1. Install Ruby `3.2.2`. On macOS, `rbenv` is recommended.
2. Install the site dependencies from the repository root:

```bash
./script/bootstrap
```

3. Start the local development server:

```bash
./script/serve
```

4. Open `http://127.0.0.1:4000/UWC-Survival-Guide/` in your browser.

Jekyll watches for changes automatically, so edits inside `website/` will rebuild on save.

If you prefer the manual commands, run them from `website/` with `rbenv exec`:

```bash
cd website
rbenv exec bundle install
rbenv exec bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

## Deploy to GitHub Pages

This site is built with Jekyll and published from the `/website` directory on GitHub Pages.

1. Push this repo to GitHub
2. Go to **Settings** > **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Choose `main` branch and `/website` folder
5. Click **Save**
6. Your site will be live at `https://<your-username>.github.io/UWC-Survival-Guide/`

### File structure

```
website/
  ├── _config.yml   ← Jekyll configuration
  ├── _guides/
  │   ├── default/  ← English guides
  │   └── chinese/  ← Chinese guides using -CN / -TW filenames
  ├── _layouts/     ← page layouts
  ├── _includes/    ← shared partials
  ├── assets/       ← CSS, JS, images
  └── index.html    ← landing page
firebase/
  ├── firestore.rules       ← Firestore security rules
  ├── firestore.indexes.json ← Composite index definitions
  └── storage.rules         ← Firebase Storage security rules
firebase.json   ← Firebase CLI configuration (emulator ports, rule paths)
.firebaserc     ← Firebase project alias (uwc-survival-guide)
```

`auto-translator/` contains a small CLI that scans `default/` and `chinese/` and creates any missing English, Simplified Chinese, or Taiwan Traditional variants with the OpenAI API. It now defaults to `gpt-5.4`, uses a dedicated translation prompt file, and prefers the Simplified Chinese source when regenerating English or Taiwan Traditional guides.

Run it from the repository root with:

```bash
./script/translate --dry-run
./script/translate
```

The helper script executes the translator with `uv run python` inside `auto-translator/`.

## Tests

This project has two test suites — Cloud Functions unit tests and site validation tests — both using Jest.

```bash
./script/test              # run all tests (functions + site validation)
```

You can also run each suite individually:

```bash
cd functions && npx jest --verbose   # Cloud Functions helpers and callable functions
cd tests && npx jest --verbose       # site content, config, templates, i18n, security rules
```

Install dependencies before the first run:

```bash
cd functions && npm install
cd tests && npm install
```

Tests also run automatically in CI on every push to `main` (see `.github/workflows/deploy.yml`).

## Firebase

This project uses Firebase for authentication, Firestore (database), and Storage (avatars). The admin portal at `/admin` connects to the production Firebase project `uwc-survival-guide`.

### Prerequisites

Install the Firebase CLI (requires Node.js):

```bash
brew install node
npm install -g firebase-tools
firebase login
```

### Deploy database rules and indexes

Whenever you edit files in `firebase/`, deploy them to production:

```bash
firebase deploy --only firestore         # rules + indexes
firebase deploy --only firestore:rules   # rules only
firebase deploy --only firestore:indexes # indexes only
firebase deploy --only storage           # storage rules
```

### Local emulator (optional)

To test against an isolated local database instead of production:

```bash
./script/firebase          # fresh empty database each run
./script/firebase --export # persist local data between runs (saved to .firebase-data/)
./script/firebase --import # restore previously saved data
```

Emulator endpoints:

| Service   | URL                        |
|-----------|----------------------------|
| UI dashboard | http://localhost:4010   |
| Auth      | http://localhost:9099       |
| Firestore | http://localhost:8080       |
| Storage   | http://localhost:9199       |

> **Note:** The site always connects to the production Firebase when running locally via `./script/serve`. The emulator is a fully separate database — it does not sync with or affect production data.

## Disclaimer

This is an unofficial, student-maintained guide. Information may become outdated. Always verify critical details (visa requirements, school policies, etc.) with official UWC Changshu China channels.

## License

The source code and configuration files for this project are available under the [MIT License](LICENSE).

Unless otherwise noted, the original guide text, editorial content, contributor portraits, profile photos, photographs, and other media assets in this repository are copyright their respective authors and contributors. These materials are not licensed under MIT and may not be reproduced, redistributed, adapted, or republished without prior written permission. See [CONTENT_LICENSE.md](CONTENT_LICENSE.md).

---

*Made with love by UWC Changshu China students, for UWC Changshu China students.*
