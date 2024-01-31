var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var cssimport = require("gulp-cssimport");
var url = require("url");
var sass = require('gulp-sass');
var gutil = require('gulp-util');
var wait = require('gulp-wait');

// Static Server + watching scss/html files
gulp.task('serve', function() {
    browserSync.init({
        server: "./",
        middleware: function(req, res, next) {
            var fileName = url.parse(req.url);
            fileName = fileName.href.split('/');
            var theFileName = fileName.pop();
            if (theFileName.match(/\.html/)) {
                res.setHeader('Cache-Control', 'no-store');
                res.setHeader('Surrogate-Control', 'no-store');
            } else if (theFileName.match(/\.css/)) { // totally hacky to do this regex twice but it was EASY.
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Cache-Control', 'no-store');
            } else if (theFileName.match(/\.js/)) {
                res.setHeader('Cache-Control', 'no-cache');
            }
            next();
        }
    });

    gulp.watch("scss/**/*.scss", ['sass']);
    gulp.watch("css/*.css", ['css']);
    gulp.watch("**/*.html").on('change', browserSync.reload);
    gulp.watch("templates/*.handlebars").on('change', browserSync.reload);
    gulp.watch("js/app/**/*.js").on('change', browserSync.reload);
});

// Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function() {
    return gulp.src("scss/**/*.scss")
        .on('error', gutil.log)
        .pipe(wait(500))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest("css"));
});

gulp.task('css', function() {
    return gulp.src("css/*.css")
        .pipe(browserSync.stream());
});

// gulp.task('import', ['sass'],  function() {
//     var options = {matchPattern: "*.css"};
//     gulp.src("./css/index.css")
//         .pipe(cssimport())
//         .pipe(gulp.dest("./css/"))
//         .pipe(browserSync.stream());
// });

gulp.task('default', ['sass', 'serve']);