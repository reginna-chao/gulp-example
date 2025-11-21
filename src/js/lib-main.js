// 專案主要的套件合併，合併頁面上的套件再另外開檔案 lib-{{page}}.js
// import LazyLoad from "vanilla-lazyload"; // import node_module 內的版本（要先安裝套件）
// new LazyLoad() // 內頁的 all.js 無法隔空使用，一定要在這邊開或是 window.LazyLoad = LazyLoad 之類的方式建立可呼叫的方法
import LazyLoad from './vendor/lazyload.min.js';
import './vendor/javascript.easeScroll.min.js';

window.LazyLoad = LazyLoad;
