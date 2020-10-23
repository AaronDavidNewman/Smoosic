module.exports = function (grunt) {
  // Used for eslint and docco
  const LINTS = ['src/smo/data/measure.js','src/smo/data/note.js','src/render/vex/vxMeasure.js',
  'src/render/vex/vxSystem.js', 'src/render/vex/glyphDimensions.js','src/ui/dialog.js' ]
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
