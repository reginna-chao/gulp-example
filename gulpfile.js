/*
 * Gulp 版本為 4+
 */

// init plugin
const { src, dest, watch, series, parallel } = require('gulp');
const browserSync = require('browser-sync').create(), // 建立同步虛擬伺服器
  // Tool
  fs = require('fs'),
  del = require('del'), // 清除檔案
  through = require('through2'), // 處理通過後的檔案
  gulpif = require('gulp-if'), // 就是 if ಠ_ಠ
  notify = require('gulp-notify'), // 通知訊息
  debug = require('gulp-debug'), // debug 監控處理檔案
  replace = require('gulp-replace'), // 取代文字
  rename = require('gulp-rename'), // 檔案重新命名
  gulpIgnore = require('gulp-ignore'), // [例外處理] 無視指定檔案
  plumber = require('gulp-plumber'), // [例外處理] gulp發生編譯錯誤後仍然可以繼續執行，不會強迫中斷
  cached = require('gulp-cached'), // [快取機制] 只傳遞修改過的文件
  sourcemaps = require('gulp-sourcemaps'), // [檔案追蹤] 來源編譯
  // css
  sass = require('gulp-sass')(require('node-sass')), // [css] Sass 編譯
  autoprefixer = require('gulp-autoprefixer'), // [css] CSS自動前綴
  cleancss = require('gulp-clean-css'), // [css] CSS壓縮
  inject = require('gulp-inject-string'), // HTML 插入 code (為了顯示Error)
  removeCode = require('gulp-remove-code'), // gulp 移除code (為了顯示Error)
  // JS
  uglify = require('gulp-uglify'), // [JS] 壓縮JS
  // babel = require('gulp-babel'), // [JS] 轉換ES6為ES5，將ES6語法轉換成瀏覽器能讀的ES5
  rollup = require('gulp-better-rollup'), // [JS] 
  rollupBabel = require('rollup-plugin-babel'), // [JS] 
  resolve = require('rollup-plugin-node-resolve'), // [JS] 
  commonjs = require('rollup-plugin-commonjs'), // [JS] 
  // Image
  imagemin = require('gulp-imagemin'), // [IMG] Image壓縮
  imageminPngquant = require('imagemin-pngquant'), // [IMG] PNG壓縮
  imageminGifsicle = require('imagemin-gifsicle'), // [IMG] GIF壓縮
  imageminJpegRecompress = require('imagemin-jpeg-recompress'), // [IMG] JPG壓縮
  // HTML
  pug = require('gulp-pug'), // [HTML / PUG] 編譯 PUG（PUG模板）
  // Icon(Icon Font)
  iconfont = require('gulp-iconfont'), // [ICON FONT] 編譯font檔案
  consolidate = require('gulp-consolidate'); // [ICON FONT] 編譯Demo html + icon.scss

// [font icon] function
const fontName = 'icon', fontClassName = 'be-icon';
const runTimestamp = Math.round(Date.now()/1000);

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
    fs.readdirSync('src/images/font_svg/').forEach( file => {
      str = str + ` @mixin font-icon-${file.replace(/\.svg/g, '')}() {};`
    });

    fs.writeFile('src/sass/vendor/font/_icons.scss', str, cb);
  }
}
// 確認該資料夾內是否有物件
function isDirEmpty(path) {
  return fs.readdirSync(path).length === 0;
}

