module.exports = function (grunt) {
  // Used for eslint and docco
  const LINTS = ['src/smo/data/measure.js','src/smo/data/note.js','src/smo/data/score.js',
  'src/smo/data/noteModifiers.js','src/smo/data/scoreModifiers.js','src/smo/xform/undo.js',
  'src/smo/xform/copypaste.js',
  'src/render/vex/vxMeasure.js','src/render/sui/renderState.js', 'src/render/sui/renderScore.js',
  'src/render/sui/textRender.js','src/render/vex/vxSystem.js', 'src/render/vex/glyphDimensions.js',
  'src/render/sui/textEdit.js', 'src/render/sui/tracker.js', 'src/render/audio/oscillator.js',
  'src/render/sui/scoreView.js',
   'src/ui/dialog.js', 'src/ui/dialogComponents.js', 'src/ui/dialogs/scoreDialogs.js',
   'src/ui/dialogs/fontComponent.js' ]
  const SOURCES = ['src/**/*.js','!src/test/*.js'];
  const TESTSRC = ['src/test/*.js']

    // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';',
        sourceMap: true
      },
    dist: {
      src: [SOURCES],
      dest: 'build/<%= pkg.name %>.js'
    },
    tests: {
        src: [TESTSRC],
        dest: 'build/smoTests.js'

    }
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
        }, {
          expand: true,
          cwd: 'html/',
          src: ['*.*', '**/*'],
          dest: 'build/html/'
        }
      ]
    }
  }

    });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  grunt.registerTask('default', ['eslint', 'concat', 'copy']);
};
