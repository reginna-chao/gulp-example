/* ---------------------------------------- [START] Window EventListener */
window.on = function (target, event, func, option) {
	target = target || window;
	if (window.addEventListener) {
		var opt = option || false;
		target.addEventListener(event, func, opt);
	} else {
		target.attachEvent('on' + event, func);
	}
};
window.off = function (target, event, func) {
	target = target || window;
	if (window.addEventListener) target.removeEventListener(event, func, false);
	else target.detachEvent('on' + event, func);
};
/* ---------------------------------------- [END] Window EventListener */

/* ---------------------------------------- [START] 簡單的節流函數 */
// https://www.cnblogs.com/coco1s/p/5499469.html
window.throttle = function (func, wait, mustRun) {
	var timeout;
	var startTime = new Date();

	return function () {
		var context = this;
		var args = arguments;
		var curTime = new Date();

		if (timeout !== undefined) {
			if (window.requestTimeout !== undefined) clearRequestTimeout(timeout);
			else clearTimeout(timeout);
		}
		// 如果達到了規定的觸發時間間隔，觸發 handler
		if (curTime - startTime >= mustRun) {
			func.apply(context, args);
			startTime = curTime;
			// 沒達到觸發間隔，重新設定定時器
		} else {
			if (window.requestTimeout !== undefined) timeout = requestTimeout(func, wait);
			else timeout = setTimeout(func, wait);
		}
	};
};
/* ---------------------------------------- [END] 簡單的節流函數 */

/* ---------------------------------------- [START] isInViewport */
window.isInViewport = function (el) {
	var rect = el.getBoundingClientRect();

	var isVisible = el.offsetHeight !== 0;

	return (
		isVisible &&
		rect.bottom >= 0 &&
		rect.right >= 0 &&
		rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.left <= (window.innerWidth || document.documentElement.clientWidth)
	);
};
/* ---------------------------------------- [END] isInViewport */

/* ---------------------------------------- [START] 從 String 取得 HTML Element */
// https://stackoverflow.com/a/494348/11240898
function createElementFromHTML(htmlString) {
	var div = document.createElement('div');
	div.innerHTML = htmlString.trim();

	// Change this to div.childNodes to support multiple top-level nodes
	return div.firstChild;
}
/* ---------------------------------------- [END] 從 String 取得 HTML Element */

/* ---------------------------------------- [START] 防止IE沒有 JS element.remove() */
/* Create Element.remove() function if not exist */
if (!('remove' in Element.prototype)) {
	Element.prototype.remove = function () {
		if (this.parentNode) {
			this.parentNode.removeChild(this);
		}
	};
}
/* ---------------------------------------- [END] 防止IE沒有 JS element.remove() */
