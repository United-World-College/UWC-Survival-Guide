# UWC 常熟生存指南

[English](./README.md) | [简体中文](./README_CN.md) | [繁體中文](./README_TW.md)

一份由學生社群共同編寫的**世界聯合學院常熟校區 (UWC Changshu China)** 生存指南——涵蓋你在校園內外所需的一切資訊。

## 關於本指南

來到 UWC 常熟可能會讓人不知所措——新的國家、新的文化、新的體制。這份指南由學生編寫，為學生服務，幫助你適應在江蘇省昆山/常熟的 UWC Changshu China 的日常生活、學業以及方方面面。

## 主編

- William Huang 黃靖然 (University of Illinois Urbana-Champaign, UWC Changshu China 24')
- Tom Li 李東源 (University of Florida, UWC Changshu China 24')
- E_P_silon (UWC Changshu China 24')

## 目錄

- **入學準備** — 到校清單、迎新指南、行李建議
- **校園生活** — 宿舍、食堂、設施、洗衣、Wi-Fi 與 VPN
- **學術** — IB 學習技巧、CAS 創意、自習地點、老師建議
- **美食與餐飲** — 校內餐飲、周邊餐廳、外賣 App（美團、餓了麼）
- **交通出行** — 往返校園、滴滴出行、地鐵、火車、機場接送
- **購物與日用** — 淘寶/京東入門、校內商店、周邊商場
- **必備 App 與科技** — 必裝應用（微信、支付寶、百度地圖、VPN 設置）
- **健康與身心** — 校醫、附近醫院、心理健康資源
- **資金與銀行** — 支付寶/微信支付開通、銀行開戶、貨幣小貼士
- **文化與語言** — 基礎中文短語、文化提示、本地習俗
- **旅行與探索** — 周末出遊、蘇州、上海、昆山古鎮
- **校友寄語** — 經驗教訓、我們希望當初就知道的事

## 參與貢獻

這份指南的價值來自於社群的每一份貢獻，歡迎參與！

1. Fork 本倉庫
2. 創建分支 (`git checkout -b add-your-topic`)
3. 添加或更新內容
4. 提交 Pull Request

無論是餐廳推薦、生存技巧還是內容糾錯——每一份貢獻都能幫助下一屆 UWC Changshu China 的同學們。

提交原始碼或設定檔修改，即表示你同意這些程式碼類貢獻可按 MIT 許可證發布；提交指南正文、頭像、照片、圖片或其他非程式碼內容，即表示你同意這些內容按 [內容版權說明](CONTENT_LICENSE.md) 所述方式發布。

## 本地啟動

本網站是位於 `website/` 目錄下的 Jekyll 專案。

1. 安裝 Ruby `3.2.2`。macOS 上建議使用 `rbenv`。
2. 在倉庫根目錄安裝相依套件：

```bash
./script/bootstrap
```

3. 啟動本地開發伺服器：

```bash
./script/serve
```

4. 在瀏覽器中開啟 `http://127.0.0.1:4000/UWC-Survival-Guide/`。

儲存 `website/` 下的檔案後，Jekyll 會自動重新產生網站。

如果你想手動執行命令，請先進入 `website/`，並使用 `rbenv exec`：

```bash
cd website
rbenv exec bundle install
rbenv exec bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

## 檔案結構

```
website/
  ├── _config.yml          ← Jekyll 設定
  ├── _guides/
  │   ├── default/         ← 英文指南
  │   └── chinese/         ← 中文指南（-CN / -TW 後綴）
  ├── _layouts/            ← 頁面版型
  ├── _includes/           ← 共用元件
  ├── assets/              ← CSS、JS、圖片
  └── index.html           ← 首頁
firebase/
  ├── firestore.rules       ← Firestore 安全規則
  ├── firestore.indexes.json ← 複合索引定義
  └── storage.rules         ← Firebase Storage 安全規則
firebase.json   ← Firebase CLI 設定（模擬器埠號、規則路徑）
.firebaserc     ← Firebase 專案別名（uwc-survival-guide）
```

## 測試

本專案包含兩套測試——Cloud Functions 單元測試和網站驗證測試——均使用 Jest。

```bash
./script/test              # 執行所有測試（Functions + 網站驗證）
```

也可以分別執行：

```bash
cd functions && npx jest --verbose   # Cloud Functions 輔助函式和可呼叫函式
cd tests && npx jest --verbose       # 網站內容、設定、範本、國際化、安全規則
```

首次執行前安裝相依套件：

```bash
cd functions && npm install
cd tests && npm install
```

每次推送到 `main` 分支時，CI 也會自動執行測試（參見 `.github/workflows/deploy.yml`）。

## Firebase

本專案使用 Firebase 進行身份驗證、Firestore（資料庫）和 Storage（頭貼）。`/admin` 管理後台連線至正式 Firebase 專案 `uwc-survival-guide`。

### 前置條件

安裝 Firebase CLI（需要 Node.js）：

```bash
brew install node
npm install -g firebase-tools
firebase login
```

### 部署資料庫規則與索引

修改 `firebase/` 中的檔案後，部署至正式環境：

```bash
firebase deploy --only firestore         # 規則 + 索引
firebase deploy --only firestore:rules   # 僅規則
firebase deploy --only firestore:indexes # 僅索引
firebase deploy --only storage           # Storage 規則
```

### 本地模擬器（選用）

如需在不影響正式資料的情況下測試，可啟動本地獨立資料庫：

```bash
./script/firebase          # 每次執行使用全新空資料庫
./script/firebase --export # 持久化本地資料（儲存至 .firebase-data/）
./script/firebase --import # 還原上次儲存的資料
```

| 服務 | 網址 |
|------|------|
| 控制台 | http://localhost:4010 |
| Auth | http://localhost:9099 |
| Firestore | http://localhost:8080 |
| Storage | http://localhost:9199 |

> **注意：** 使用 `./script/serve` 本地啟動時，網站始終連線正式 Firebase。本地模擬器是完全獨立的資料庫，不會與正式資料同步。

## 免責聲明

本指南為非官方、由學生維護的項目。資訊可能會過時，請務必通過 UWC Changshu China 官方渠道核實重要資訊（如簽證要求、學校政策等）。

## 許可證

本項目中的原始碼與設定檔採用 [MIT 許可證](LICENSE)。

除非另有說明，本倉庫中的原創指南正文、編輯性內容、貢獻者頭像、個人照片、攝影作品及其他媒體素材，其版權歸各自作者與貢獻者所有，不適用 MIT 許可證。未經事先書面許可，不得轉載、再散布、改編或再次發布。詳見 [內容版權說明](CONTENT_LICENSE.md)。

---

*由 UWC 常熟學生用心編寫，獻給 UWC 常熟的每一位同學。*
