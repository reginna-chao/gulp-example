/*
 * Gulp 版本為 5+ (ESM)
 */

import { watch, series, parallel } from 'gulp';
import { deleteAsync } from 'del';

import { errorRemoveHandler } from './gulp/utils.js';
import { PATHS, setProduct } from './gulp/config.js';

import { browsersyncInit, browsersyncReload } from './gulp/server.js';
import { sassCompile, sassExportVendor } from './gulp/tasks/css.js';
import { jsFile, jsVendor, jsStatic, jsVendorMin } from './gulp/tasks/js.js';
import { image, imageIco } from './gulp/tasks/images.js';
import { pagePugNormal, pagePugLayoutCheck, pageHtml } from './gulp/tasks/html.js';
import { json, fontFile, otherFile } from './gulp/tasks/other.js';
import { iconFontCreateEmptyFile, iconFont } from './gulp/tasks/iconfont.js';

// clean file
function clean() {
  return deleteAsync(['dist']);
}

// watch file
function watchFiles() {
  watch(PATHS.sass.src, { delay: 500 }, series(errorRemoveHandler, parallel(sassExportVendor, sassCompile)));
  watch(PATHS.js.src, series(errorRemoveHandler, jsFile, browsersyncReload));
  watch(PATHS.js.vendor, series(errorRemoveHandler, jsVendor, browsersyncReload));
  watch(PATHS.js.vendorMin, series(jsVendorMin, browsersyncReload));
  watch(PATHS.js.static, series(jsStatic, browsersyncReload));
  watch(PATHS.json.src, series(json, browsersyncReload));
  watch(PATHS.images.src, image);
  watch(PATHS.images.ico, imageIco);
  watch(PATHS.images.fontSvg, { delay: 500 }, series(iconFont, browsersyncReload));
  watch('src/sass/vendor/font/templates/*.*', series(iconFont, browsersyncReload));
  watch(PATHS.other.src, otherFile);
  watch(PATHS.fonts.src, fontFile);
  watch(PATHS.pug.src, { delay: 500 }, series(errorRemoveHandler, pagePugNormal, browsersyncReload));
  watch(PATHS.pug.layout, { delay: 500 }, series(errorRemoveHandler, pagePugLayoutCheck, browsersyncReload));
  watch(PATHS.html.src, series(pageHtml, browsersyncReload));
}

// define complex tasks
export const jsTask = series(errorRemoveHandler, jsFile, jsVendor, jsVendorMin, jsStatic, json);
export const cssTask = series(errorRemoveHandler, sassExportVendor, sassCompile);
export const imgTask = series(image, imageIco);
export const htmlTask = series(pagePugNormal, pageHtml);
export const otherTask = series(fontFile, otherFile);
export const watchTask = parallel(browsersyncInit, watchFiles);

// ===================== Export ========================

export const buildUncompressTask = series(
  clean,
  iconFontCreateEmptyFile,
  parallel(iconFont, imgTask, jsTask, cssTask, htmlTask, otherTask),
  watchTask
);

export const buildCompressTask = series(
  setProduct,
  clean,
  iconFontCreateEmptyFile,
  parallel(iconFont, imgTask, jsTask, cssTask, htmlTask, otherTask),
  watchTask
);

// Export tasks
export const buildProd = buildCompressTask;
export const buildDev = buildUncompressTask;

// 有需要自行更換 default 值
// 需要更換為壓縮版本情況：上傳FTP時僅提供壓縮檔給客戶（以防忘記）
export default buildUncompressTask;
