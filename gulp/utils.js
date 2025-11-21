import fs from 'fs';
import { src, dest } from 'gulp';
import through from 'through2';
import replace from 'gulp-replace';
import { rollup as rollupAPI } from 'rollup';
import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

// [Helper] Filter non-existent paths
export function filterExistPaths(paths) {
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

// [Sourcemap 配置] 通用的 sourcemap 寫入配置
export function getSourcemapWriteConfig() {
    return {
        sourceRoot: function (file) {
            const filePathSplit = file.sourceMap.file.split('/');
            const backTrack = '../'.repeat(filePathSplit.length - 1) || '../';
            return backTrack + 'src/';
        },
    };
}

// [Rollup 包裝器] 自定義 Gulp plugin 包裝 Rollup API
export function gulpRollup(options = {}) {
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

// node sass display error
export function errorShowHandler(error) {
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
export function errorRemoveHandler(done) {
    if (!fs.existsSync('dist')) {
        if (done) done();
        return;
    }
    // console.log('Removing error from html files.'); // Optional logging
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

// 確認該資料夾內是否有物件
export function isDirEmpty(path) {
    if (!fs.existsSync(path)) return true;
    return fs.readdirSync(path).length === 0;
}
