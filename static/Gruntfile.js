module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        compass: {
            dist: {
                options: {
                    'output-style': 'compressed',
                    'sass-dir': 'sass',
                    'css-dir': 'css'
                }
            }
        },
        concat: {
            dist: {
                src: [
                    'js/libs/jquery/jquery.js',
                    'js/libs/bootstrap/dist/js/bootstrap.js',
                    'js/libs/d3/d3.js',
                    'js/libs/topojson/topojson.js',
                    'js/libs/colorbrewer/colorbrewer.js',
                    'js/libs/queue-async/queue.js',
                    'js/libs/tabletop/src/tabletop.js',
                    'js/main.js'
                ],
                dest: 'js/build/script.js'
            }
        },
        uglify: {
            build: {
                src: 'js/build/script.js',
                dest: 'js/build/script.min.js'
            }
        },
        imagemin: {
            dynamic: {
                files: [{
                    expand: true,
                    cwd: 'dev/img/',
                    src: ['**/*.{png,jpg,gif}'],
                    dest: 'img'
                    }]
            }
        },
        watch: {
            scripts: {
                files: ['js/main.js'],
                tasks: ['concat', 'uglify'],
                options: {
                    spawn: false,
                    livereload: true
                }
            },
            css: {
                files: 'sass/*.scss',
                tasks: ['compass']
            },
            images: {
                files: 'img/*',
                tasks: ['imagemin']
            }
        },
        browserSync: {
            dev: {
                bsFiles: {
                    src: 'css/*.css'
                },
                options: {
                    watchTask: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-browser-sync');

    // What tasks should be run when "grunt" is entered in the command line
    grunt.registerTask('default', ['browserSync', 'watch']);

};
