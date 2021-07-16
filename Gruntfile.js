const path = require('path');
const webpack = require('webpack');

module.exports = function (grunt) {
  // Used for eslint and docco
  const LINTS = ['src/common/musicHelpers.js',
    'src/smo/data/measure.js','src/smo/data/note.js','src/smo/data/score.js',
  'src/smo/xform/beamers.js','src/smo/xform/audioTrack.js',
  'src/smo/data/noteModifiers.js','src/smo/data/systemStaff.js','src/smo/data/scoreModifiers.js',
  'src/smo/data/tuplet.js','src/smo/data/staffModifiers.js',
  'src/smo/mxml/xmlScore.js','src/smo/mxml/xmlState.js','src/smo/mxml/xmlHelpers.js',
  'src/smo/mxml/smo2Xml.js',
  'src/smo/xform/operations.js', 'src/smo/xform/undo.js', 'src/smo/xform/tickMap.js', 'src/smo/xform/actions.js', 'src/smo/xform/toVex.js',
  'src/smo/xform/copypaste.js','src/smo/xform/selections.js',
  'src/render/vex/vxMeasure.js','src/render/sui/renderState.js', 'src/render/sui/scoreRender.js',
  'src/render/sui/actionPlayback.js','src/render/sui/formatter.js','src/render/audio/player.js',
  'src/render/sui/textRender.js','src/render/vex/vxSystem.js', 'src/render/vex/glyphDimensions.js',
  'src/render/sui/textEdit.js', 'src/render/sui/tracker.js', 'src/render/audio/oscillator.js','src/render/sui/mapper.js',
  'src/render/sui/scoreView.js','src/render/sui/scoreViewOperations.js',
  'src/ui/ribbon.js', 'src/ui/menus.js', 'src/ui/dialog.js', 'src/ui/dialogComponents.js', 'src/ui/dialogs/scoreDialogs.js',
   'src/ui/dialogs/fontComponent.js', 'src/ui/dialogs/staffComponents.js','src/ui/dialogs/textComponents.js',
   'src/ui/dialogs/textDialogs.js',
   'src/ui/dialogs/measureDialogs.js','src/ui/dialogs/staffDialogs.js','src/ui/dialogs/libraryDialog.js','src/ui/dialogs/treeComponent.js' ,
   'src/ui/dialogs/fileDialogs.js',
   'src/ui/application.js', 'src/ui/fileio/fileInput.js', 'src/ui/fileio/xhrLoader.js','src/ui/fileio/library.js']
  const SOURCES = ['src/**/*.js'];
  const BASE_DIR = __dirname;
  const BUILD_DIR = path.join(BASE_DIR, 'build');

  const webpackConfig = {
    mode: 'development',
    entry: path.join(BASE_DIR, 'src/ui/entryPoint.js'),
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
          }, {
            expand: true,
            cwd: 'docs/',
            src: ['*.*', '**/*'],
            dest: 'build/docs/'
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-webpack');


  // Default task(s).
  grunt.registerTask('default', ['eslint', 'webpack:build']);
};
