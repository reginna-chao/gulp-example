import { throttle } from '../utils/_fn.js';

/**
 * Window Store - Vanilla JS 狀態管理
 *
 * 採用發布-訂閱模式 (Pub-Sub Pattern) 管理視窗狀態
 * 類似 Redux/Vuex 的簡單實作，提供單一數據源
 *
 * @example
 * import { windowStore } from './stores/window-store';
 *
 * // 取得當前狀態
 * const { ww, wh, ws } = windowStore.getState();
 *
 * // 訂閱狀態變化
 * const unsubscribe = windowStore.subscribe((state) => {
 *   console.log('Window state changed:', state);
 * });
 *
 * // 取消訂閱
 * unsubscribe();
 */
class WindowStore {
  constructor() {
    // 狀態存儲
    this.state = {
      ww: window.innerWidth,   // window width
      wh: window.innerHeight,  // window height
      ws: 0,                   // window scroll top
    };

    // 訂閱者陣列
    this.subscribers = [];

    // 初始化事件監聽
    this.initListeners();
  }

  /**
   * 取得當前狀態（返回副本，避免外部修改）
   * @returns {Object} { ww, wh, ws }
   */
  getState() {
    return { ...this.state };
  }

  /**
   * 訂閱狀態變化
   * @param {Function} callback - 回調函數，接收 state 參數
   * @returns {Function} 取消訂閱函數
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      console.warn('[WindowStore] subscribe() 需要傳入函數');
      return () => {};
    }

    this.subscribers.push(callback);

    // 返回取消訂閱函數
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * 通知所有訂閱者
   * @private
   */
  notify() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.getState());
      } catch (error) {
        console.error('[WindowStore] 訂閱者執行錯誤:', error);
      }
    });
  }

  /**
   * 更新狀態並通知訂閱者
   * @private
   * @param {Object} newState - 新的狀態物件
   */
  updateState(newState) {
    const hasChanged = Object.keys(newState).some(
      key => this.state[key] !== newState[key]
    );

    if (hasChanged) {
      this.state = { ...this.state, ...newState };
      this.notify();
    }
  }

  /**
   * 取得滾動位置
   * @private
   * @returns {number} scroll top value
   */
  getScrollTop() {
    const html = document.documentElement;
    return (window.pageYOffset || html.scrollTop) - (html.clientTop || 0);
  }

  /**
   * 初始化事件監聽器
   * @private
   */
  initListeners() {
    // Resize 事件 - 使用節流優化效能
    window.addEventListener('resize', throttle(() => {
      this.updateState({
        ww: window.innerWidth,
        wh: window.innerHeight,
      });
    }, 50, 100));

    // Scroll 事件 - 使用節流優化效能
    window.addEventListener('scroll', throttle(() => {
      this.updateState({
        ws: this.getScrollTop(),
      });
    }, 50, 100));

    // Load 事件 - 確保初始值正確
    window.addEventListener('load', () => {
      this.updateState({
        ww: window.innerWidth,
        wh: window.innerHeight,
        ws: this.getScrollTop(),
      });
    });
  }
}

// 單例模式：確保全域只有一個 WindowStore 實例
export const windowStore = new WindowStore();
