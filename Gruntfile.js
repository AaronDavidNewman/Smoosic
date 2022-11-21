const path = require('path');

module.exports = function (grunt) {
  // Used for eslint and docco
  const LINTS = [
  ]

  const BASE_DIR = __dirname;
  const BUILD_DIR = path.join(BASE_DIR, 'build');

  const webpackConfig = {
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
    module: {      
        rules: [{
        test: /(\.ts?$|\.js?$)/,
        exclude: /node_modules/,
        use: [{
          loader: 'ts-loader',
        }]
      }]
    }
  }

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    webpack: {
      build: webpackConfig
    },
    eslint: {
      target: LINTS,
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          cwd: 'src/styles/',
          src: ['*.*', '**/*'],
          dest: 'build/styles/'
        }]
      }
    },
    typedoc: {
      build: {
        options: {
          out: 'build/docs',
          name: 'Smoosic',
          tsconfig: 'tsconfig.json',
          excludeProtected: true,
          excludePrivate: true,
          categorizeByGroup: true,
          readme: 'readme.md',
          defaultCategory: ['Other'],
          categoryOrder: ['SmoObject', 'SmoModifier', 'SmoParameter', '*'],
          excludeNotDocumented: true
        },
        src: ['./typedoc.ts']
        /* src: ['./src/smo/data/*.ts', './src/smo/xform/*.ts', './src/smo/midi/*.ts',
          './src/smo/mxml/*.ts', './src/render/sui/*.ts', './src/render/vex/*.ts', './src/render/audio/*.ts',
          './src/application/*.ts', './src/ui/*.ts',
          './src/ui/buttons/*.ts',
          './src/ui/dialogs/*.ts', './src/ui/dialogs/components/*.ts',
          './src/ui/fileio/*.ts', './src/ui/i18n/*.ts',
          './src/ui/keyBindings/default/*.ts', './src/ui/menus/*.ts', './src/ui/ribbonLayout/default/defaultRibbon.ts',
          './src/common/promiseHelpers.ts'
        ],  */
      },
    }
  });

  // grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-eslint');
  // grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-typedoc');
  console.log(new Date());

  // Default task(s).
  grunt.registerTask('default', ['eslint', 'webpack:build', 'copy', 'typedoc']);
};
