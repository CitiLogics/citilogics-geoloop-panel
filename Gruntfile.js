/* eslint import/no-extraneous-dependencies: 0 */

module.exports = (grunt) => {
  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({

    copy: {
      src_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['**/*', '!**/*.js', '!**/*.scss'],
        dest: 'dist'
      },
      pluginDef: {
        expand: true,
        src: [ 'plugin.json', 'README.md', 'CHANGELOG.md' ],
        dest: 'dist',
      }
    },

    watch: {
      scripts: {
        files: ['Gruntfile.js', 'plugin.json', 'package.json', 'test/*', 'src/*.js', 'src/*.html', 'src/css/*.css', 'src/partials/*.html'],
        tasks: ['default'],
        options: {
          spawn: false,
        },
      },
    },


    babel: {
      options: {
        ignore: ['**/libs/*'],
        sourceMap: true,
        presets: ['es2015'],
        plugins: ['transform-es2015-modules-systemjs', 'transform-es2015-for-of'],
      },
      dist: {
        files: [{
          cwd: 'src',
          expand: true,
          src: ['**/*.js'],
          dest: 'dist',
          ext: '.js'
        }]
      },
    },

  });

  grunt.registerTask('default', ['copy:src_to_dist', 'copy:pluginDef', 'babel']);
};
