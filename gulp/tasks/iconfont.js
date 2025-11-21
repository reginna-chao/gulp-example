import { src, dest } from 'gulp';
import fs from 'fs';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import notify from 'gulp-notify';
import iconfont from 'gulp-iconfont';
import consolidate from 'gulp-consolidate';

import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
import cleancss from 'gulp-clean-css';

import { isDirEmpty, errorRemoveHandler } from '../utils.js';
import { sassCompile } from './css.js';

// [font icon] function
const fontName = 'icon',
  fontClassName = 'be-icon';
const runTimestamp = Math.round(Date.now() / 1000);

// [font icon] 先建立空值檔案，避免一開始有錯誤，之後會被蓋過
export function iconFontCreateEmptyFile(cb) {
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
      str = str + ` @mixin font-icon-${file.replace(/\\.svg/g, '')}() {};`;
    });

    fs.writeFile('src/sass/vendor/font/_icons.scss', str, cb);
  }
}

export function iconFont(done) {
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
        // 處理 glyphs，移除 .svg 擴展名
        const processedGlyphs = glyphs.map((glyph) => ({
          ...glyph,
          name: glyph.name.replace(/\.svg$/, ''), // 移除 .svg 擴展名
        }));

        // 生成 ICON SCSS
        src('src/sass/vendor/font/templates/_icons.scss')
          .pipe(
            consolidate('underscore', {
              glyphs: processedGlyphs,
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
              glyphs: processedGlyphs,
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
