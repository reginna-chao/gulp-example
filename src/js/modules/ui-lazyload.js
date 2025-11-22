import { on } from '../utils/_fn';
import LazyLoad from '../vendor/lazyload.min.js';

export function initLazyLoad() {
  /* ---------------------------------------- [START] Lazyload */
  /*
   * 使用：https://github.com/verlok/vanilla-lazyload
   * 尋找頁面上的 .lazy 為執行 Lazy Load 物件
   */
  function buildLazyLoad() {
    // 確保 window.LazyLoad 存在 (如果 vendor 裡有掛載到 window)
    // 這裡我們直接 import 了，所以其實可以直接用 LazyLoad class
    // 但為了保持原邏輯的相容性，我們保留檢查機制，或者直接 new

    // 原本邏輯是檢查 window.LazyLoad，因為它是全域引入的
    // 現在我們是 module import，所以直接用 imported 的 LazyLoad 即可

    new LazyLoad({
      // Your custom settings go here
    });
  }

  window.LazyLoad = LazyLoad;

  on(window, 'load', buildLazyLoad);
  /* ---------------------------------------- [END] Lazyload */
}
