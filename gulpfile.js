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

import {
  filterExistPaths,
  getSourcemapWriteConfig,
  gulpRollup,
  isDirEmpty,
  errorShowHandler,
  errorRemoveHandler,
} from './gulp/utils.js';

// css

import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass); // [css] Sass 編譯 (使用 dart-sass)

import autoprefixer from 'gulp-autoprefixer'; // [css] CSS自動前綴
import cleancss from 'gulp-clean-css'; // [css] CSS壓縮

// JS
import uglify from 'gulp-uglify'; // [JS] 壓縮JS

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

import { PATHS, env, setProduct } from './gulp/config.js';

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
      .pipe(gulpif(!env.isProduct, dest('dist/css')))
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
    .pipe(gulpif(!env.isProduct, dest('dist/js')))
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

// JS Static (Direct Copy)
function jsStatic() {
  return src(filterExistPaths(PATHS.js.static), { allowEmpty: true })
    .pipe(plumber())
    .pipe(cached('jsStatic'))
    .pipe(debug({ title: 'Debug for compile file:' }))
    .pipe(dest('dist/js'))
    .pipe(
      notify({
        onLast: true,
        message: 'JS Static Task Complete!',
      })
    );
}

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
const jsTask = series(errorRemoveHandler, jsFile, jsVendor, jsVendorMin, jsStatic, json);
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
