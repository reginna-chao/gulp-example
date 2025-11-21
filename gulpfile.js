/*
 * Gulp 版本為 5+ (ESM)
 */

// init plugin
import { src, dest, watch, series, parallel } from 'gulp';
import { create as browserSyncCreate } from 'browser-sync';
const browserSync = browserSyncCreate(); // 建立同步虛擬伺服器

// Tool
import fs from 'fs';
import { deleteAsync } from 'del'; // 清除檔案
import through from 'through2'; // 處理通過後的檔案
import gulpif from 'gulp-if'; // 就是 if ಠ_ಠ
import notify from 'gulp-notify'; // 通知訊息
import debug from 'gulp-debug'; // debug 監控處理檔案
import replace from 'gulp-replace'; // 取代文字
import rename from 'gulp-rename'; // 檔案重新命名
import gulpIgnore from 'gulp-ignore'; // [例外處理] 無視指定檔案
import plumber from 'gulp-plumber'; // [例外處理] gulp發生編譯錯誤後仍然可以繼續執行，不會強迫中斷
import cached from 'gulp-cached'; // [快取機制] 只傳遞修改過的文件
import sourcemaps from 'gulp-sourcemaps'; // [檔案追蹤] 來源編譯

// [Helper] Filter non-existent paths
function filterExistPaths(paths) {
  const pathsArr = Array.isArray(paths) ? paths : [paths];
  const filteredPaths = pathsArr.filter((p) => {
    if (p.startsWith('!')) return true; // Always keep exclusions

    let checkPath = p;
    const wildcardIndex = checkPath.indexOf('*');
    if (wildcardIndex !== -1) {
      checkPath = checkPath.substring(0, wildcardIndex);
    }

    // If empty, it implies current directory which exists
    if (!checkPath) return true;

    return fs.existsSync(checkPath);
  });

  // If all paths are filtered out, or only negative globs remain, return a non-matching glob
  const hasPositive = filteredPaths.some(p => !p.startsWith('!'));
  if (filteredPaths.length === 0 || !hasPositive) {
    return ['non-existent-path-to-prevent-error'];
  }
  return filteredPaths;
}

// css

import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass); // [css] Sass 編譯 (使用 dart-sass)

import autoprefixer from 'gulp-autoprefixer'; // [css] CSS自動前綴
import cleancss from 'gulp-clean-css'; // [css] CSS壓縮

// JS
import uglify from 'gulp-uglify'; // [JS] 壓縮JS
import { rollup as rollupAPI } from 'rollup'; // [JS] Rollup 原生 API
import { babel } from '@rollup/plugin-babel'; // [JS] Babel plugin
import { nodeResolve } from '@rollup/plugin-node-resolve'; // [JS] Node resolve
import commonjs from '@rollup/plugin-commonjs'; // [JS] CommonJS plugin

// Image
import imagemin, { mozjpeg, optipng } from 'gulp-imagemin'; // [IMG] Image壓縮

// HTML
import pug from 'gulp-pug'; // [HTML / PUG] 編譯 PUG（PUG模板）
// Icon(Icon Font)
import iconfont from 'gulp-iconfont'; // [ICON FONT] 編譯font檔案
import consolidate from 'gulp-consolidate'; // [ICON FONT] 編譯Demo html + icon.scss

// [font icon] function
const fontName = 'icon',
  fontClassName = 'be-icon';
const runTimestamp = Math.round(Date.now() / 1000);

