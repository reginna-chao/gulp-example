import { src, dest } from 'gulp';
import plumber from 'gulp-plumber';
import cached from 'gulp-cached';
import debug from 'gulp-debug';
import sourcemaps from 'gulp-sourcemaps';
import uglify from 'gulp-uglify';
import rename from 'gulp-rename';
import notify from 'gulp-notify';
import gulpif from 'gulp-if';

import { filterExistPaths, getSourcemapWriteConfig, errorShowHandler, gulpRollup } from '../utils.js';

import { PATHS, env } from '../config.js';

// JS compile
export function jsFile() {
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
export function jsVendor() {
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
export function jsStatic() {
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
export function jsVendorMin() {
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
