const path = require('path');
const webpack = require('webpack');

module.exports = function (grunt) {
  // Used for eslint and docco
  const LINTS = ['src/common/musicHelpers.ts',
    'src/smo/data/measure.ts','src/smo/data/note.ts','src/smo/data/score.ts',
  'src/smo/xform/beamers.ts','src/smo/xform/audioTrack.jts',
  'src/smo/data/noteModifiers.ts','src/smo/data/systemStaff.ts','src/smo/data/scoreModifiers.ts',
  'src/smo/data/measureModifiers.ts', 'src/smo/data/tuplet.ts','src/smo/data/staffModifiers.ts',
  'src/smo/mxml/xmlScore.ts','src/smo/mxml/xmlState.ts','src/smo/mxml/xmlHelpers.ts',
  'src/smo/mxml/smo2Xml.js','src/smo/midi/smoToMidi.js',
  'src/smo/xform/operations.ts', 'src/smo/xform/undo.ts', 'src/smo/xform/tickMap.ts', 'src/smo/xform/actions.js', 'src/smo/xform/toVex.js',
  'src/smo/xform/copypaste.ts','src/smo/xform/selections.ts','src/smo/xform/tickDuration.ts',
  'src/render/vex/vxMeasure.js','src/render/sui/renderState.js', 'src/render/sui/scoreRender.js', 'src/render/sui/scroller.ts',
  'src/render/sui/actionPlayback.js','src/render/sui/formatter.js','src/render/audio/player.js',
  'src/render/sui/layoutDebug.js',
  'src/render/sui/textRender.js','src/render/vex/vxSystem.js', 'src/render/vex/glyphDimensions.js',
  'src/render/sui/textEdit.js', 'src/render/sui/tracker.js', 'src/render/audio/oscillator.js','src/render/sui/mapper.js',
  'src/render/sui/scoreView.js','src/render/sui/scoreViewOperations.js',
  'src/ui/ribbon.js', 'src/ui/menus.js', 'src/ui/dialog.js', 'src/ui/dialogComponents.js', 'src/ui/keyCommands.js','src/ui/exceptions.js'
  ,'src/ui/i18n/language.js',
  'src/ui/dialogs/scoreDialogs.js','src/ui/help.js',
   'src/ui/dialogs/fontComponent.js', 'src/ui/dialogs/staffComponents.js','src/ui/dialogs/textComponents.js',
   'src/ui/dialogs/textDialogs.js',
   'src/ui/dialogs/staffDialogs.js','src/ui/dialogs/libraryDialog.js','src/ui/dialogs/treeComponent.js' ,
   'src/ui/dialogs/fileDialogs.js',
   'src/ui/application.ts', 'src/ui/fileio/fileInput.js', 'src/ui/fileio/xhrLoader.js','src/ui/fileio/library.ts',
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
