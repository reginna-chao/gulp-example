'use strict';

import { initBrowserDetect } from './modules/browser-detect';
import { initLoader } from './modules/ui-loader';
import { initLazyLoad } from './modules/ui-lazyload';
import { initHeader } from './modules/ui-header';
import { initGoTop } from './modules/ui-gotop';
import { initScrollTrigger } from './modules/ui-scroll-trigger';
import { initStickyFooter } from './modules/ui-sticky-footer';

initBrowserDetect();
initLoader();
initLazyLoad();
initHeader();
initGoTop();
initScrollTrigger();
initStickyFooter();

/* ---------------------------------------- [START] Window Store */
// Window 狀態管理已移至 stores/window-store.js
// 使用發布-訂閱模式，提供全域共享的 ww, wh, ws 狀態
// 其他模組可透過 import { windowStore } from './stores/window-store' 使用
/* ---------------------------------------- [END] Window Store */
