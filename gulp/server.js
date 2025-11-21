import { create as browserSyncCreate } from 'browser-sync';

export const browserSync = browserSyncCreate(); // 建立同步虛擬伺服器

// browserSync
export function browsersyncInit(done) {
  browserSync.init({
    open: false, // 自動開啟瀏覽器
    notify: false, // 關閉瀏覽器右上角的通知
    ghostMode: false, // 是否同步各裝置瀏覽器滑動
    server: {
      baseDir: './dist',
      online: false,
    },
    // 使用 https 開發
    // Ref: https://ithelp.ithome.com.tw/articles/10230052
    // 1. 本機電腦產生憑證（電腦只要安裝一次）： $ mkcert -install
    // 2. 專案資料夾產生檔案： $ mkcert localhost 127.0.0.1 192.168.x.xxx ::1
    //    ※「192.168.x.xxx」要根據電腦不同更換
    // 3. 手機使用需另外安裝「1. 本機電腦產生憑證（電腦只要安裝一次）： $ mkcert -install」安裝的 rootCA.pem 檔案
    // ※↓要對照檔案名稱是否正確
    // https: {
    //   key: "localhost+3-key.pem",
    //   cert: "localhost+3.pem"
    // }
  });
  done();
}

// BrowserSync Reload
export function browsersyncReload(done) {
  browserSync.reload();
  done();
}
