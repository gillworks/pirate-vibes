const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./src/client/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "public"),
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|jpeg|gif|gltf|glb|obj|mtl)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/client/assets", to: "assets" },
        { from: "src/client/index.html", to: "index.html" },
        { from: "src/client/styles.css", to: "styles.css" },
      ],
    }),
  ],
};
