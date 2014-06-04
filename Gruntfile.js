/* global module, require */

module.exports = function (grunt) {
    'use strict';

    // Load all grunt tasks
    require('load-grunt-tasks')(grunt);

    // Project configuration.
    grunt.initConfig({

        /** Watches for Filesystem Changes and triggers specific tasks */
        watch: {
            livereload: {
                files: ['index.html', 'css/app.css', 'js/*.js'],
                options: {
                    livereload: true
                }
            }
        },

        /** Creates a localhost webserver */
        connect: {
            server: {
                options: {
                    port: 9000,
                    livereload: true
                }
            }
        },


    });

    grunt.registerTask('default', [
        'connect',
        'watch'
    ]);

};
