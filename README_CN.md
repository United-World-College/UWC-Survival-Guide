# UWC 常熟生存指南

[English](./README.md) | [简体中文](./README_CN.md) | [繁體中文](./README_TW.md)

一份由学生社区共同编写的**[世界联合学院常熟校区 (UWC Changshu China)](https://en.wikipedia.org/wiki/United_World_College_Changshu_China)** 生存指南——涵盖你在校园内外所需的一切信息。

## 关于本指南

来到 UWC 常熟可能会让人不知所措——新的国家、新的文化、新的体制。这份指南由学生编写，为学生服务，帮助你适应在江苏省昆山/常熟的 UWC Changshu China 的日常生活、学业以及方方面面。

## 主编

- William Huang 黄靖然 (University of Illinois Urbana-Champaign, UWC Changshu China 24')
- Tom Li 李东源 (University of Florida, UWC Changshu China 24')
- E_P_silon (Columbia University, UWC Changshu China 24')

## 目录

- **入学准备** — 到校清单、迎新指南、行李建议
- **校园生活** — 宿舍、食堂、设施、洗衣、Wi-Fi 与 VPN
- **学术** — IB 学习技巧、CAS 创意、自习地点、老师建议
- **美食与餐饮** — 校内餐饮、周边餐厅、外卖 App（美团、饿了么）
- **交通出行** — 往返校园、滴滴出行、地铁、火车、机场接送
- **购物与日用** — 淘宝/京东入门、校内商店、周边商场
- **必备 App 与科技** — 必装应用（微信、支付宝、百度地图、VPN 设置）
- **健康与身心** — 校医、附近医院、心理健康资源
- **资金与银行** — 支付宝/微信支付开通、银行开户、货币小贴士
- **文化与语言** — 基础中文短语、文化提示、本地习俗
- **旅行与探索** — 周末出游、苏州、上海、昆山古镇
- **校友寄语** — 经验教训、我们希望当初就知道的事

## 参与贡献

这份指南的价值来自于社区的每一份贡献，欢迎参与！

1. Fork 本仓库
2. 创建分支 (`git checkout -b add-your-topic`)
3. 添加或更新内容
4. 提交 Pull Request

无论是餐厅推荐、生存技巧还是内容纠错——每一份贡献都能帮助下一届 UWC Changshu China 的同学们。

提交源码或配置文件修改，即表示你同意这些代码类贡献可按 MIT 许可证发布；提交指南正文、头像、照片、图片或其他非代码内容，即表示你同意这些内容按 [内容版权说明](CONTENT_LICENSE.md) 所述方式发布。

## 本地运行

本网站是位于 `website/` 目录下的 Jekyll 项目。

1. 安装 Ruby `3.2.2`。macOS 上推荐使用 `rbenv`。
2. 在仓库根目录安装依赖：

```bash
./script/bootstrap
```

3. 启动本地开发服务器：

```bash
./script/serve
```

4. 在浏览器中打开 `http://127.0.0.1:4000/UWC-Survival-Guide/`。

保存 `website/` 下的文件后，Jekyll 会自动重新生成站点。

如果你更想手动运行命令，请先进入 `website/`，并使用 `rbenv exec`：

```bash
cd website
rbenv exec bundle install
rbenv exec bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

## 文件结构

```
website/
  ├── _config.yml          ← Jekyll 配置
  ├── _guides/
  │   ├── default/         ← 英文指南
  │   └── chinese/         ← 中文指南（-CN / -TW 后缀）
  ├── _layouts/            ← 页面布局
  ├── _includes/           ← 公共组件
  ├── assets/              ← CSS、JS、图片
  └── index.html           ← 首页
firebase/
  ├── firestore.rules       ← Firestore 安全规则
  ├── firestore.indexes.json ← 复合索引定义
  └── storage.rules         ← Firebase Storage 安全规则
firebase.json   ← Firebase CLI 配置（模拟器端口、规则路径）
.firebaserc     ← Firebase 项目别名（uwc-survival-guide）
```

`auto-translator/` 是一个小型 CLI 工具，扫描 `default/` 和 `chinese/` 目录，调用 Google Gemini API 自动创建缺失的英文、简体中文或台湾繁体翻译。默认使用 `gemini-2.5-flash` 模型（可通过 `GEMINI_MODEL` 或 `--model` 覆盖），配合专用翻译提示文件，并优先以简体中文原文作为翻译源。`GEMINI_API_KEY` 从仓库根目录的 `.env` 读取。

从仓库根目录运行：

```bash
./script/translate --dry-run
./script/translate
```

该脚本通过 `uv run python` 在 `auto-translator/` 目录下执行翻译器。

当编辑在管理后台审批通过一篇文章时，Cloud Functions 也会自动调用 Gemini 将该文章翻译为其余两种语言并推送到 GitHub。要启用此功能，需要在 Firestore 的 `config/gemini` 文档中设置 `apiKey` 字段为你的 Gemini API 密钥。

## 测试

本项目包含两套测试——Cloud Functions 单元测试和站点验证测试——均使用 Jest。

```bash
./script/test              # 运行所有测试（Functions + 站点验证）
```

也可以分别运行：

```bash
cd functions && npx jest --verbose   # Cloud Functions 单元测试
cd tests && npx jest --verbose       # 站点验证测试
```

首次运行前安装依赖：

```bash
cd functions && npm install
cd tests && npm install
```

每次推送到 `main` 分支时，CI 也会自动运行测试（参见 `.github/workflows/deploy.yml`）。

### Cloud Functions 测试 (`functions/__tests__/`)

| 文件 | 测试内容 |
|------|---------|
| `helpers.test.js` | 纯辅助函数：`makeSlug`、`makeAuthorSlug`、`toBase64`、`generateMarkdown`、`getAuthorKey`、`getOrderedSubmissionAuthors`、`sanitizeRevisionHistory` |
| `functions.test.js` | 可调用 Cloud Functions（模拟 Firestore、Auth、GitHub 和 R2）：`checkAdminStatus`、`submitArticle`、`resubmitArticle`、`approveSubmission`、`rejectSubmission`、`requestRevision`、`deleteSubmission`（含 R2 图片清理）、`uploadArticleImage`、`deleteArticleImage`、`getServiceUsage`、`onUserDisplayNameChange` |
| `translation.test.js` | 自动翻译辅助函数：Gemini `RESPONSE_SCHEMA` 验证、`STYLE_NOTES`/`PROMPT_NAMES` 语言覆盖、`buildTranslationPrompt` 所有语言对测试、`buildTranslatedMarkdown` 三种语言输出 |
| `notify.test.js` | 新投稿和重投触发的管理员邮件通知 `notifyAdminsOfSubmission`（模拟 nodemailer 与管理员白名单），覆盖邮件主题和后台 deep-link |

### 站点验证测试 (`tests/`)

| 文件 | 测试内容 |
|------|---------|
| `site-guides.test.js` | 指南 Markdown front matter 字段、语言代码、文件命名规范、重复检测、三语翻译完整性 |
| `site-authors.test.js` | 作者页 front matter、三语变体要求、`translation_key` 一致性、`about.yml` 数据验证 |
| `site-config.test.js` | Jekyll 配置、Firebase 配置、项目结构验证 |
| `site-templates.test.js` | Jekyll 模板文件的必要元素和模式检查 |
| `site-i18n.test.js` | 国际化完整性：英文 locale 中的每个 key 必须同时存在于 zh-CN 和 zh-TW |
| `site-admin-js.test.js` | 管理页面内联 JavaScript 语法验证、显示名称规则、slug 规范化、投稿查询弹性 |
| `site-rules-logic.test.js` | Firestore 安全规则逻辑验证（通过解析规则文件） |

## Firebase

本项目使用 Firebase 进行身份验证、Firestore（数据库）和 Storage（头像）。`/admin` 管理后台连接到生产环境的 Firebase 项目 `uwc-survival-guide`。

### 前置条件

安装 Firebase CLI（需要 Node.js）：

```bash
brew install node
npm install -g firebase-tools
firebase login
```

### 部署数据库规则与索引

修改 `firebase/` 中的文件后，将其部署到生产环境：

```bash
firebase deploy --only firestore         # 规则 + 索引
firebase deploy --only firestore:rules   # 仅规则
firebase deploy --only firestore:indexes # 仅索引
firebase deploy --only storage           # Storage 规则
```

### 本地模拟器（可选）

如需在不影响生产数据的情况下测试，可启动本地独立数据库：

```bash
./script/firebase          # 每次运行使用全新空数据库
./script/firebase --export # 持久化本地数据（保存至 .firebase-data/）
./script/firebase --import # 恢复上次保存的数据
```

| 服务 | 地址 |
|------|------|
| 控制台 | http://localhost:4010 |
| Auth | http://localhost:9099 |
| Firestore | http://localhost:8080 |
| Storage | http://localhost:9199 |

> **注意：** 使用 `./script/serve` 本地运行时，网站始终连接生产环境 Firebase。本地模拟器是完全独立的数据库，不会与生产数据同步。

## 免责声明

本指南为非官方、由学生维护的项目。信息可能会过时，请务必通过 UWC Changshu China 官方渠道核实重要信息（如签证要求、学校政策等）。

## 许可证

本项目中的源码与配置文件采用 [MIT 许可证](LICENSE)。

除非另有说明，本仓库中的原创指南正文、编辑性内容、贡献者头像、个人照片、摄影作品及其他媒体素材，其版权归各自作者与贡献者所有，不适用 MIT 许可证。未经事先书面许可，不得转载、再分发、改编或再次发布。详见 [内容版权说明](CONTENT_LICENSE.md)。

---

*由 UWC 常熟学生用心编写，献给 UWC 常熟的每一位同学。*
