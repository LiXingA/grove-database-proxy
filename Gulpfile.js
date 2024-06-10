var gulp = require('gulp'); // 1
var path = require('path')
var fs = require('fs')
var browserify = require('browserify'); //2
var babelify = require('babelify'); //3
var source = require('vinyl-source-stream'); //4
var exorcist = require('exorcist')
var concat = require('gulp-concat');
var gls = require('gulp-live-server');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass')(require('sass'));
var autoprefixer = require('autoprefixer');
var postcss = require('gulp-postcss');

var paths = {
    main_js: ['client/index.js'],
    css: ['client/**/*.css'],
    js: ['client/**/*.js*'],
    styles: {
        src: 'client/**/*.scss',
        dest: 'client'
    }
};

function scss() {
    return gulp.src(paths.styles.src)
        .pipe(sass().on('error', sass.logError))
        // .pipe(sass({ outputStyle: 'compressed' }))
        // .pipe(postcss([autoprefixer()]))
        .pipe(gulp.dest(paths.styles.dest));
}

gulp.task('js', function () {
    //Browserify bundles the JS.
    // return browserify(paths.main_js)
    //     .transform(babelify) //———–> transpiles es6 to es5
    //     .bundle()
    //     .on('error', (err) => {
    //         console.log('JS Error', err);
    //     })
    //     .pipe(source('bundle.js'))
    //     .pipe(gulp.dest('java-database-proxy/src/main/webapp/js'));
    return browserify(paths.main_js, { debug: true })
        .transform(babelify)
        .bundle()
        .pipe(exorcist(path.join(__dirname, 'java-database-proxy/src/main/webapp/js/bundle.js.map')))
        .pipe(fs.createWriteStream(path.join(__dirname, 'java-database-proxy/src/main/webapp/js/bundle.js'), 'utf8'));
});
gulp.task('css', function (callback) {
    scss();
    return gulp.src(paths.css)
        .pipe(concat('main.css'))
        .pipe(gulp.dest('java-database-proxy/src/main/webapp/css/'));
});

gulp.task('web', gulp.series('css', 'js', function () {
    // Generic watch tasks for SASS and Browserify
    gulp.watch(paths.css, gulp.series('css'));
    gulp.watch(paths.js, gulp.series('js'));
}));

gulp.task('dev', gulp.series('css', 'js', function () {
    // Generic watch tasks for SASS and Browserify
    gulp.watch(paths.css, gulp.series('css'));
    gulp.watch(paths.js, gulp.series('js'));
    // Start the app server.
    var server = gls(['bin/grove-database-proxy', 'start'], { stdio: 'inherit' });
    server.start();

    // Reload server when backend files change.
    gulp.watch(['bin/**/*.js'], function () {
        server.start.bind(server)();
    });
    // Reload server when backend files change.
    gulp.watch(['lib/**/*.js'], function () {
        server.start.bind(server)();
    });

    // Notify server when frontend files change.
    // gulp.watch(['static/**/*.{css,js,html}'], function (file) {
    //     server.notify(file);
    // });
}));

gulp.task('prod', function () {
    // Browserify/bundle the JS.
    return browserify(paths.main_js)
        .transform(babelify)
        .bundle()
        .on('error', (err) => {
            console.log('JS Error', err);
        })
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest('java-database-proxy/src/main/webapp/js'));
});
gulp.task('build', gulp.series('prod'));