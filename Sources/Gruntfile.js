module.exports = function(grunt) {
  require('jit-grunt')(grunt);

  grunt.initConfig({
    less: {
      development: {
        options: {
          compress: true,
          yuicompress: true,
          optimization: 2
        },
        files: {
          "public/assets/css/main.min.css": "public/assets/less/main.less", // destination file and source file
          "public/assets/css/desktop.min.css": "public/assets/less/desktop.less",
          "public/assets/css/desktop.min.css": "public/assets/less/mobile.less",
          "public/assets/css/desktop.min.css": "public/assets/less/tablet.less"
        }
      }
    },
    watch: {
      styles: {
        files: ['public/assets/less/*.less'], // which files to watch
        tasks: ['less'],
        options: {
          nospawn: true
        }
      }
    },
    nodemon: {
      dev: {
        script: 'app.js',
        options: {
          ignore: [
            'node_modules/**',
            'public/**'
          ],
          ext: 'js'
        }
      }
    },
    concurrent: {
      dev: {
        tasks: ['less', 'nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    } // concurrent
  });
  //grunt.loadNpmTasks('grunt-contrib-watch');
    //grunt.loadNpmTasks('grunt-shell');
  //grunt.registerTask('default', ['less', 'watch', 'nodemon']);

  grunt.loadNpmTasks('grunt-concurrent');
   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-nodemon');

  grunt.registerTask('default', '', function() {
     var taskList = [
        'concurrent',
         'less',
         'nodemon',
         'watch'
     ];
     grunt.task.run(taskList);
   });


};
