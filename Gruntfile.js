module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';',
      },
      dist: {
        src: ['players/player.js', 'players/expert-ai.js', 'players/human-player.js', 'model/board.js', 'model/game.js', 'view/view-config.js', 'view/board-view.js', 'view/choice-view', 'view/result-view', 'index.js', 'router.js'],
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