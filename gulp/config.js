// [路徑配置] 統一管理所有檔案路徑
export const PATHS = {
  js: {
    src: [
      'src/js/**/*.js',
      '!src/js/**/_*.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation,bootstrap,static}/**/*.*',
    ],
    vendor: [
      'src/js/{vendor,lib,plugin,plugins,foundation,bootstrap}/**/*.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation,bootstrap}/**/*.min.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation,bootstrap}/**/*-min.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation,bootstrap}/**/_*.js',
      '!src/js/**/{i18n,l10n}/**/*.js',
    ],
    vendorMin: [
      'src/js/{vendor,lib,plugin,plugins,foundation,bootstrap}/**/*.min.js',
      'src/js/{vendor,lib,plugin,plugins,foundation,bootstrap}/**/*-min.js',
      '!src/js/{vendor,lib,plugin,plugins,foundation,bootstrap}/**/_*.min.js',
      'src/js/**/{i18n,l10n}/**/*.js',
    ],
    static: 'src/js/static/**/*.js',
  },
  sass: {
    src: 'src/sass/**/*.+(scss|sass)',
    vendor: 'src/sass/vendor/**/*.css',
  },
  pug: {
    src: ['src/**/*.pug', '!src/**/_*.pug'],
    layout: ['src/**/_*.pug'],
  },
  html: {
    src: ['src/**/*.html', '!src/**/_*.html'],
  },
  images: {
    src: 'src/images/**/*',
    ico: 'src/*.ico',
    fontSvg: 'src/images/font_svg/*.svg',
  },
  json: {
    src: ['src/json/**/*.json', '!src/json/**/_*.json'],
  },
  fonts: {
    src: 'src/fonts/**/*',
  },
  other: {
    src: ['./src/*.md', './src/.htaccess', './src/**/*.txt', './src/download/**/*.*', './src/pdf/**/*.*'],
  },
};

// 環境變數
export const env = {
  isProduct: false,
};

export function setProduct(done) {
  env.isProduct = true;
  done();
}
