'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var path = require('path');
var webpack = require('gulp-webpack');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var minify = require('gulp-minify-css');
var argv = require('yargs').argv;
var grizzly = require('grunt-grizzly');

var publicDir = 'public';
var compress = !!argv.compress || process.env.NODE_ENV === 'production';

var deployTasks = ['scripts', 'vendors', 'styles', 'assets'];

var uglifyOptions = {
    mangle: true,
    compress: {
        sequences: true,
        dead_code: true,
        conditionals: true,
        booleans: true,
        unused: true,
        if_return: true,
        join_vars: true
    }
};

gulp.task('vendors', function() {
    return gulp.src([
            'node_modules/q/q.js',
            'node_modules/jquery/dist/jquery.js',
            'node_modules/react/dist/react.js',
            'node_modules/react-router/dist/react-router.js',
            'node_modules/react-di/dist/react-di.js'
        ])
        .pipe(concat('vendors.js'))
        .pipe(gulpif(compress, uglify(uglifyOptions)))
        .pipe(gulp.dest(publicDir));
});

gulp.task('scripts', function() {
    return gulp.src(path.join('app/scripts/main.jsx'))
        .pipe(webpack({
            debug: true,
            module: {
                loaders: [{
                    test: /\.jsx$/,
                    loader: 'jsx-loader?insertPragma=React.DOM&harmony'
                }]
            },
            resolve: {
                extensions: ['', '.js', '.jsx']
            },
            externals: {
                jquery: 'var $',
                q: 'var Q'
            },
            node: {
                process: false,
                buffer: false
            }
        }))
        .pipe(concat('scripts.js'))
        .pipe(gulpif(compress, uglify(uglifyOptions)))
        .pipe(gulp.dest(publicDir));
});

gulp.task('assets', function() {
    return gulp.src('app/public/**')
        .pipe(gulp.dest(publicDir));
});

gulp.task('styles', function() {
    return gulp.src('app/styles/main.scss')
        .pipe(sass({
            errLogToConsole: true,
            includePaths: ['node_modules'],
            outputStyle: 'nested'
        }))
        .pipe(concat('styles.css'))
        .pipe(gulpif(compress, minify()))
        .pipe(gulp.dest(publicDir));
});

gulp.task('dev', deployTasks.concat('grizzly'), function() {
    gulp.watch('app/scripts/**/{*.js,*.jsx}', ['scripts']);
    gulp.watch('app/styles/**', ['styles']);
    gulp.watch('app/public/**', ['assets']);
});

gulp.task('grizzly', function(done) {
    var options = {
        host: argv.host || 'staging2.getgooddata.com',
        port: argv.port || 8443,
        root: __dirname + '/public'
    };

    var server = new grizzly(options);

    // Shutdown & notify on error
    server.on('error', function(error) {
        throw error;
    });

    server.on('start', function() {
        server.printStartedMessage();

        done();
    });

    // Start grizzly server
    server.start();
});

gulp.task('deploy', deployTasks);
