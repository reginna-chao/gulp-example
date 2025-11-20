module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jest: true,
    node: true,
  },
  parser: '@babel/eslint-parser',
  extends: ['standard', 'plugin:prettier/recommended'],
  // add your custom rules here
  rules: {
    semi: [2, 'always'],
    indent: [2, 2],
    'no-tabs': 0,
    'no-console': 'off',
  },
  'prettier/prettier': [
    'error',
    {
      endOfLine: 'auto',
    },
  ],
};
