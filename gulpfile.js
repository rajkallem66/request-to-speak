var gulp = require("gulp");
var requireDir = require("require-dir");

var paths = {
    js: [
        "gulpfile.js",
        "index.js",
        "client/app/main.js",
        "client/app/viewmodels/*.js"
    ]
};

// Require all tasks in the 'gulp' folder.
requireDir("./gulp", {recurse: false});

var eslint = require("gulp-eslint");
gulp.task("eslint", function() {
    gulp.src(paths.js)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task("serve", ["eslint"], function() {

});

gulp.task("default", ["serve"]);
