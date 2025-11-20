module.exports = {
	// 基本設定
	trailingComma: 'es5',
	semi: true,
	singleQuote: true,

	// 縮排設定
	printWidth: 120, // 一行的字符數，如果超過會進行換行
	tabWidth: 4, // 一個 tab 代表幾個空格數
	useTabs: true, // 使用 tab 而非空格

	// 檔案結尾設定
	endOfLine: 'auto', // 自動處理換行符號
	insertFinalNewline: true, // 檔案最後留一空行（需要 EditorConfig 或編輯器支援）

	// 覆寫特定檔案類型的設定
	overrides: [
		{
			files: '*.scss',
			options: {
				singleQuote: true,
			},
		},
	],
};
