import { on, off, throttle } from '../utils/_fn';
import { windowStore } from '../stores/window-store';
import { isMobile } from './browser-detect';

export function initHeader() {
  const html = document.documentElement;

  // 使用 windowStore 取得視窗狀態
  let { ww, wh } = windowStore.getState();

  // 訂閱 windowStore 狀態變化
  windowStore.subscribe((state) => {
    ww = state.ww;
    wh = state.wh;
  });

  /* ---------------------------------------- [START] Header Main Menu */
  function initHdMenu() {
    // Hover 到子選單執行反映
    const isOpenClassname = 'menu-sub-open';
    document.querySelectorAll('.main-menu__item.has-sub').forEach((menuItem) => {
      menuItem.addEventListener('mouseenter', function () {
        if (ww > 1024) {
          html.classList.add(isOpenClassname);
        }
      });

      menuItem.addEventListener('mouseleave', function () {
        html.classList.remove(isOpenClassname);
      });
    });

    // 設定選單為螢幕高度
    const hdMenuEl = document.getElementById('hd-menu');
    if (!hdMenuEl) return;

    let whCache = wh;
    const setMenuHeight = function () {
      if (wh === whCache) {
        return;
      }
      whCache = wh;
      hdMenuEl.style.height = wh + 'px';
    };
    const setMenuHeightThrottle = throttle(setMenuHeight, 50, 100);
    const breakpoint = window.matchMedia('(min-width: 1024px)');
    const breakpointChecker = function () {
      if (breakpoint.matches) {
        // Large
        off(window, 'resize', setMenuHeightThrottle);
        hdMenuEl.style.height = '';
      } else {
        // Medium + Small
        setMenuHeightThrottle();
        on(window, 'resize', setMenuHeightThrottle);
      }
    };
    // Start
    breakpointChecker();
    breakpoint.addListener(breakpointChecker);
  }

  on(window, 'load', initHdMenu);
  /* ---------------------------------------- [END] Header Main Menu */

  /* ---------------------------------------- [START] 選單項目開啟關閉 */
  /* 選單項目開啟關閉(Header Menu, Footer Sitemap) */
  function ToggleMenu(el, ops) {
    var toggleMenuEl = document.querySelectorAll(el);
    const { disableSize, mutliExpand = true, callback } = ops;

    if (toggleMenuEl === undefined || toggleMenuEl === null || toggleMenuEl.length <= 0) return false;

    [].forEach.call(toggleMenuEl, function (el) {
      el.menu = {
        el: el,
        parent: el.parentElement,
        subLink: el.nextElementSibling ? el.nextElementSibling.querySelectorAll('a') : null,
        classOpen: 'is-open',
        classTl3d: 'translate3d',
        timer: null,
      };

      if (!el.menu.subLink) return false;

      on(el, 'click', function (event) {
        if (ww < disableSize && !el.classList.contains('is-native')) {
          // 停止原生事件(避免有連結的會跳轉)
          event.preventDefault();

          var selfMenu = this.menu;

          // Blur
          this.blur();

          // 開啟瀏覽器加速效能(transform3d(0,0,0))
          selfMenu.subLink.forEach((item) => {
            item.classList.add(selfMenu.classTl3d);
          });

          // Toggle open Class
          selfMenu.parent.classList.toggle(selfMenu.classOpen);

          // 清除transform3d
          if (selfMenu.timer !== null) clearTimeout(selfMenu.timer);
          selfMenu.timer = setTimeout(function () {
            selfMenu.subLink.forEach((item) => {
              item.classList.remove(selfMenu.classTl3d);
            });
          }, 1000);

          // 是否可以多重展開
          if (!mutliExpand && !this.parentElement.classList.contains(selfMenu.classOpen)) {
            /* 關閉 => 移除內部已開啟的物件 */
            this.parentElement.querySelectorAll('.' + selfMenu.classOpen).forEach((el) => {
              el.classList.remove(selfMenu.classOpen);
            });
          }

          if (typeof callback === 'function') {
            callback.call(this);
          }
        }
      });
    });
  }

  on(window, 'load', function () {
    /* Header Menu Open Second */
    new ToggleMenu('.main-menu__link', {
      disableSize: 1024,
    });

    /* PC 點選第一層按鈕 => Blur() */
    document.querySelectorAll('.main-menu__link').forEach(function (el) {
      if (!isMobile && ww >= 1024) {
        el.blur();
      }
    });

    /* Language(Mobile) */
    new ToggleMenu('#menu-lang > li > a.selector', {
      disableSize: 1024,
    });

    /* Footer Sitemap */
    new ToggleMenu('.ft-sitemap__title', {
      disableSize: 640,
    });
  });
  /* ---------------------------------------- [END] 選單項目開啟關閉 */

  /* ---------------------------------------- [START] 選單下滑更改樣式 */
  const header = document.querySelector('#header');
  if (header) {
    const headerClassScroll = 'is-collapse';
    const headerClassScrollDown = 'is-scroll-down';
    const headerClassScrollUp = 'is-scroll-up';

    // 使用 windowStore 取得滾動位置
    let { ws } = windowStore.getState();
    let windowScrollTopCache = ws;
    let windowScrollStatus = null;

    /**
     * 更改向上滑動與向下滑動狀態
     * @param {string} dir 滑動方向，輸入['down'|'up']
     */
    function scrollStatusChange(dir) {
      if (windowScrollStatus === dir) {
        return false;
      } else {
        if (dir === 'down') {
          scrollStatusDown(header);
          scrollStatusDown(html);
        } else {
          scrollStatusUp(header);
          scrollStatusUp(html);
        }
        windowScrollStatus = dir;
      }
    }

    function scrollStatusDown(el) {
      el.classList.add(headerClassScrollDown);
      el.classList.remove(headerClassScrollUp);
    }

    function scrollStatusUp(el) {
      el.classList.remove(headerClassScrollDown);
      el.classList.add(headerClassScrollUp);
    }

    /* 滑動主要Function */
    function headerScrollHandler() {
      // 從 windowStore 取得最新的滾動位置
      ws = windowStore.getState().ws;

      // 確認上滑與下滑狀態
      if (ws > windowScrollTopCache) {
        scrollStatusChange('down');
      } else if (ws !== windowScrollTopCache) {
        scrollStatusChange('up');
      }
      windowScrollTopCache = ws;

      // 下滑超過一定高度出現樣式：更改選單樣式、GoTop隱藏出現
      if (ws >= 200) {
        header.classList.add(headerClassScroll);
      } else {
        header.classList.remove(headerClassScroll);
      }
    }

    // 訂閱滾動狀態變化
    on(window, 'load', headerScrollHandler);
    windowStore.subscribe(() => {
      headerScrollHandler();
    });
  }
  /* ---------------------------------------- [END] 選單下滑更改樣式 */
}
