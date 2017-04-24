/* global process __dirname:true */
var gulp = require("gulp");
var requireDir = require("require-dir");

var paths = {
    js: [
        "gulpfile.js",
        "index.js",
        "app/*.js",
        "client/*/main.js",
        "client/*/viewmodels/*.js",
        "test/**/*.js"
    ],
    app: [
        "client/ping.html",
        "client/index.html",
        "client/chair.html",
        "client/kiosk.html",
        "client/wall.html",
        "client/*/main.js",
        "client/*/viewmodels/*.js",
        "client/*/views/*.html"
    ],
    test: [
        "test/dev"
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

var browserSync = require("browser-sync").create();
gulp.task("browser-sync", function() {
    browserSync.init(null, {
        baseDir: "./client",
        proxy: {
            target: "http://localhost:3000",
            ws: true
        },
        open: false,
        port: 7000
    });

    gulp.watch(paths.app).on("change", browserSync.reload);
});

var nodemon = require("gulp-nodemon");
gulp.task("nodemon", function(cb) {
    var started = false;

    nodemon({
        script: "index.js"
    }).on("start", function() {
        if (!started) {
            cb();
            started = true;
        }
    });
});

var runSequence = require("run-sequence");
gulp.task("serve", function(cb) {
    runSequence("eslint", "browser-sync", cb);
});

gulp.task("test", function(cb) {
    var KarmaServer = require("karma").Server;
    new KarmaServer({
        configFile: __dirname + "/karma.conf.js",
        singleRun: true
    }, function(exitCode) {
        cb();
        process.exit(exitCode);
    }).start();
});

gulp.task("default", ["browser-sync"]);
