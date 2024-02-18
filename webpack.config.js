const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");
const BASE_DIR = __dirname;
const BUILD_DIR = path.join(BASE_DIR, 'build');
module.exports = {
  mode: 'development',
  entry: path.join(BASE_DIR, 'src/application/exports.ts'),
  output: {
    path: BUILD_DIR,
    filename: 'smoosic.js',
    library: 'Smo',
    libraryTarget: 'umd',
    libraryExport: 'default',
    globalObject: 'this'
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  devtool: 'source-map',
  externals: {
    jszip: 'JSZip'
  },
  stats: {
    assets: true,
    modules: true,
    outputPath: true,
    usedExports: true
  },
  module: {      
      rules: [{
      test: /(\.ts?$|\.js?$)/,
      include: { or: [
        path.resolve(BASE_DIR, 'src'), path.resolve(BASE_DIR, 'tests')
      ]},
      use: [{
        loader: 'ts-loader',
        options: {
          configFile: "tsconfig.json"
        }
      }]
    }]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/styles/", to: "styles/"}
      ]
    })
  ]
};