// [路徑配置] 統一管理所有檔案路徑
const PATHS = {
  js: {
    src: ['src/js/**/*.js', '!src/js/**/_*.js', '!src/js/{vendor,lib,plugin,plugins,foundation,bootstrap}/**/*.*'],
    vendor: [
      'src/js/{vendor,lib,plugin,plugins,foundation,bootstrap}/**/*.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation,bootstrap}/**/*.min.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation,bootstrap}/**/*-min.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation,bootstrap}/**/_*.js',
      '!src/js/**/{i18n,l10n}/**/*.js',
    ],
    vendorMin: [
      'src/js/{vendor,lib,plugin,plugins,foundation,bootstrap}/**/*.min.js',
      'src/js/{vendor,lib,plugin,plugins,foundation,bootstrap}/**/*-min.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation,bootstrap}/**/_*.min.js',
      'src/js/**/{i18n,l10n}/**/*.js',
    ],
  },
  sass: {
    src: 'src/sass/**/*.+(scss|sass)',
    vendor: 'src/sass/vendor/**/*.css',
  },
  pug: {
    src: ['src/**/*.pug', '!src/**/_*.pug'],
    layout: ['src/**/_*.pug'],
  },
  html: {
    src: ['src/**/*.html', '!src/**/_*.html'],
  },
  images: {
    src: 'src/images/**/*',
    ico: 'src/*.ico',
    fontSvg: 'src/images/font_svg/*.svg',
  },
  json: {
    src: ['src/json/**/*.json', '!src/json/**/_*.json'],
  },
  fonts: {
    src: 'src/fonts/**/*',
  },
  other: {
    src: ['./src/*.md', './src/.htaccess', './src/**/*.txt', './src/download/**/*.*', './src/pdf/**/*.*'],
  },
};

// 是否是產品（只輸出壓縮CSS、JS）
let isProduct = false;
function setProduct(done) {
  isProduct = true;
  done();
}

// [Sourcemap 配置] 通用的 sourcemap 寫入配置
function getSourcemapWriteConfig() {
  return {
    sourceRoot: function (file) {
      const filePathSplit = file.sourceMap.file.split('/');
      const backTrack = '../'.repeat(filePathSplit.length - 1) || '../';
      return backTrack + 'src/';
    },
  };
}

// [Rollup 包裝器] 自定義 Gulp plugin 包裝 Rollup API
function gulpRollup(options = {}) {
  return through.obj(async function (file, enc, cb) {
    if (file.isNull()) {
      return cb(null, file);
    }

    if (file.isStream()) {
      return cb(new Error('Streaming not supported'));
    }

    try {
      // Rollup 編譯配置
      const inputOptions = {
        input: file.path,
        plugins: [
          nodeResolve(),
          commonjs(),
          babel({
            babelHelpers: 'bundled',
            exclude: 'node_modules/**',
          }),
        ],
        onwarn: (warning) => {
          // 忽略某些警告
          if (warning.code === 'THIS_IS_UNDEFINED') return;
          console.warn(warning.message);
        },
      };

      const outputOptions = {
        format: options.format || 'iife',
        strict: false,
        sourcemap: true,
      };

      // 執行 Rollup 編譯
      const bundle = await rollupAPI(inputOptions);
      const { output } = await bundle.generate(outputOptions);

      // 取得編譯結果
      const result = output[0];

      // 更新檔案內容
      file.contents = Buffer.from(result.code);

      // 處理 sourcemap
      if (result.map) {
        file.sourceMap = result.map;
      }

      cb(null, file);
    } catch (error) {
      // 錯誤處理
      console.error('Rollup compilation error:', error.message);
      cb(error);
    }
  });
}

// [font icon] 先建立空值檔案，避免一開始有錯誤，之後會被蓋過
function iconFontCreateEmptyFile(cb) {
  if (isDirEmpty('src/images/font_svg')) {
    // isEmpty
    cb();
  } else {
    // 生成空的 @mixin
    let str = `
      /* Empty */
      @mixin font-icon() {};
      @mixin font-icon-style() {};
      @mixin font-icon-add($icon, $style: false) {
          content: #{$icon};
          @if ($style) {
            color: #000;
          }
      };
    `;

    // 依照 font_icon 內的檔案生成假的 @mixin
    fs.readdirSync('src/images/font_svg/').forEach((file) => {
      str = str + ` @mixin font-icon-${file.replace(/\.svg/g, '')}() {};`;
    });

    fs.writeFile('src/sass/vendor/font/_icons.scss', str, cb);
  }
}
// 確認該資料夾內是否有物件
function isDirEmpty(path) {
  if (!fs.existsSync(path)) return true;
  return fs.readdirSync(path).length === 0;
}