// [font icon] 建立
function iconFont(done){
  return src(['src/images/font_svg/*.svg'], {base: './src/'})
    // .pipe(cached('iconFont'))
    .pipe(iconfont({
      fontName: fontName,
      formats: ['svg', 'ttf', 'eot', 'woff', 'woff2'],
      appendCodepoints: true,
      appendUnicode: false,
      normalize: true,
      centerHorizontally: true,
      fontHeight: 1001,
      descent: 143,
      timestamp: runTimestamp // 官方提供的 API ，避免有快取
    }))
    .on('glyphs', function (glyphs, options) {
      // 生成 ICON SCSS
      src('src/sass/vendor/font/templates/_icons.scss')
        .pipe(consolidate('underscore', {
          glyphs: glyphs,
          fontName: options.fontName, // 使用的font-family
          fontPath: '../fonts/icons/', // 生成的SCSS讀取font檔案讀取位置
          cssClass: fontClassName // 使用的class名稱: <i class="{{fontClassName}} {{fontClassName}}-{{svg file name}}"></i>
        }))
        .pipe(dest('src/sass/vendor/font')) // 生成SCSS位置
        .on ('end', async() => {
          // sassCompile(useCached===false) => 不使用Cache功能
          errorMsgRemove();
          await sassCompile(false);
          done();
        });

      // 生成 ICON CSS (Demo HTML使用)
      src('src/sass/vendor/font/templates/_icons.scss')
        .pipe(consolidate('underscore', {
          glyphs: glyphs,
          fontName: options.fontName,
          fontPath: '',
          cssClass: fontClassName
        }))
        .pipe(replace(/\/\/ @include/g, '@include')) // 開啟@include
        .pipe(rename({basename: "icons"}))
        .pipe(sass({outputStyle: 'expanded'}))
        .pipe(dest('dist/fonts/icons'));

      // 生成 Demo CSS (Demo HTML使用)
      src('src/sass/vendor/font/templates/_iconfont-demo.scss')
        .pipe(rename({basename: "iconfont-demo", extname: '.css'}))
        .pipe(dest('dist/fonts/icons'));

      // 複製 Demo 使用的 JS Plugin (Demo HTML使用)
      src('src/sass/vendor/font/templates/*.js')
        .pipe(dest('dist/fonts/icons'));

      // 生成Demo HTML
      src('src/sass/vendor/font/templates/_index.html')
        .pipe(consolidate('underscore', {
          glyphs: glyphs,
          fontName: options.fontName,
          cssClass: fontClassName,
          fontYYYY: new Date().getYear() + 1900
        }))
        .pipe(rename({basename: 'index'}))
        .pipe(dest('dist/fonts/icons'));
    })
    .pipe(dest('dist/fonts/icons/'))              //生成的font檔案
    .pipe(notify({
      onLast: true,
      message: 'Font icon Task Complete!'
    }));
}

// node sass delete commend function
let errorShow = false
function errorMsgRemove(done){
  if (errorShow) {
    errorShow = false;
    src('dist/*.html')
    .pipe(removeCode({ production: true }))
    .pipe(dest('dist'));
  }
  if(typeof done === 'function' ) {
    done();
  }
}

