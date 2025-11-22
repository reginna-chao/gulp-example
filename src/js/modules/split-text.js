import { on } from "../utils/_fn";

(function (window, document) {
  // Ref: https://codepen.io/asuka-inoue/pen/OJBwVzO
  // 將文字以 span tag 分割
  function initSplitText() {
    const splitTarget = document.querySelectorAll('.js-split-text');
    const regex = /<br\s*(?:\/?>|[^>]*)>/; // 可取得<br>, <br/>, <br class="any-class">
    let newTextGroup = '';
    splitTarget.forEach((target) => {
      let spanText = target.innerHTML; // 取得文字

      const textGroup = spanText.split(regex); // 以<br>為分界(避免內容有<br>)

      textGroup.forEach((text) => {
        newTextGroup = '';
        [...text].forEach((char) => {
          newTextGroup += '<span>' + char + '</span>';
        });
        const regex = new RegExp(text, 'g');
        spanText = spanText.replace(regex, newTextGroup);
      });

      target.innerHTML = spanText;
    });
  }
  on(window, 'load', initSplitText);
})(window, document);
