import { on } from '../utils/_fn';

export function initGoTop() {
  // ------------------------------- [START] GoTop
  /* Go Top Click */
  var goTop = document.querySelector('#go-top');
  if (goTop) {
    on(goTop, 'click', function (e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });

      // 嘗試聚焦到頁面第一個連結，增強無障礙體驗
      // 為了避免立即聚焦導致滾動中斷或視覺跳動，可以加一點延遲或在滾動結束後執行
      // 但原生 scrollTo 沒有 callback，簡單處理即可
      goTop.blur();
      var firstLink = document.querySelector('a');
      if (firstLink) {
        firstLink.focus();
        firstLink.blur();
      }
    });
  }
  // ------------------------------- [END] GoTop
}
