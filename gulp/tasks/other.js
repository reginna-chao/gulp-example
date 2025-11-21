import { src, dest } from 'gulp';
import plumber from 'gulp-plumber';
import cached from 'gulp-cached';
import debug from 'gulp-debug';
import notify from 'gulp-notify';

import { filterExistPaths } from '../utils.js';
import { PATHS } from '../config.js';

// JSON File
export function json() {
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

// Font File
export function fontFile() {
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
export function otherFile() {
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