// [font icon] 建立
function iconFont(done) {
  return (
    src(['src/images/font_svg/*.svg'], { base: './src/', allowEmpty: true })
      // .pipe(cached('iconFont'))
      .pipe(
        iconfont({
          fontName: fontName,
          formats: ['svg', 'ttf', 'eot', 'woff', 'woff2'],
          appendCodepoints: true,
          appendUnicode: false,
          normalize: true,
          centerHorizontally: true,
          fontHeight: 1001,
          descent: 143,
          timestamp: runTimestamp, // 官方提供的 API ，避免有快取
        })
      )
      .on('glyphs', function (glyphs, options) {
        // 生成 ICON SCSS
        src('src/sass/vendor/font/templates/_icons.scss')
          .pipe(
            consolidate('underscore', {
              glyphs: glyphs,
              fontName: options.fontName, // 使用的font-family
              fontPath: '../fonts/icons/', // 生成的SCSS讀取font檔案讀取位置
              cssClass: fontClassName, // 使用的class名稱: <i class="{{fontClassName}} {{fontClassName}}-{{svg file name}}"></i>
            })
          )
          .pipe(dest('src/sass/vendor/font')) // 生成SCSS位置
          .on('end', async () => {
            // sassCompile(useCached===false) => 不使用Cache功能
            errorRemoveHandler();
            await sassCompile(false);
            done();
          });

        // 生成 ICON CSS (Demo HTML使用)
        src('src/sass/vendor/font/templates/_icons.scss')
          .pipe(
            consolidate('underscore', {
              glyphs: glyphs,
              fontName: options.fontName,
              fontPath: '',
              cssClass: fontClassName,
            })
          )
          .pipe(replace(/\/\/ @include/g, '@include')) // 開啟@include
          .pipe(rename({ basename: 'icons' }))
          .pipe(sass({ outputStyle: 'expanded' }))
          .pipe(rename({ suffix: '.min' }))
          .pipe(cleancss({ rebase: false }))
          .pipe(dest('dist/fonts/icons'));

        // 生成 Demo CSS (Demo HTML使用)
        src('src/sass/vendor/font/templates/_iconfont-demo.scss')
          .pipe(rename({ basename: 'iconfont-demo', suffix: '.min', extname: '.css' }))
          .pipe(cleancss({ rebase: false }))
          .pipe(dest('dist/fonts/icons'));

        // 複製 Demo 使用的 JS Plugin (Demo HTML使用)
        src('src/sass/vendor/font/templates/*.js').pipe(dest('dist/fonts/icons'));

        // 生成Demo HTML
        src('src/sass/vendor/font/templates/_index.html')
          .pipe(
            consolidate('underscore', {
              glyphs: glyphs,
              fontName: options.fontName,
              cssClass: fontClassName,
              fontYYYY: new Date().getYear() + 1900,
            })
          )
          .pipe(rename({ basename: 'index' }))
          .pipe(dest('dist/fonts/icons'));
      })
      .pipe(dest('dist/fonts/icons/')) // 生成的font檔案
      .pipe(
        notify({
          onLast: true,
          message: 'Font icon Task Complete!',
        })
      )
  );
}

