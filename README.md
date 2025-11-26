# Gulp 5 前端自動化開發範本

這是一個基於 Gulp 5 的前端自動化開發範本，旨在簡化開發流程並提供現代化的開發體驗。整合了 SASS、ES6+、Pug 等工具，並包含自動化圖片壓縮與 Iconfont 生成功能。

## 📋 專案資訊

**專案名稱**：（請在此填入實際專案名稱）

- **測試站網址**：[專案測試站網址](專案測試站網址)
- **專案資料夾**：[專案資料夾網址](專案資料夾網址)
- **專案進度管理表**：[專案進度管理表網址](專案進度管理表網址)
- **Wireframe**：[WF網址](WF網址)
- **SIT**：[SIT網址](SIT網址)

## ✨ 特色功能

-   **樣式處理**: 支援 SASS (SCSS) 編譯，並透過 Autoprefixer 自動添加瀏覽器前綴。
-   **腳本打包**: 使用 Rollup 配合 Babel 進行 JavaScript 打包與轉譯 (ES6+ to ES5)。
-   **模板引擎**: 支援 Pug (Jade) 模板語言，讓 HTML 撰寫更簡潔。
-   **圖片優化**: 自動壓縮圖片 (Mozjpeg, Pngquant)，支援開發模式背景執行壓縮，不阻塞開發流程。
-   **圖示字型**: 支援 SVG 轉 Iconfont 自動生成。
-   **即時預覽**: 整合 BrowserSync，存檔即自動重新整理瀏覽器。
-   **程式碼品質**: 內建 ESLint 與 Stylelint，確保程式碼風格一致性。

## 🚀 快速開始

### 版本資訊

```diff
// Node version v18+ (建議使用 18.x LTS 或更高版本)
// NPM version V10.9.4
// Gulp version v5.0.1
```

### 前置需求

請確保您的電腦已安裝 [Node.js](https://nodejs.org/) (需要 18.0.0 或更高版本)。

### 安裝

複製專案後，在專案根目錄執行以下指令安裝相依套件：

```bash
npm install
```

### 使用指令

#### 開發模式 (Development)

啟動開發伺服器，開啟 Watch 模式進行即時預覽。此模式下圖片會先快速複製，壓縮作業會在背景執行。

```bash
npm start
# 或
gulp
```

#### 建置開發版本 (Build Dev)

編譯專案但不進行壓縮 (適用於除錯或測試)。

```bash
npm run build:dev
```

#### 建置生產版本 (Build Prod)

執行完整的編譯流程，包含程式碼壓縮與圖片最佳化 (適用於正式上線)。

```bash
npm run build:prod
```

## 📂 專案結構

-   `src/`: 原始碼目錄
    -   `sass/`: 樣式檔 (.scss)
    -   `js/`: 腳本檔 (.js)
    -   `pug/`: 模板檔 (.pug)
    -   `images/`: 圖片檔
    -   `images/font_svg`: Icon Font ([預覽/fonts/icons（需啟動 gulp）](http://localhost:3000/fonts/icons/))
    -   `fonts/`: 字型檔
-   `dist/`: 編譯後的輸出目錄 (請勿直接編輯此目錄內容)
-   `gulp/`: Gulp 任務設定檔

## 📝 程式碼規範

本專案使用以下工具進行程式碼檢查：

-   **JavaScript**: [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) (搭配 Prettier)
-   **CSS/SCSS**: [stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint) (搭配 Prettier)

執行檢查：

```bash
npm run lint      # 檢查樣式
npm run lint:fix  # 自動修復樣式錯誤
```

### 注意事項

#### PUG

1. Pug 編譯時要確認全頁空格數、空格類型是一致的（統一為 Tab；統一為空格），否則可能會造成編譯錯誤，推薦使用：

   ```
    空格：4
    使用 Space 進行排版
   ```

   ※使用 VSCode 的人建議將下列項目設定快捷鍵，開啟「鍵盤快速鍵」(Windows: Ctrl+K Ctrl+S | Mac 自行查閱)：
   - 「將縮排轉換成定位點」：全頁轉為 Tab
   - 「將縮排轉換成空格」：全頁轉為空白
   - 「檢視: 切換轉譯空白字元」：顯示/隱藏 空白跟定位點

#### SASS

- 建議使用[BEM 命名](http://getbem.com/)方式，或是將選取器的層級數減少(EX: .el > ul > li > a => .el a)
- 檔案大致功能：
  - 頁面分法與規則見 `src/sass/all.scss`
  - 多頁共用樣式放置於 `src/sass/layout/_common.scss`
  - Layout 樣式放置於 `src/sass/layout/_layout.scss`
  - Layout 相關其餘項目放置於 `src/sass/layout/` 資料夾內
  - 外掛套件樣式放置於 `src/sass/vendor/` 資料夾內
- 各單元 SCSS 通用元素置於檔案頂部

#### JS

- JS 資料夾外層請放置各個頁面檔案配合 JS
- `src/js/static/`: 直接複製到 dist ，不會經過 Gulp 編譯
- `src/js/vendor/` 裡頭請放置專案用的外掛或是套件檔案，目前只會編譯要使用的項目，需要使用請在 lib-main import

---

## 🐳 Docker 快速開始

如果您不想在本機安裝 Node.js 或 Gulp，可以使用 Docker 來執行此專案。

### 前置需求

- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### 啟動方式

1. 確保 Docker Desktop 正在執行。
2. 在專案根目錄執行以下指令：

   ```bash
   docker-compose up
   ```

3. 等待安裝完成並啟動伺服器後，打開瀏覽器訪問 [http://localhost:3000](http://localhost:3000)。

### 注意事項

- 第一次執行時，Docker 會在容器內安裝 `node_modules`，這可能需要幾分鐘的時間。
- 為了避免本機的 `node_modules` 覆蓋容器內的依賴，我們使用了 Docker volume。您在本機不需要看到 `node_modules` 資料夾。
- 您在 `src/` 資料夾中的任何修改都會即時反映在瀏覽器中（Hot Reload）。
