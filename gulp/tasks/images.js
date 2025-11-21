import { src, dest } from 'gulp';
import plumber from 'gulp-plumber';
import cached from 'gulp-cached';
import debug from 'gulp-debug';
import gulpIgnore from 'gulp-ignore';
import gulpif from 'gulp-if';
import notify from 'gulp-notify';
import imagemin, { mozjpeg, optipng } from 'gulp-imagemin';

import { filterExistPaths } from '../utils.js';
import { PATHS } from '../config.js';
import { browserSync } from '../server.js';

// image compile

// 如果命名結尾有"--uc"（例如：banner--uc.png, bg--uc.jpg），不會壓縮檔案，也不會重新命名
export function image() {
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
export function imageIco() {
  return src(filterExistPaths(PATHS.images.ico), { allowEmpty: true })
    .pipe(cached('imageIco'))
    .pipe(debug({ title: 'Debug for compile file:' }))
    .pipe(dest('dist'))
    .pipe(browserSync.stream());
}
