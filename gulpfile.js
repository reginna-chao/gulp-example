// init plugin
const { src, dest, watch, series, parallel } = require('gulp');
const browserSync = require('browser-sync').create(), // 建立同步虛擬伺服器
  // Tool
  del = require('del'), // 清除檔案
  through = require('through2'), // 處理通過後的檔案
  pipe = require('multipipe'),
  lazypipe = require('lazypipe'), // 分離pipe，可分別處理檔案
  gulpif = require('gulp-if'), // 就是 if ಠ_ಠ
  notify = require('gulp-notify'), // 通知訊息
  debug = require('gulp-debug'), // debug 監控處理檔案
  replace = require('gulp-replace'), // 取代文字
  rename = require('gulp-rename'), // 檔案重新命名
  gulpIgnore = require('gulp-ignore'), // [例外處理] 無視指定檔案
  plumber = require('gulp-plumber'), // [例外處理] gulp發生編譯錯誤後仍然可以繼續執行，不會強迫中斷
  // changed = require('gulp-changed'), // [例外處理] 找出哪些檔是被修改過的
  cached = require('gulp-cached'), // [快取機制] 只傳遞修改過的文件
  sourcemaps = require('gulp-sourcemaps'), // [檔案追蹤] 來源編譯
  // css
  sass = require('gulp-sass'), // [css] Sass 編譯
  autoprefixer = require('gulp-autoprefixer'), // [css] CSS自動前綴
  cleancss = require('gulp-clean-css'), // [css] CSS壓縮
  inject = require('gulp-inject-string'), // HTML 插入 code (為了顯示Error)
  removeCode = require('gulp-remove-code'), // gulp 移除code (為了顯示Error)
  // JS
  jshint = require('gulp-jshint'), // [JS] JS檢查錯誤
  uglify = require('gulp-uglify'), // [JS] 壓縮JS
  babel = require('gulp-babel'), // [JS] 轉換ES6為ES5，將ES6語法轉換成瀏覽器能讀的ES5
  // Image
  imagemin = require('gulp-imagemin'), // [IMG] Image壓縮
  imageminPngquant = require('imagemin-pngquant'), // [IMG] PNG壓縮
  imageminGifsicle = require('imagemin-gifsicle'), // [IMG] GIF壓縮
  imageminJpegRecompress = require('imagemin-jpeg-recompress'), // [IMG] JPG壓縮
  // HTML
  pug = require('gulp-pug'), // [HTML / PUG] 編譯 PUG（PUG模板）
  useref = require('gulp-useref'), // [HTML] 合併檔案（需指定於html）
  // Icon(Icon Font)
  iconfont = require('gulp-iconfont'), // [ICON FONT] 編譯font檔案
  consolidate = require('gulp-consolidate'); // [ICON FONT] 編譯Demo html + icon.scss

