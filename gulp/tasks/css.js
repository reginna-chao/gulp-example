import { src, dest } from 'gulp';
import gulpif from 'gulp-if';
import debug from 'gulp-debug';
import rename from 'gulp-rename';
import plumber from 'gulp-plumber';
import cached from 'gulp-cached';
import sourcemaps from 'gulp-sourcemaps';
import notify from 'gulp-notify';

import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);

import autoprefixer from 'gulp-autoprefixer';
import cleancss from 'gulp-clean-css';

import { filterExistPaths, getSourcemapWriteConfig, errorShowHandler } from '../utils.js';

import { PATHS, env } from '../config.js';
import { browserSync } from '../server.js';

// sass compiler
let sassReload = false;
export function sassCompile(useCached) {
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
          quietDeps: true, // 忽略 node_modules 的警告
          silenceDeprecations: ['import'], // 忽略 @import 的警告
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
export function sassExportVendor() {
  return src(filterExistPaths(PATHS.sass.vendor), { allowEmpty: true })
    .pipe(cached('sassVendor'))
    .pipe(dest('dist/css/vendor'));
}

function sassReloadHandler() {
  sassReload = false;
  browserSync.reload();
  return browserSync.stream({ match: '**/*.css' });
}
