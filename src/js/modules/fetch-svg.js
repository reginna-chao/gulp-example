import { on } from '../utils/_fn';

/* ---------------------------------------- [START] SVG Inline */
(function (window, document) {
  function fetchSvgInline(image) {
    var xhr = new XMLHttpRequest;
    var url = image.currentSrc || image.src;

    if ('withCredentials' in xhr) {
      xhr.withCredentials;
      xhr.open('GET', url, true);
    }
    else {
      if (typeof XDomainRequest == 'undefined') {
        return;
      }

      xhr = new XDomainRequest;
      xhr.open('GET', url);
    }

    xhr.onload = function () {
      var svgStr = xhr.responseText;

      if (svgStr.indexOf('<svg') === -1) {
        return;
      }

      var span = document.createElement('span');

      span.innerHTML = svgStr;

      var inlineSvg = span.getElementsByTagName('svg')[0];

      inlineSvg.setAttribute('aria-label', image.alt || '');
      inlineSvg.setAttribute('class', image.className); // IE doesn't support classList on SVGs
      inlineSvg.setAttribute('focusable', false);
      inlineSvg.setAttribute('role', 'img');

      if (image.height) {
        inlineSvg.setAttribute('height', image.height);
      }

      if (image.width) {
        inlineSvg.setAttribute('width', image.width);
      }

      image.parentNode.replaceChild(inlineSvg, image);
    };

    xhr.onerror = function () {
      image.classList.add('not-inline');
    };

    setTimeout(xhr.send(), 0);
  }

  function initFetchSVG() {
    document.querySelectorAll('img.svg').forEach((el) => {
      fetchSvgInline(el);
    });
  }

  on(window, 'load', function () {
    initFetchSVG();
  });
})(window, document);
/* ---------------------------------------- [END] SVG Inline */
