import { src, dest } from 'gulp';
import plumber from 'gulp-plumber';
import cached from 'gulp-cached';
import debug from 'gulp-debug';
import notify from 'gulp-notify';
import through from 'through2';
import pug from 'gulp-pug';

import { filterExistPaths, errorShowHandler } from '../utils.js';
import { PATHS } from '../config.js';

// Pug
// 一般非layout（非底線開頭檔案） => 看watch才能看的出來
export function pagePugNormal() {
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
export function pagePugLayoutCheck() {
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
export function pagePugLayoutBuild() {
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

export function pageHtml() {
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