// font icon function
const fontName = 'icon', fontClassName = 'be-icon';
function iconFont(done){
  return src(['src/images/font_svg/*.svg'], {base: './src/'})
    // .pipe(changed('src/images/font_svg/*.svg',{
    //   extension: '.svg',
    //   hasChanged: changed.compareLastModifiedTime
    // }))
    // .pipe(cached('iconFont'))
    .pipe(iconfont({
      fontName: fontName,
      formats: ['svg', 'ttf', 'eot', 'woff', 'woff2'],
      appendCodepoints: true,
      appendUnicode: false,
      normalize: true,
      centerHorizontally: true,
      fontHeight: 1001,
      descent: 143
    }))
    .on('glyphs', function (glyphs, options) {
      // 生成 ICON SCSS
      var nowTime = new Date().getTime();
      src('src/sass/vendor/font/templates/_icons.scss')
        .pipe(consolidate('underscore', {
          glyphs: glyphs,
          fontName: options.fontName, // 使用的font-family
          fontPath: '../fonts/icons/', // 生成的SCSS讀取font檔案讀取位置
          fontDate: nowTime, // 避免有快取問題
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
          fontDate: nowTime,
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
  done();
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
  <div class='_error-msg_' style='position:fixed;z-index:9999;top:0;left:0;width:100vw;height:100vh;font-size:18px;white-space: pre;font-family: monospace;padding:20px;overflow: auto;background: rgba(0,0,0,0.8);color: white;'>\
    <div class='_error-msg__text-box_' style='display:flex;justify-content:center;padding:20px;'>\
      <div class='_error-msg__text_'>"
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
sass.compiler = require('node-sass');
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
    .pipe(autoprefixer('last 2 version', 'ie 11', 'ios 8', 'android 4'))
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
    // .pipe(changed('dist/css', {
    //   extension: '.css',
    //   hasChanged: changed.compareSha1Digest
    // }))
    .pipe(cached('sassVendor'))
    .pipe(dest('dist/css/vendor'));
}

function sassReloadHandler() {
  sassReload = false;
  browserSync.reload();
}

// image compile
function image(){
  return src('src/images/**/*')
    .pipe(plumber())
    // .pipe(changed('dist/images'))
    .pipe(cached('image'))
    .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      // [jpg] quality setting
      // 原設定數字：Max: 95, min: 40
      imageminJpegRecompress({
        quality: 'veryhigh',
        progressive: true,
        max: 75,/* 符合google speed 範疇 */
        min: 60
      }),
      // [png] quality setting
      // 原設定數字：Type: Array<min: number, max: number>
      imageminPngquant({quality: [0.8, 0.9]})

      // [svg] quality setting
      // svg壓縮怕會壓縮到不該壓縮的程式碼，導致動畫無法製作
      // 目前需自行壓縮整理處理svg檔案
      // SVG線上壓縮：https://jakearchibald.github.io/svgomg/
      // imagemin.svgo({plugins: [{removeViewBox: false}]}) 
    ]))
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
      'src/js/*.js',
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
    // .pipe(changed('dist/js', { extension: '.js' }))
    .pipe(cached('js'))
    .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(jshint())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(babel())
    .pipe(gulpIgnore.exclude('vendor/**/*.*'))
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
    // .pipe(browserSync.stream())
    .pipe(notify({
      onLast: true,
      message: 'JS Task Complete!'
    }));
}
// JS vendor compile
function jsVendor(){
  return src([
      'src/js/{vendor,lib,plugin,plugins,foundation}/**/*.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation}/**/_*.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation}/**/*.min.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation}/**/*-min.js'
    ])
    .pipe(
      plumber(function(error) {
        console.log(error.message);
        errorMsgDisplay(error)
        this.emit('end');
      })
    )
    // .pipe(changed('dist/js', { extension: '.js' }))
    .pipe(cached('jsVendor'))
    .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(jshint())
    .pipe(babel())
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(dest('dist/js'))
    // .pipe(browserSync.stream())
    .pipe(notify({
      onLast: true,
      message: 'JS Plugin Task Complete!'
    }));
}
// JS Vendor Min compile
function jsVendorMin(){
  return src([
      'src/js/{vendor,lib,plugin,plugins,foundation}/**/*.min.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation}/**/_*.min.js',
      'src/js/{vendor,lib,plugin,plugins,foundation}/**/*-min.js'
    ])
    .pipe(plumber())
    // .pipe(changed('dist/js', { extension: '.js' }))
    .pipe(cached('jsVendorMin'))
    .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(jshint())
    .pipe(dest('dist/js'))
    // .pipe(browserSync.stream())
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
    // .pipe(changed('dist/json', { extension: '.json' }))
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
    .pipe(useref({}, lazypipe().pipe(sourcemaps.init, { loadMaps: true })))
    .pipe(gulpif( '*.js', pipe(babel(), uglify(), sourcemaps.write('js/maps')) ))
    .pipe(gulpif( '*.css', pipe(cleancss({ rebase: false }), sourcemaps.write('css/maps')) ))
    // .pipe(replace('.css"', '.css?v=' + timestamp + '"'))
    // .pipe(replace('.js"', '.js?v=' + timestamp + '"'))
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
      message: 'Pug Layout Task Complete!'
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
    .pipe(useref({}, lazypipe().pipe(sourcemaps.init, { loadMaps: true })))
    .pipe(gulpif( '*.js', pipe(babel(), uglify(), sourcemaps.write('js/maps')) ))
    .pipe(gulpif( '*.css', pipe(cleancss({ rebase: false }), sourcemaps.write('css/maps')) ))
    // .pipe(replace('.css"', '.css?v=' + timestamp + '"'))
    // .pipe(replace('.js"', '.js?v=' + timestamp + '"'))
    .pipe(dest('dist'))
}

// 為了監聽_*.js更改而設置的
function pagePugForUseref() {
  return src(['src/index.pug'])
    .pipe(
      plumber( function(error) {
        console.log(error.message);
        errorMsgDisplay(error)
        this.emit('end');
      })
    )
    // .pipe(cached('pugUseref'))
    .pipe(debug({title: 'Debug for compile file:'}))
    .pipe(pug({
      pretty: true,
      compileDebug: true
    }))
    .pipe(useref({}, lazypipe().pipe(sourcemaps.init, { loadMaps: true })))
    .pipe(gulpif( '*.js', pipe(babel(), uglify(), sourcemaps.write('js/maps')) ))
    .pipe(gulpif( '*.css', pipe(cleancss({ rebase: false }), sourcemaps.write('css/maps')) ))
    // .pipe(replace('.css"', '.css?v=' + timestamp + '"'))
    // .pipe(replace('.js"', '.js?v=' + timestamp + '"'))
    .pipe(dest('dist'))
    .pipe(notify({
      onLast: true,
      message: 'Pug Useref Task Complete!'
    }));
}

function pageHtml() {
  return src(['src/**/*.html', '!src/**/_*.html'])
    // .pipe(changed('dist', { extension: '.html' }))
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
    // .pipe(changed('dist/fonts/'))
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
    './src/**/*.txt',
    './src/download/**/*.*',
    './src/pdf/**/*.*'
  ], {base: './src/'})
    // .pipe(changed('dist'))
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
    open: false,
    ghostMode: false,
    server: {
      baseDir: "./dist",
      online: false
    }
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
    // series(jsFile, jsVendor, jsVendorMin, browsersyncReload)
    series(errorMsgRemove, jsFile, browsersyncReload)
  );
  watch(
    [
      'src/js/{vendor,lib,plugin,plugins,foundation}/*.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation}/**/*.min.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation}/**/*-min.js',
    ],
    series(jsVendor, browsersyncReload)
  );
  watch(
    [
      'src/js/{vendor,lib,plugin,plugins,foundation}/**/*.min.js',
      'src/js/{vendor,lib,plugin,plugins,foundation}/**/*-min.js',
    ],
    series(jsVendorMin, browsersyncReload)
  );
  watch(['src/json/**/*.json', '!src/json/**/_*.json'], series( json, browsersyncReload ));
  watch('src/images/**/*', image);
  watch('src/*.ico', imageIco);
  watch('src/images/font_svg/*.svg', series(iconFont, browsersyncReload));
  watch('src/sass/vendor/font/templates/*.*', series(iconFont, browsersyncReload));
  watch([ 'src/**/*.txt', 'src/download/**/*.*', 'src/pdf/**/*.*' ], otherFile);
  watch('src/fonts/**/*', fontFile);
  
  watch(['src/**/*.pug', '!src/**/_*.pug'], series(errorMsgRemove, pagePugNormal, browsersyncReload));
  watch(['src/**/_*.pug'], series(errorMsgRemove, pagePugLayoutCheck, browsersyncReload));
  watch(['src/js/_*.js'], series(errorMsgRemove, pagePugForUseref, browsersyncReload) ); // 僅提供給Useref使用
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
const buildTask = series(clean, parallel(iconFont, imgTask, jsTask, cssTask, htmlTask, otherTask) ,watchTask);

// export tasks
exports.default = buildTask;
