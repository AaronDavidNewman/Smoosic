module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['src/common/vexHelpers.js', 'src/common/svgHelpers.js', 'src/common/htmlHelpers.js',
                    'src/smo/data/note.js', 'src/smo/data/measure.js', 'src/smo/data/systemStaff.js', 
					'src/smo/data/score.js', 'src/smo/data/staffModifiers.js',
                    'src/smo/xform/iterator.js', 'src/smo/xform/modifiers.js', 'src/smo/xform/tickDuration.js', 'src/smo/xform/selections.js',
                    'src/smo/xform/operations.js', 'src/vex/vxMeasure.js', 'src/vex/vxSystem.js',
                    'src/ui/tracker.js', 'src/ui/layout.js', 'src/ui/editor.js', 'src/ui/menus.js', 'src/ui/utController.js',
                    'src/ui/dialog.js', 'src/ui/controller.js'],
                dest: 'build/<%= pkg.name %>.js'
            },
            tests: {
                src: ['src/test/chordTest.js', 'src/test/staffTest.js', 'src/test/timeSignatureTest.js',
                    'src/test/tupletTest.js', 'src/test/serializeTestJson.js',
					'src/test/voiceTest.js', 'src/test/trackerTest.js','src/test/testAll.js'],
                dest: 'build/smoTests.js'

            },
			styles: {
				src: ['src/fonts/fonts.css','src/fonts/styles.css'],
				dest: 'build/styles.css'
			}
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-concat');

    // Default task(s).
    grunt.registerTask('default', ['concat']);
};
