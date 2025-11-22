/**
 * Window Store 使用範例
 *
 * 此檔案展示如何在各種情境下使用 windowStore
 */

import { windowStore } from './window-store';

/* ========================================
   範例 1: 基本使用 - 取得當前視窗狀態
   ======================================== */
export function example1_getState() {
  // 取得當前的視窗狀態
  const { ww, wh, ws } = windowStore.getState();

  console.log('視窗寬度:', ww);
  console.log('視窗高度:', wh);
  console.log('滾動位置:', ws);

  // 根據視窗寬度做響應式判斷
  if (ww > 1024) {
    console.log('桌面版');
  } else if (ww > 768) {
    console.log('平板版');
  } else {
    console.log('手機版');
  }
}

/* ========================================
   範例 2: 訂閱狀態變化 - Resize 響應
   ======================================== */
export function example2_subscribeResize() {
  let currentBreakpoint = null;

  // 訂閱視窗狀態變化
  windowStore.subscribe((state) => {
    const { ww } = state;

    // 判斷 breakpoint 是否改變
    let newBreakpoint;
    if (ww > 1024) {
      newBreakpoint = 'desktop';
    } else if (ww > 768) {
      newBreakpoint = 'tablet';
    } else {
      newBreakpoint = 'mobile';
    }

    // 只在 breakpoint 改變時執行
    if (newBreakpoint !== currentBreakpoint) {
      console.log('Breakpoint 改變:', currentBreakpoint, '->', newBreakpoint);
      currentBreakpoint = newBreakpoint;

      // 執行對應的初始化
      if (newBreakpoint === 'mobile') {
        initMobileMenu();
      } else {
        initDesktopMenu();
      }
    }
  });
}

/* ========================================
   範例 3: 訂閱滾動事件 - Scroll 響應
   ======================================== */
export function example3_subscribeScroll() {
  const header = document.querySelector('#header');
  if (!header) return;

  windowStore.subscribe((state) => {
    const { ws } = state;

    // 根據滾動位置改變樣式
    if (ws > 200) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  });
}

/* ========================================
   範例 4: 取消訂閱
   ======================================== */
export function example4_unsubscribe() {
  // subscribe() 會返回取消訂閱的函數
  const unsubscribe = windowStore.subscribe((state) => {
    console.log('視窗狀態更新:', state);
  });

  // 在某個時機取消訂閱（例如元件銷毀時）
  setTimeout(() => {
    unsubscribe();
    console.log('已取消訂閱');
  }, 5000);
}

/* ========================================
   範例 5: 在模組中使用 - 完整範例
   ======================================== */
export function example5_moduleUsage() {
  // 初始化時取得狀態
  let { ww, wh, ws } = windowStore.getState();

  // 訂閱狀態變化
  windowStore.subscribe((state) => {
    ww = state.ww;
    wh = state.wh;
    ws = state.ws;
  });

  // 使用狀態的函數
  function checkViewport() {
    console.log(`當前視窗: ${ww}x${wh}, 滾動: ${ws}`);
  }

  // 在需要的時候呼叫
  checkViewport();
}

/* ========================================
   範例 6: 效能優化 - 只在特定條件下執行
   ======================================== */
export function example6_optimization() {
  let lastWw = windowStore.getState().ww;

  windowStore.subscribe((state) => {
    const { ww, ws } = state;

    // 只在寬度改變時執行（忽略高度和滾動）
    if (ww !== lastWw) {
      console.log('視窗寬度改變:', lastWw, '->', ww);
      lastWw = ww;

      // 執行耗時的重新計算
      recalculateLayout();
    }

    // 滾動處理（輕量級操作）
    if (ws > 100) {
      showBackToTop();
    }
  });
}

/* ========================================
   範例 7: 多個訂閱者
   ======================================== */
export function example7_multipleSubscribers() {
  // 訂閱者 1: 處理 Header
  windowStore.subscribe((state) => {
    updateHeader(state.ws);
  });

  // 訂閱者 2: 處理 Sidebar
  windowStore.subscribe((state) => {
    updateSidebar(state.ww, state.wh);
  });

  // 訂閱者 3: 處理 Animation
  windowStore.subscribe((state) => {
    if (state.ww > 768) {
      enableAnimations();
    } else {
      disableAnimations();
    }
  });
}

/* ========================================
   範例 8: 在 Class 中使用
   ======================================== */
class MyComponent {
  constructor(element) {
    this.element = element;
    this.state = windowStore.getState();

    // 訂閱並儲存 unsubscribe 函數
    this.unsubscribe = windowStore.subscribe((state) => {
      this.onWindowChange(state);
    });
  }

  onWindowChange(state) {
    this.state = state;
    this.render();
  }

  render() {
    const { ww, ws } = this.state;
    // 根據狀態更新 DOM
    this.element.textContent = `視窗: ${ww}px, 滾動: ${ws}px`;
  }

  destroy() {
    // 元件銷毀時取消訂閱
    this.unsubscribe();
  }
}

/* ========================================
   輔助函數（範例用）
   ======================================== */
function initMobileMenu() {
  console.log('初始化手機選單');
}

function initDesktopMenu() {
  console.log('初始化桌面選單');
}

function recalculateLayout() {
  console.log('重新計算佈局');
}

function showBackToTop() {
  console.log('顯示返回頂部按鈕');
}

function updateHeader(ws) {
  console.log('更新 Header:', ws);
}

function updateSidebar(ww, wh) {
  console.log('更新 Sidebar:', ww, wh);
}

function enableAnimations() {
  console.log('啟用動畫');
}

function disableAnimations() {
  console.log('停用動畫');
}
