module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';',
      },
      dist: {
        src: ['players/expert-ai.js', 'players/human-player.js', 'model.js', 'view.js', 'game.js'],
        dest: 'build/build.js',
      },
    },
    uglify: {
      my_target: {
        files: {
          'build/build.js': ['build/build.js']
        }
      }
    },
    watch: {
      scripts: {
        files: ['*.js'],
        tasks: ['default'],
        options: {
          spawn: false,
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['concat', 'uglify']);
};