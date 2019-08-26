const path = require('path');

module.exports = {
  // モード値を production に設定すると最適化された状態で、
  // development に設定するとソースマップ有効でJSファイルが出力される
  mode: 'development',
  // メインとなるJavaScriptファイル（エントリーポイント）
  entry: './src/controller/controller.ts',

  target: 'node',

  output: {
    path: path.join(__dirname, "static/js/"),
    filename: "[name].js",
  },

  module: {
    rules: [
      {
        // 拡張子 .ts の場合
        test: /\.ts$/,
        exclude: /node_modules/,
        // TypeScript をコンパイルする
        use: [
          { loader: "ts-loader" },
          {
            loader: 'tslint-loader',
            options: {
              typeCheck: true,
              fix: true,
            },
          },
        ],
      }
    ]
  },
  // import 文で .ts ファイルを解決するため
  resolve: {
    modules: [
      "node_modules"
    ],
    extensions: [
      '.ts', '.js'
    ]
  }
};
