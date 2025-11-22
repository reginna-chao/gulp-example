import { on, throttle } from '../utils/_fn';

export function initStickyFooter() {
  /* ---------------------------------------- [START] 右下固定功能 */
  const stickyTarget = document.getElementById('fast-ser');
  const ftBottomRight = document.querySelector('.ft-bottom__r');

  if (!stickyTarget || !ftBottomRight) return;

  let offsetBottom = 0;
  let bottom = 0;
  let wh = window.innerHeight;

  const updateDims = () => {
    wh = window.innerHeight;
  };
  on(window, 'resize', throttle(updateDims, 50, 100));

  const breakpoint = window.matchMedia('(min-width: 640px)');

  const getPosTargetOffsetBottom = function () {
    const rect = ftBottomRight.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const ftBottomRightTop = rect.top + scrollTop;

    return ftBottomRightTop + ftBottomRight.offsetHeight / 2 + stickyTarget.offsetHeight / 2;
  };

  const setPosBottom = function () {
    offsetBottom = getPosTargetOffsetBottom();
    const bodyHeight = document.body.offsetHeight;
    bottom = bodyHeight - offsetBottom;
    stickyTarget.style.setProperty('--bottom', `${Math.round(bottom)}px`);
  };

  const scrollEvent = function () {
    const ws = window.pageYOffset || document.documentElement.scrollTop;
    if (!breakpoint.matches && ws + wh > getPosTargetOffsetBottom() + 30) {
      stickyTarget.classList.remove('is-fixed');
      return;
    }
    stickyTarget.classList.add('is-fixed');
  };

  const resizeEvent = function () {
    if (breakpoint.matches) {
      return;
    }
    setPosBottom();
  };

  setTimeout(() => {
    setPosBottom();
    on(window, 'resize', throttle(resizeEvent, 50, 100));
    on(window, 'scroll', throttle(scrollEvent, 10, 50));
  }, 500);
  /* ---------------------------------------- [END] 右下固定功能 */
}
