var gulp = require('gulp');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var babel = require('gulp-babel');
var ngdocs = require('gulp-ngdocs');
var replace = require('gulp-replace');
var concat = require('gulp-concat');
var merge = require('merge2');
var karma = require('karma').server;

gulp.task('lint', function () {
    return gulp
            .src(['src/**/*.js', '!src/prefix.js', '!src/suffix.js'])
            .pipe(jshint())
            .pipe(jshint.reporter(stylish))
            .pipe(jscs());
});

gulp.task('bundle', function () {

    var transpiled = gulp
                    .src(['src/**/*.js', '!src/prefix.js', '!src/suffix.js'])
                    .pipe(babel({ modules: 'ignore', comments: false }));

    var prefix = gulp.src(['src/prefix.js']);

    var suffix = gulp.src(['src/suffix.js']);

    return merge(prefix, transpiled, suffix)
            .pipe(concat('immutable-angular.js'))
            .pipe(gulp.dest('dist'));
});

gulp.task('docs', function () {
    return gulp
            .src('src/**/*.js')
            .pipe(ngdocs.process({
                html5Mode: false,
                title: 'immutable-angular',
                styles: ['assets/docs-custom.css']
            }))
            .pipe(replace('class="container"', 'class="container-fluid"'))
            .pipe(replace('class="row', 'class="row-fluid'))
            .pipe(gulp.dest('docs'));
});

gulp.task('test', ['bundle', 'lint'], function () {
    karma.start({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    });
});
