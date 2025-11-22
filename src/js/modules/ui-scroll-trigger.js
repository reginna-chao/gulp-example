import { on, off, throttle, isInViewport } from '../utils/_fn';

export function initScrollTrigger() {
  /* ----------------------------------- [START] ScrollTriggerAni */
  // 有滑動到該區增加動態者增加class "js-ani" ， 滑動到該區增加class "is-animated"
  // 用套件也好，換其它習慣方式也罷，請達成↑目的
  let aniSec = document.querySelectorAll('.js-ani');
  const scrollTriggerAniThrottle = throttle(scrollTriggerAni, 200, 500); // 節流作用

  function scrollTriggerAni() {
    for (var i = 0; i < aniSec.length; i++) {
      if (isInViewport(aniSec[i])) {
        aniSec[i].classList.add('is-animated');
      }
    }

    cleanTrigger();

    /* If load all of the item, stop Listener */
    if (aniSec.length === 0) {
      off(window, 'scroll', scrollTriggerAniThrottle);
    }
  }

  function cleanTrigger() {
    aniSec = Array.prototype.filter.call(aniSec, function (ani) {
      return !ani.classList.contains('is-animated');
    });
  }

  on(window, 'load', scrollTriggerAni);
  on(window, 'scroll', scrollTriggerAniThrottle);
  /* ----------------------------------- [END] ScrollTriggerAni */
}
