const miniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const glob = require("glob");

const PATHS = {
  src: path.join(__dirname, "src"),
};

module.exports = {
  entry: "./src/js/app.js",
  plugins: [new miniCssExtractPlugin()],
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    static: path.resolve(__dirname, "dist"),
    port: 8080,
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.(scss|css)$/,
        use: [
          {
            loader: miniCssExtractPlugin.loader,
          },
          {
            loader: "css-loader",
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: () => [require("autoprefixer")],
              },
            },
          },
          {
            loader: "sass-loader",
          },
        ],
      },
    ],
  },
};
