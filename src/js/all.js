/*global EaseScroll, lazyload*/

'use strict';

import { on, off, throttle, isInViewport } from './modules/_fn';

/* ---------------------------------------- [START] IE Global Setting */
// 舊IE提醒
const userAgent = window.navigator.userAgent;
if (
	userAgent.indexOf('MSIE 7.0') > 0 ||
	userAgent.indexOf('MSIE 8.0') > 0 ||
	userAgent.indexOf('MSIE 9.0') > 0 ||
	userAgent.indexOf('MSIE 10.0') > 0 ||
	!!userAgent.match(/Trident.*rv\:11\./) // IE11
) {
	location.href = 'browser.html';
}

/* 防止IE沒有 JS element.remove() */
/* Create Element.remove() function if not exist */
if (!('remove' in Element.prototype)) {
	Element.prototype.remove = function () {
		if (this.parentNode) {
			this.parentNode.removeChild(this);
		}
	};
}
/* ---------------------------------------- [END] IE Global Setting */

(function (window, document) {
	/* ---------------------------------------- [START] Windows Setting */
	const html = document.documentElement;
	let ww = window.innerWidth;
	let wh = window.innerHeight;
	let ws = 0;
	function getScrollTop(target = window) {
		return (target.pageYOffset || html.scrollTop) - (html.clientTop || 0);
	}
	function getWinSet() {
		ww = window.innerWidth;
		wh = window.innerHeight;
		ws = getScrollTop();
	}
	on(window, 'load', getWinSet);
	on(window, 'resize', throttle(getWinSet, 50, 100));
	/* ---------------------------------------- [END] Windows Setting */

	/* ---------------------------------------- [START] 取得裝置判斷 */
	// 取得裝置判斷
	let isMobile = false;
	let isTablet = false;
	let isPhone = false;

	const deviceDetect = function () {
		// IsPhone
		isPhone = ww <= 640;

		// IsMobile
		// 防止測試時一直用開發者工具Resize出現Bug
		isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		if(isMobile) html.classList.add('is-mobile');
		else html.classList.remove('is-mobile');

		// IsTablet
		if (navigator.userAgent.match(/Android/i)) {
			if (!navigator.userAgent.match(/Mobile/i)) {
				isTablet = true;
			}
		} else if (navigator.userAgent.match(/BlackBerry|iPad|Opera Mini|IEMobile/i)) {
			isTablet = true;
		}
	};

	deviceDetect();
	on(window, 'resize', throttle(deviceDetect, 50, 100));
	/* ---------------------------------------- [END] 取得裝置判斷 */

	/* ---------------------------------------- [START] 判斷browser */
	var ua = navigator.userAgent;
	var browser = {
		isChrome: /chrome/i.test(ua),
		isFirefox: /firefox/i.test(ua),
		isSafari: /safari/i.test(ua),
		isIE: /msie/i.test(ua) || /trident/i.test(ua),
		isEdge: /edge/i.test(ua),
	};

	// 修正數值browser
	if (browser.isChrome) browser.isSafari = false;
	if (browser.isEdge) {
		browser.isChrome = false;
		browser.isSafari = false;
	}

	var browserIs;
	for (var key in browser) {
		if (browser[key]) {
			browserIs = key.split('is')[1];
			// 增加Class
			document.documentElement.classList.add(browserIs.toLowerCase());
			document.documentElement.browser = browserIs;
			break;
		}
	}
	browser.is = browserIs;

	// ----------------------------
	// 判斷 裝置
	// iOS
	var isiOS = ua.toLowerCase().match(/(iphone|ipod|ipad)/);
	isiOS && html.classList.add('ios');
	/* ---------------------------------------- [END] 判斷browser */

	/* ----------------------------------- [START] Loader 移除 */
	// var loaderRemove = function () {
	// 	var loader = document.querySelector('#loader');
	// 	window.loader = loader; // 加到 window 上

	// 	pageLoaded();
	// };
	// on(window, 'load', loaderRemove);

	// /* 頁面可呼叫的 function -------- */
	// /* 開啟 Loading */
	// window.pageLoading = function() {
	// 	loader.classList.remove('loaded');
	// 	document.body.appendChild(loader);
	// }

	// /* 關閉 Loading */
	// window.pageUnLoading = function() {
	// 	loader.classList.add('loaded');
	// 	setTimeout(function () {
	// 		loader.remove();
	// 	}, 2000);
	// }
	/* ----------------------------------- [END] Loader 移除 */

	/* ---------------------------------------- [START] Ease scroll */
	var buildEaseScroll = function () {
		if (window.EaseScroll === undefined) return false;
		const es = new EaseScroll({
			frameRate: 60,
			animationTime: 1000,
			stepSize: 100,
			pulseAlgorithm: 1,
			pulseScale: 6,
			pulseNormalize: 1,
			accelerationDelta: 20,
			accelerationMax: 1,
			keyboardSupport: true,
			arrowScroll: 30,
			touchpadSupport: true,
			fixedBackground: true,
			// disabledClass: 'modal-open',

			/* Browser Setting Control */
			browser: {
				Chrome: true,
				FireFox: false,
				Safari: true,
				IE: true,
				Edge: true,
			},
		});
	};
	on(window, 'load', buildEaseScroll);
	/* ---------------------------------------- [END] Ease scroll */

	/* ---------------------------------------- [START] Lazyload */
	/*
	 * 使用：https://github.com/verlok/vanilla-lazyload
	 * 尋找頁面上的 .lazy 為執行 Lazy Load 物件
	 */
	var lazyloadTimer = 0;
	function buildLazyLoad() {
		if (lazyloadTimer < 5 && window.LazyLoad === undefined) {
			return setTimeout(function () {
				lazyloadTimer++;
				buildLazyLoad();
			}, 500);
		}

		var lazyLoadInstance = new LazyLoad({
			// Your custom settings go here
		});
	}
	on(window, 'load', buildLazyLoad);
	/* ---------------------------------------- [END] Lazyload */
})(window, document);
