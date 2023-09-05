const path = require('path');

module.exports = function (grunt) {
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
      jszip: 'JSZip',
      vex5_smoosic: 'Vex'
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
  }  
  const typedocConfig = {
    options: {
      out: 'build/docs',
      name: 'Smoosic',
      tsconfig: 'tsconfig.json',
      excludeProtected: true,
      excludePrivate: true,
      categorizeByGroup: true,
      readme: 'readme.md',
      defaultCategory: ['Other'],
      categoryOrder: ['SmoObject', 'SmoModifier', 'SmoParameters', '*'],
      excludeNotDocumented: true
    },  src: ['./typedoc.ts']
  };
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    webpack: {
      build: webpackConfig
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
      build: typedocConfig
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-typedoc');
  console.log(new Date());

  // Default task(s).
  grunt.registerTask('default', ['webpack:build', 'copy']);
  grunt.registerTask('docs', ['typedoc:build']);
  grunt.registerTask('types', 'Generate types', function() {
    const rules = grunt.config.get('webpack.build.module.rules');
    rules[0].use[0].options.configFile = 'tsconfig-types.json';
    // console.log(JSON.stringify({ rules }, null, ' '));
    grunt.config.set('webpack.build.module', { rules });
    grunt.task.run('webpack:build');
  });
};
