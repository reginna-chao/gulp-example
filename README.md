# 範本（專案名稱） - 前端開發 - Gulp

前端開發 無框架版本

### 日期紀錄

```
2021/XX/XX by Reginna - 工作內容
```

### 測試站網址

- 專案名稱（純靜態測試站）： [專案測試站網址](專案測試站網址)

### 特別注意事項

- 範例特別事項

> 版控相關是否有應注意事項

### 啟動與架構

##### 架構資訊

1. 使用 PUG 生成（HTML 架構）：PUG
1. 可使用自製 iconFont，詳細運用見 gulpfile.js
   - 參考 iconfont 生成後的 html，請在網址列後加入`/fonts/icons/`）[範例（需啟動 gulp）](http://localhost:3000/fonts/icons/)
1. 使用 ESLint，統一 JS 格式寫法；使用 Stylelint 與 sass-lint，統一 SCSS 與 SASS 格式寫法
   - ESLint - VSCode 要安裝相關套件 [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
   - Stylelint - VSCode 要安裝相關套件 [stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint)，`.scss` 格式檢測
   - Sass Lint - VSCode 要安裝相關套件 [Sass Lint](https://marketplace.visualstudio.com/items?itemName=glen-84.sass-lint)，`.sass` 格式檢測
1. Foundation JS 嘗試使用載入 Component 形式，見 \_layout.pug 下方 JS 區塊
   使用時，需依照此步驟：
   - 開啟相關的 CSS (見 `src/sass/foundation/_foundation.scss` 設定）
   - 開啟相關的 JS (見 `src/_layout.pug` 設定）
     ※須查詢所使用的套件含有什麼基本的檔案（檔案為 `_foundation.util` 開頭者）
     例如：[Tooltip，查詢 Javascript Reference](https://get.foundation/sites/docs/tooltip.html#javascript-reference)，有使用 util.box.js、util.mediaQuery.js、util.triggers.js
1. JS 啟動：因為一般套件有用 `async` 延後載入，所以啟動要在 `window.onload` 以後，如：

```
$(window).on('load', function() {
$(document).foundation();
})
```

##### 版本資訊

```diff
// Node version v10.15.1
// NPM version V6.4.1
// Gulp version v2.2.0
// Gulp CLI version v4.0.2
```

##### 安裝與啟動

※於命令提示自字元輸入指令

1. 安裝 `$ npm i`
2. 啟動 `$ gulp`

### 使用外掛列表

- [JQuery 3.6.0](https://code.jquery.com/jquery/) - jQuery 版本
- [easeScroll 改良版](https://github.com/ivmello/easeScroll) - 平滑滾動改良版（修正 Chrome passtive: true 錯誤、改為純 JavaScript） | by ivmello
- [Vanilla LazyLoad 17.8.1](https://github.com/verlok/vanilla-lazyload) - 延遲載入圖片 | by Verlok

> 請將有使用的外掛套件撰寫於此

### 注意事項

1. Pug 編譯時要確認全頁空格數、空格類型是一致的（統一為 Tab；統一為空格），否則可能會造成編譯錯誤，推薦使用：

   ```
       空格：4
       使用 Tab 進行排版
   ```

   ※使用 VSCode 的人建議將下列項目設定快捷鍵，開啟「鍵盤快速鍵」(Windows: Ctrl+K Ctrl+S | Mac 自行查閱)：

   - 「將縮排轉換成定位點」：全頁轉為 Tab
   - 「將縮排轉換成空格」：全頁轉為空白
   - 「檢視: 切換轉譯空白字元」：顯示/隱藏 空白跟定位點

> 專案注意事項寫於此

### 檔案說明

##### -------------------- SASS --------------------

- 使用[BEM 命名](http://getbem.com/)方式，或是將選取器的層級數減少(EX: .el > ul > li > a => .el a)
- 檔案大致功能：
  - 頁面分法與規則見 `src/sass/style.sass`
  - 多頁共用樣式放置於 `src/sass/layout/_common.sass`
  - Layout 樣式放置於 `src/sass/layout/_layout.sass`
  - Layout 相關其餘項目放置於 `src/sass/layout/` 資料夾內
  - 外掛套件樣式放置於 `src/sass/vendor/` 資料夾內
- 主要網頁 breakpoint (或參考 Foundation 文件)：尺寸請看 `sass/foundation/setting/setting.scss`
- 整體項目設定包含：h1-h6 字體、字級、顏色、breakpoint、主要顯示寬度範圍...等基礎設定，整體設置顏色與字體大小放在 `sass/foundation/setting/setting.scss` 、 `src/sass/layout/_common.sass`
- 如果想要增減 foundation 的項目開啟，請使用 `sass/foundation/foundation.scss`
- 各單元 SCSS 通用元素置於檔案頂部
- [切版規範](https://drive.google.com/open?id=0B-95R-GtK6XNM1dVZlVlS2xnSEVTS0Z5YnRJZllwa1d1LUJv) - 其他整體事項請參考

##### -------------------- JS --------------------

- JS 資料夾外層請放置各個頁面檔案配合 JS
- `src/js/vendor/` 裡頭請放置專案用的外掛或是套件檔案
  （沒壓縮或有壓縮檔皆可放置，Gulp 編譯會自動判斷並產出 `.min` 檔案，建議 js 頁面載入時請統一載入壓縮 `.min` 檔）
- JS 檔案已兼容 ES6 以及 ES5 可在檔案內撰寫，Gulp 編譯後會自動產生 ES5 語法

---

### 相關文件

##### 設計部提供

- 內部切版進度：[文件名稱](文件網址，此為範例網站，請首次切整體Layout的前端工程師，更換正確連結)
  以上進度請開放權限給 **「老大、莉莉安、Evonne、設計主管、PM 主管、該專案 PM」**

> 設計部提供寫於此

##### PM/UX 提供

- [專案資料夾](專案資料夾網址)
- [專案前端規格\_和泰產險官網網站](前端規格網址)
- [WF](WF網址)
- [SIT](SIT網址)

> PM/UX 提供寫於此

##### 其他

1. [Markdown Editor - 線上編輯 ReadMe.md 檔案顯示](https://jbt.github.io/markdown-editor/)
1. [DILLINGER - 線上編輯 ReadMe.md 檔案顯示](https://dillinger.io/)
1. [HTML 轉 PUG](https://html2pug.now.sh/)