// node sass display error
function errorShowHandler(error) {
  const errorMessageParam = error.messageFormatted || error.message;
  console.log(errorMessageParam);

  // Error Message
  let errorString = '<strong style="color: #f4ff00;">[' + error.plugin + ']</strong>\n';
  errorString += ' ' + errorMessageParam;
  // [START] 檔案名稱顏色更改
  errorString = errorString.replace(/\[4m/g, '<span style="color: #00fbff;">');
  errorString = errorString.replace(/\[24m/g, '</span>');
  // [END] 檔案名稱顏色更改
  // [START] JS Babel 會出現的錯誤有命令提示字元的格式
  errorString = errorString.replace(/ /g, '');
  errorString = errorString.replace(/\[0m|\[33m|\[36m/g, '');
  errorString = errorString.replace(/\[90m/g, '<span style="color: gray;">');
  errorString = errorString.replace(/\[31m\[1m/g, '<span style="color: red;">');
  errorString = errorString.replace(/\[22m|\[39m/g, '</span>');
  // [END] JS Babel 會出現的錯誤有命令提示字元的格式
  var errorMessage =
    '\n============[Error Message]============\n\n' + errorString + '\n\n=======================================\n';

  // Error HTML
  const errorHTML = `
    <!-- START: DEVELOP ERROR MESSAGE -->
    <div class="_GULP_ERROR_MESSAGE_" style="position: fixed; z-index: 9999; top: 0; left: 0; width: 100%; height: 100vh; padding: 20px; background-color: #000000cc; color: white; font-family: Arial, sans-serif; font-size: 18px; overflow: auto; white-space: pre-line;">
    <div style="display: flex; justify-content: center; padding: 20px;">
    <div style="max-width: 100%;">
      ${errorMessage}
    </div>
    </div>
    </div>
    <!-- END: DEVELOP ERROR MESSAGE -->
  `;
  if (!fs.existsSync('dist')) {
    return;
  }
  return src('dist/*.html', { allowEmpty: true })
    .pipe(replace('</body>', `${errorHTML}</body>`))
    .pipe(dest('dist'));
}

// node sass delete commend function
function errorRemoveHandler(done) {
  if (!fs.existsSync('dist')) {
    done();
    return;
  }
  console.log('Removing error from html files.');
  const errorHTML = `
    <!-- START: DEVELOP ERROR MESSAGE -->
    <div class="_GULP_ERROR_MESSAGE_" style="position: fixed; z-index: 9999; top: 0; left: 0; width: 100%; height: 100vh; padding: 20px; background-color: #000000cc; color: white; font-family: Arial, sans-serif; font-size: 18px; overflow: auto; white-space: pre-line;">
    <div style="display: flex; justify-content: center; padding: 20px;">
    <div style="max-width: 100%;">
      .*
    </div>
    </div>
    </div>
    <!-- END: DEVELOP ERROR MESSAGE -->
  `;
  return src('dist/*.html', { allowEmpty: true })
    .pipe(replace(new RegExp(errorHTML, 's'), ''))
    .pipe(dest('dist'));
}

// sass compiler
let sassReload = false;
function sassCompile(useCached) {
  return (
    src(filterExistPaths(PATHS.sass.src), { allowEmpty: true })
      .pipe(
        plumber({
          errorHandler: function (error) {
            errorShowHandler(error);
            this.emit('end');
            sassReload = true;
            browserSync.reload();
          },
        })
      )
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(
        sass({
          outputStyle: 'expanded',
          includePaths: ['node_modules'], // 為了SCSS可以讀取node_module專案
        })
      )
      // .pipe(autoprefixer('last 2 version', 'ie 11', 'ios 8', 'android 4')) // 要符合 IE11，二擇一
      .pipe(autoprefixer()) // 不需要符合 IE11，二擇一
      .pipe(cached('sass'))
      .pipe(debug({ title: 'Debug for compile file:' }))
      .pipe(gulpif(!isProduct, dest('dist/css')))
      .pipe(rename({ suffix: '.min' }))
      .pipe(cleancss({ rebase: false }))
      .pipe(sourcemaps.write('maps', getSourcemapWriteConfig()))
      .pipe(dest('dist/css'))
      // .pipe(debug({title: 'Debug for compile file:'}))
      .pipe(sassReload ? sassReloadHandler() : browserSync.stream({ match: '**/*.css' }))
      .pipe(
        notify({
          onLast: true,
          message: 'CSS Task Complete!',
        })
      )
  );
}

// sass export vendor
function sassExportVendor() {
  return src(filterExistPaths(PATHS.sass.vendor), { allowEmpty: true }).pipe(cached('sassVendor')).pipe(dest('dist/css/vendor'));
}

function sassReloadHandler() {
  sassReload = false;
  browserSync.reload();
}

// image compile

// 如果命名結尾有"--uc"（例如：banner--uc.png, bg--uc.jpg），不會壓縮檔案，也不會重新命名
function image() {
  return src(filterExistPaths(PATHS.images.src), { allowEmpty: true, encoding: false })
    .pipe(plumber())
    .pipe(cached('image'))
    .pipe(debug({ title: 'Debug for compile file:' }))
    .pipe(gulpIgnore.exclude('**--nocopy.*'))
    .pipe(
      gulpif(
        '!**/*--uc.*',
        imagemin([
          // [jpg] quality setting
          mozjpeg({
            quality: 75,
            progressive: true,
          }),

          // [png] quality setting
          optipng({ optimizationLevel: 7 }),
        ])
      )
    )
    .pipe(dest('dist/images'))
    .pipe(browserSync.stream())
    .pipe(
      notify({
        onLast: true,
        message: 'Pic task Compressed!',
      })
    );
}

// ICO(Favicon)※位於第一層的ico
function imageIco() {
  return src(filterExistPaths(PATHS.images.ico), { allowEmpty: true })
    .pipe(cached('imageIco'))
    .pipe(debug({ title: 'Debug for compile file:' }))
    .pipe(dest('dist'))
    .pipe(browserSync.stream());
}

// JS compile
function jsFile() {
  return src(filterExistPaths(PATHS.js.src), { allowEmpty: true })
    .pipe(
      plumber({
        errorHandler: function (error) {
          errorShowHandler(error);
          this.emit('end');
        },
      })
    )
    .pipe(cached('js'))
    .pipe(debug({ title: 'Debug for compile file:' }))
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(gulpRollup({ format: 'iife' }))
    .pipe(gulpif(!isProduct, dest('dist/js')))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(sourcemaps.write('maps', getSourcemapWriteConfig()))
    .pipe(dest('dist/js'))
    .pipe(
      notify({
        onLast: true,
        message: 'JS Task Complete!',
      })
    );
}

// JS vendor compile
function jsVendor() {
  return src(filterExistPaths(PATHS.js.vendor), { allowEmpty: true })
    .pipe(
      plumber({
        errorHandler: function (error) {
          errorShowHandler(error);
          this.emit('end');
        },
      })
    )
    .pipe(cached('jsVendor'))
    .pipe(debug({ title: 'Debug for compile file:' }))
    .pipe(gulpRollup({ format: 'iife' }))
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest('dist/js'))
    .pipe(
      notify({
        onLast: true,
        message: 'JS Plugin Task Complete!',
      })
    );
}
// JS Vendor Min compile
// JS Vendor Min compile
function jsVendorMin() {
  return src(filterExistPaths(PATHS.js.vendorMin), { allowEmpty: true })
    .pipe(plumber())
    .pipe(cached('jsVendorMin'))
    .pipe(debug({ title: 'Debug for compile file:' }))
    .pipe(dest('dist/js'))
    .pipe(
      notify({
        onLast: true,
        message: 'JS Plugin Task Complete!',
      })
    );
}

// JSON File
function json() {
  return (
    src(filterExistPaths(PATHS.json.src), { allowEmpty: true })
      .pipe(plumber())
      .pipe(cached('json'))
      .pipe(debug({ title: 'Debug for compile file:' }))
      .pipe(dest('dist/json'))
      // Minify
      // .pipe(rename({suffix: '.min'}))
      // .pipe(jsonminify())
      // .pipe(dest('dist/json'))
      .pipe(
        notify({
          onLast: true,
          message: 'JSON File Task Complete!',
        })
      )
  );
}

// Pug
// 一般非layout（非底線開頭檔案） => 看watch才能看的出來
function pagePugNormal() {
  return src(filterExistPaths(PATHS.pug.src))
    .pipe(
      plumber({
        errorHandler: function (error) {
          errorShowHandler(error);
          this.emit('end');
        },
      })
    )
    .pipe(cached('pug'))
    .pipe(debug({ title: 'Debug for compile file:' }))
    .pipe(
      pug({
        pretty: true,
        compileDebug: true,
      })
    )
    .pipe(dest('dist'))
    .pipe(
      notify({
        onLast: true,
        message: 'Pug Task Complete!',
      })
    );
}

// 用於layout（底線開頭檔案）：確認檔案是否有更改
function pagePugLayoutCheck() {
  var fileList = [];
  return src(filterExistPaths(PATHS.pug.layout), { allowEmpty: true })
    .pipe(
      plumber({
        errorHandler: function (error) {
          errorShowHandler(error);
          this.emit('end');
        },
      })
    )
    .pipe(cached('pugLayout'))
    .pipe(
      through.obj(function (file, enc, cb) {
        fileList.push(file.path);
        cb(null);
      })
    )
    .pipe(debug({ title: 'Debug for compile file:' }))
    .pipe(
      notify({
        onLast: true,
        message: 'Pug Layout Check Task Complete!',
      })
    )
    .on('end', function () {
      if (fileList.length > 0) {
        pagePugLayoutBuild();
      }
    });
}

// 用於layout（底線開頭檔案）：生成所有頁面檔案
// const timestamp = (new Date()).getTime();
function pagePugLayoutBuild() {
  return src(filterExistPaths(PATHS.pug.src))
    .pipe(
      plumber({
        errorHandler: function (error) {
          errorShowHandler(error);
          this.emit('end');
        },
      })
    )
    .pipe(debug({ title: '__Build all page file:' }))
    .pipe(
      pug({
        pretty: true,
        compileDebug: true,
      })
    )
    .pipe(dest('dist'))
    .pipe(
      notify({
        onLast: true,
        message: 'Pug Layout Build Task Complete!',
      })
    );
}

function pageHtml() {
  return src(filterExistPaths(PATHS.html.src), { allowEmpty: true })
    .pipe(cached('html'))
    .pipe(debug({ title: 'Debug for compile file:' }))
    .pipe(dest('dist'))
    .pipe(
      notify({
        onLast: true,
        message: 'HTML File Task Complete!',
      })
    );
}

// Font File
function fontFile() {
  return src(filterExistPaths(PATHS.fonts.src), { allowEmpty: true })
    .pipe(cached('font'))
    .pipe(debug({ title: 'Debug for compile file:' }))
    .pipe(dest('dist/fonts'))
    .pipe(
      notify({
        onLast: true,
        message: 'Font File Task Complete!',
      })
    );
}

// Other File(EX. robots.txt)
function otherFile() {
  return src(filterExistPaths(PATHS.other.src), { base: './src/', allowEmpty: true })
    .pipe(cached('other'))
    .pipe(debug({ title: 'Debug for compile file:' }))
    .pipe(dest('dist'))
    .pipe(
      notify({
        onLast: true,
        message: 'TXT File Task Complete!',
      })
    );
}

// clean file
function clean() {
  return deleteAsync(['dist']);
}

// browserSync
function browsersyncInit(done) {
  browserSync.init({
    open: false, // 自動開啟瀏覽器
    notify: false, // 關閉瀏覽器右上角的通知
    ghostMode: false, // 是否同步各裝置瀏覽器滑動
    server: {
      baseDir: './dist',
      online: false,
    },
    // 使用 https 開發
    // Ref: https://ithelp.ithome.com.tw/articles/10230052
    // 1. 本機電腦產生憑證（電腦只要安裝一次）： $ mkcert -install
    // 2. 專案資料夾產生檔案： $ mkcert localhost 127.0.0.1 192.168.x.xxx ::1
    //    ※「192.168.x.xxx」要根據電腦不同更換
    // 3. 手機使用需另外安裝「1. 本機電腦產生憑證（電腦只要安裝一次）： $ mkcert -install」安裝的 rootCA.pem 檔案
    // ※↓要對照檔案名稱是否正確
    // https: {
    //   key: "localhost+3-key.pem",
    //   cert: "localhost+3.pem"
    // }
  });
  done();
}

// BrowserSync Reload
function browsersyncReload(done) {
  browserSync.reload();
  done();
}

// watch file
function watchFiles() {
  watch(PATHS.sass.src, { delay: 500 }, series(errorRemoveHandler, parallel(sassExportVendor, sassCompile)));
  watch(PATHS.js.src, series(errorRemoveHandler, jsFile, browsersyncReload));
  watch(PATHS.js.vendor, series(errorRemoveHandler, jsVendor, browsersyncReload));
  watch(PATHS.js.vendorMin, series(jsVendorMin, browsersyncReload));
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
const jsTask = series(errorRemoveHandler, jsFile, jsVendor, jsVendorMin, json);
const cssTask = series(errorRemoveHandler, sassExportVendor, sassCompile);
const imgTask = series(image, imageIco); // Removed imagePluginStartup
const htmlTask = series(pagePugNormal, pageHtml);
const otherTask = series(fontFile, otherFile);
const watchTask = parallel(browsersyncInit, watchFiles);

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
