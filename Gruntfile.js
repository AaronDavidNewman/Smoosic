module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['src/common/musicHelpers.js', 'src/common/svgHelpers.js', 'src/common/htmlHelpers.js',
                    'src/smo/data/note.js', 'src/smo/data/noteModifiers.js',
                    'src/smo/data/measure.js', 'src/smo/data/measureModifiers.js', 'src/smo/data/systemStaff.js',
                    'src/smo/data/score.js', 'src/smo/data/staffModifiers.js',
                    'src/smo/xform/iterator.js', 'src/smo/xform/beamers.js', 'src/smo/xform/tickDuration.js', 'src/smo/xform/selections.js',
                    'src/smo/xform/operations.js', 'src/smo/xform/undo.js', 'src/smo/xform/copypaste.js',
                    'src/render/vex/vxMeasure.js', 'src/render/vex/vxSystem.js',
                    'src/render/sui/tracker.js', 'src/render/sui/layout.js', 'src/render/sui/piano.js',
					'src/ui/editor.js', 'src/ui/menus.js', 'src/ui/utController.js',
					'src/ui/exceptions.js',
					'src/ui/keyBindings/default/editorKeys.js','src/ui/keyBindings/default/trackerKeys.js',
					'src/ui/dialog.js','src/ui/dialogComponents.js',
					'src/ui/ribbonLayout/default/defaultRibbon.js',
                    'src/ui/ribbon.js','src/ui/dialog.js', 'src/ui/staffDialogs.js', 'src/ui/help.js', 'src/ui/controller.js'],
                dest: 'build/<%= pkg.name %>.js'
            },
            tests: {
                src: ['src/test/chordTest.js', 'src/test/undoTest.js', 'src/test/timeSignatureTest.js',
                    'src/test/keySignatureTest.js',
                    'src/test/tupletTest.js', 'src/test/serializeTestJson.js', 'src/test/pasteTest.js',
                    'src/test/voiceTest.js', 'src/test/trackerTest.js', 'src/test/clefTest.js','src/test/measureTest.js','src/test/testAll.js'],
                dest: 'build/smoTests.js'

            },
            editor: {
                src: ['src/test/editorTest.js'],
                dest: 'build/editor.js'
            }
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
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    // Default task(s).
    grunt.registerTask('default', ['concat', 'copy']);
};