// node sass display error
function errorMsgDisplay(error){
  errorShow = true;
  console.log(error.message)
  var errorString = '[' + error.plugin + ']';
  errorString += ' ' + error.message.replace("\n",'\n')
  // [START] JS Babel 會出現的錯誤有命令提示字元的格式
  errorString = errorString.replace(//g, '');
  errorString = errorString.replace(/\[0m|\[33m|\[36m/g, '');
  errorString = errorString.replace(/\[90m/g, '<span style="color:gray;">');
  errorString = errorString.replace(/\[31m\[1m/g, '<span style="color:red;">');
  errorString = errorString.replace(/\[22m|\[39m/g, '</span>');
  // [END] JS Babel 會出現的錯誤有命令提示字元的格式
  var last_error_str =
  '\n============[Error Message]============\n\n' +
  errorString +
  '\n\n=======================================\n';
  var error_msg =
  "<!--removeIf(production)-->\
  <div class='_error-msg_' style='position:fixed;z-index:9999;top:0;left:0;width:100vw;height:100vh;font-size:18px;white-space:pre-line;font-family: monospace;padding:20px;overflow: auto;background: rgba(0,0,0,0.8);color: white;'>\
    <div class='_error-msg__text-box_' style='display:flex;justify-content:center;padding:20px;'>\
    <div class='_error-msg__text_' style='max-width: 100%;'>"
        + String(last_error_str) +
      "</div>\
    </div>\
  </div>\
  <!--endRemoveIf(production)-->\
  "
  src('dist/*.html')
    .pipe(inject.after('</head>', error_msg))
    .pipe(dest('dist'));
}
// sass compiler
let sassReload = false;
function sassCompile(useCached){
  return src('src/sass/**/*.+(scss|sass)')
    .pipe(plumber())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sass({outputStyle: 'expanded'}).on('error', function(err){
      errorMsgDisplay(err);
      this.emit('end');
      sassReload = true;
      browserSync.reload();
    }))
    // .pipe(autoprefixer('last 2 version', 'ie 11', 'ios 8', 'android 4')) // 要符合 IE11，二擇一
    .pipe(autoprefixer()) // 不需要符合 IE11，二擇一
    .pipe(cached('sass'))
    .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(dest('dist/css'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(cleancss({ rebase: false }))
    .pipe(sourcemaps.write('maps', {
      sourceRoot: function(file) {
        var filePathSplit = file.sourceMap.file.split('/');
        var backTrack = '../'.repeat(filePathSplit.length-1) || '../' ;
        var filePath = backTrack+ 'src/';
        return filePath;
      }
    }))
    .pipe(dest('dist/css'))
    // .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(sassReload ? sassReloadHandler() : browserSync.stream({match: '**/*.css'}))
    .pipe(notify({
      onLast: true,
      message: 'CSS Task Complete!'
    }));
}

// sass export vendor
function sassExportVendor(){
  return src('src/sass/vendor/**/*.css')
    .pipe(cached('sassVendor'))
    .pipe(dest('dist/css/vendor'));
}

function sassReloadHandler() {
  sassReload = false;
  browserSync.reload();
}

// image compile
// 如果命名結尾有"--uc"（例如：banner--uc.png, bg--uc.jpg），不會壓縮檔案，也不會重新命名
function image(){
  return src('src/images/**/*')
    .pipe(plumber())
    .pipe(cached('image'))
    .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(gulpIgnore.exclude('**--nocopy.*'))
    .pipe(
      gulpif('!**/*--uc.*', imagemin([
        imageminGifsicle({interlaced: true}),
  
        // [jpg] quality setting
        // 原設定數字：Max: 75, min: 60
        imageminJpegRecompress({
          quality: 'veryhigh',
          progressive: true,
          max: 75,/* 符合google speed 範疇 */
          min: 60
        }),
  
        // [png] quality setting
        // Type: Array<min: number, max: number>
        // 原設定數字：[0.8, 0.9]
        imageminPngquant({quality: [0.8, 0.9]})
  
        // [svg] quality setting
        // svg壓縮怕會壓縮到不該壓縮的程式碼，導致動畫無法製作
        // 目前需自行壓縮整理處理svg檔案
        // SVG線上壓縮：https://jakearchibald.github.io/svgomg/
        // imagemin.svgo({plugins: [{removeViewBox: false}]}) 
      ]))
    )
    .pipe(dest('dist/images'))
    .pipe(browserSync.stream())
    .pipe(notify({
      onLast: true,
      message: 'Pic task Compressed!'
    }));
}

// ICO(Favicon)※位於第一層的ico
function imageIco() {
  return src('src/*.ico')
  .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(dest('dist'))
    .pipe(browserSync.stream());
}

// JS compile
function jsFile(){
  return src([
      'src/js/**/*.js',
      '!src/js/**/_*.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation}/**/*.*',
    ])
    .pipe(
      plumber(function(error) {
        console.log(error.message);
        errorMsgDisplay(error)
        this.emit('end');
      })
    )
    .pipe(cached('js'))
    .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(rollup({
      output: {
        strick: false
      },
      plugins: [
        commonjs(),
        resolve(),
        rollupBabel({
          runtimeHelpers: true
        })
      ]
    },{
      format: 'iife'
    }))
    // .pipe(babel())
    .pipe(dest('dist/js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(sourcemaps.write('maps', {
      sourceRoot: function(file) {
        var filePathSplit = file.sourceMap.file.split('/');
        var backTrack = '../'.repeat(filePathSplit.length-1) || '../' ;
        var filePath = backTrack+ 'src/';
        return filePath;
      }}
    ))
    .pipe(dest('dist/js'))
    .pipe(notify({
      onLast: true,
      message: 'JS Task Complete!'
    }));
}

// JS vendor compile
function jsVendor(){
  return src([
      'src/js/{vendor,lib,plugin,plugins,foundation}/**/*.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation}/**/*.min.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation}/**/*-min.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation}/**/_*.js',
      '!src/js/**/{i18n,l10n}/**/*.js',
    ])
    .pipe(
      plumber(function(error) {
        console.log(error.message);
        errorMsgDisplay(error)
        this.emit('end');
      })
    )
    .pipe(cached('jsVendor'))
    .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(rollup({
      plugins: [
        commonjs(),
        resolve(),
        rollupBabel({
          runtimeHelpers: true
        })
      ]
    },{
      format: 'iife'
    }))
    // .pipe(babel())
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest('dist/js'))
    .pipe(notify({
      onLast: true,
      message: 'JS Plugin Task Complete!'
    }));
}
// JS Vendor Min compile
function jsVendorMin(){
  return src([
      'src/js/{vendor,lib,plugin,plugins,foundation}/**/*.min.js',
      'src/js/{vendor,lib,plugin,plugins,foundation}/**/*-min.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation}/**/_*.min.js',
      'src/js/**/{i18n,l10n}/**/*.js',
    ])
    .pipe(plumber())
    .pipe(cached('jsVendorMin'))
    .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(dest('dist/js'))
    .pipe(notify({
      onLast: true,
      message: 'JS Plugin Task Complete!'
    }));
}

// JSON File
function json() {
  return src([
      'src/json/**/*.json',
      '!src/json/**/_*.json'
    ])
    .pipe(plumber())
    .pipe(cached('json'))
    .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(dest('dist/json'))
    // Minify
    // .pipe(rename({suffix: '.min'}))
    // .pipe(jsonminify())
    // .pipe(dest('dist/json'))
    .pipe(notify({
      onLast: true,
      message: 'JSON File Task Complete!'
    }));
}

// Pug
// 一般非layout（非底線開頭檔案） => 看watch才能看的出來
function pagePugNormal() {
  return src(['src/**/*.pug', '!src/**/_*.pug'])
    .pipe(
      plumber( function(error) {
        console.log(error.message);
        errorMsgDisplay(error)
        this.emit('end');
      })
    )
    .pipe(cached('pug'))
    .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(pug({
      pretty: true,
      compileDebug: true
    }))
    .pipe(dest('dist'))
    .pipe(notify({
      onLast: true,
      message: 'Pug Task Complete!'
    }));
}

// 用於layout（底線開頭檔案）：確認檔案是否有更改
function pagePugLayoutCheck() {
  var fileList = [];
  return src(['src/**/_*.pug'])
    .pipe(
      plumber( function(error) {
        console.log(error.message);
        errorMsgDisplay(error)
        this.emit('end');
      })
    )
    .pipe(cached('pugLayout'))
    .pipe(through.obj(function (file, enc, cb) {
        fileList.push(file.path);
        cb(null);
    }))
    .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(notify({
      onLast: true,
      message: 'Pug Layout Check Task Complete!'
    }))
    .on ('end', function () {
        if (fileList.length > 0) {
          pagePugLayoutBuild()
        }
    });
}

// 用於layout（底線開頭檔案）：生成所有頁面檔案
// const timestamp = (new Date()).getTime();
function pagePugLayoutBuild() {
  return src(['src/**/*.pug', '!src/**/_*.pug'])
    .pipe(
      plumber( function(error) {
        console.log(error.message);
        errorMsgDisplay(error)
        this.emit('end');
      })
    )
    .pipe(debug({title: '__Build all page file:'}))
    .pipe(pug({
      pretty: true,
      compileDebug: true
    }))
    .pipe(dest('dist'))
    .pipe(notify({
      onLast: true,
      message: 'Pug Layout Build Task Complete!'
    }));
}

function pageHtml() {
  return src(['src/**/*.html', '!src/**/_*.html'])
    .pipe(cached('html'))
    .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(dest('dist'))
    .pipe(notify({
      onLast: true,
      message: 'HTML File Task Complete!'
    }));
}

// Font File
function fontFile() {
  return src([
      'src/fonts/**/*',
    ])
    .pipe(cached('font'))
    .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(dest('dist/fonts'))
    .pipe(notify({
      onLast: true,
      message: 'Font File Task Complete!'
    }));
}

// Other File(EX. robots.txt)f
function otherFile() {
  return src([
    './src/*.md',
    './src/.htaccess',
    './src/**/*.txt',
    './src/download/**/*.*',
    './src/pdf/**/*.*'
  ], {base: './src/'})
    .pipe(cached('other'))
    .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(dest('dist'))
    .pipe(notify({
      onLast: true,
      message: 'TXT File Task Complete!'
    }));
}

// clean file
function clean(){
  return del(['dist']);
}

// browserSync
function browsersyncInit(done) {
  browserSync.init({
    open: false, // 自動開啟
    ghostMode: false, // 是否同步各裝置瀏覽器滑動
    server: {
      baseDir: "./dist",
      online: false
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
  watch(
    'src/sass/**/*.+(scss|sass)', 
    series(errorMsgRemove, sassExportVendor, sassCompile)
  );
  watch(
    [
      'src/js/**/*.js',
      '!src/js/**/_*.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation}/**/*.*',
    ],
    series(errorMsgRemove, jsFile, browsersyncReload)
  );
  watch(
    [
      'src/js/{vendor,lib,plugin,plugins,foundation}/**/*.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation}/**/*.min.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation}/**/*-min.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation}/**/_*.js',
      '!src/js/**/{i18n,l10n}/**/*.js',
    ],
    series(jsVendor, browsersyncReload)
  );
  watch(
    [
      'src/js/{vendor,lib,plugin,plugins,foundation}/**/*.min.js',
      'src/js/{vendor,lib,plugin,plugins,foundation}/**/*-min.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation}/**/_*.min.js',
      'src/js/**/{i18n,l10n}/**/*.js',
    ],
    series(jsVendorMin, browsersyncReload)
  );
  watch(['src/json/**/*.json', '!src/json/**/_*.json'], series( json, browsersyncReload ));
  watch('src/images/**/*', image);
  watch('src/*.ico', imageIco);
  watch('src/images/font_svg/*.svg', series(iconFont, browsersyncReload));
  watch('src/sass/vendor/font/templates/*.*', series(iconFont, browsersyncReload));
  watch([
    './src/*.md',
    './src/.htaccess',
    'src/**/*.txt',
    'src/download/**/*.*',
    'src/pdf/**/*.*'
  ], otherFile);
  watch('src/fonts/**/*', fontFile);
  
  watch(['src/**/*.pug', '!src/**/_*.pug'], series(errorMsgRemove, pagePugNormal, browsersyncReload));
  watch(['src/**/_*.pug'], series(errorMsgRemove, pagePugLayoutCheck, browsersyncReload));
  watch(
    ['src/**/*.html', '!src/**/_*.html'] ,
    series(pageHtml, browsersyncReload)
  );
}

// define complex tasks
const jsTask = series(errorMsgRemove, jsFile, jsVendor, jsVendorMin, json);
const cssTask = series(errorMsgRemove, sassExportVendor, sassCompile);
const imgTask = series(image, imageIco);
const htmlTask = series(pagePugNormal, pageHtml);
const otherTask = series(fontFile, otherFile);
const watchTask = parallel(watchFiles, browsersyncInit);
const buildTask = series(clean, iconFontCreateEmptyFile, parallel(iconFont, imgTask, jsTask, cssTask, htmlTask, otherTask) ,watchTask);

// export tasks
exports.default = buildTask;
