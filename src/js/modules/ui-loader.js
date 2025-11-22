import { on } from '../utils/_fn';

export function initLoader() {
  /* ----------------------------------- [START] Loader 移除 */
  var loaderRemove = function () {
    var loader = document.querySelector('#loader');
    window.loader = loader; // 加到 window 上

    pageLoaded();
  };
  on(window, 'load', loaderRemove);

  /* 頁面可呼叫的 function -------- */
  /* 開啟 Loading */
  const pageLoading = function () {
    if (window.loader) {
      window.loader.classList.remove('is-loaded');
      document.body.appendChild(window.loader);
    }
  };

  /* 關閉 Loading */
  const pageLoaded = function () {
    if (window.loader) {
      window.loader.classList.add('is-loaded');
      setTimeout(function () {
        window.loader.remove();
      }, 2000);
    }
  };

  window.pageLoading = pageLoading;
  window.pageLoaded = pageLoaded;
  /* ----------------------------------- [END] Loader 移除 */
}
