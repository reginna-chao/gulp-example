import { UAParser } from 'ua-parser-js';

// Export device detection results
export let isMobile = false;
export let isTablet = false;

export function initBrowserDetect() {
  /* ---------------------------------------- [START] Browser Tip */
  window.UAParser = UAParser;
  const uap = new UAParser();
  const result = uap.getResult();
  const browserName = result.browser.name;
  const browserVersion = result.browser.version ? parseInt(result.browser.version.split('.')[0]) : 0;
  const osName = result.os.name;
  const osVersion = result.os.version ? parseInt(result.os.version.split('.')[0]) : 0;

  // 1. Version Check & Redirect
  let shouldRedirect = false;

  if (browserName) {
    if (browserName.includes('IE')) shouldRedirect = true;
    else if (browserName.includes('Chrome') && browserVersion < 85) shouldRedirect = true;
    else if (browserName.includes('Firefox') && browserVersion < 75) shouldRedirect = true;
    else if (browserName === 'Edge' && browserVersion < 80) shouldRedirect = true;
    else if (browserName.includes('Safari') && browserVersion < 13) shouldRedirect = true;
  }

  if (osName) {
    if (osName === 'iOS' && osVersion < 13) shouldRedirect = true;
    else if (osName === 'Android' && osVersion < 5) shouldRedirect = true;
  }

  if (shouldRedirect) {
    location.href = 'browser.html';
  }
  /* ---------------------------------------- [END] Browser Tip */

  /* ---------------------------------------- [START] Browser Check & Device Detect */
  // 2. Add Classes
  if (browserName) {
    document.documentElement.classList.add(browserName.toLowerCase().replace(/\s/g, '-'));
  }
  if (osName) {
    document.documentElement.classList.add(osName.toLowerCase().replace(/\s/g, '-'));
  }

  // Update exported device detection variables
  isMobile = result.device.type === 'mobile';
  isTablet = result.device.type === 'tablet';

  if (isMobile) document.documentElement.classList.add('is-mobile');
  if (isTablet) document.documentElement.classList.add('is-tablet');
  /* ---------------------------------------- [END] Browser Check & Device Detect */
}
