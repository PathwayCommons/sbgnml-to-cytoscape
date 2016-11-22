// /* eslint-disable no-console */
// /* eslint func-names: ["error", "never"]*/
var gulp = require('gulp');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var eslint = require('gulp-eslint');

var del = require('del');
var assign = require('lodash.assign');

var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserSync = require('browser-sync').create();
var mochaPhantomJs = require('gulp-mocha-phantomjs');

var paths = {
  source: {
    allSrcJs: 'src/**/*.js',
    allTestJs: 'test/*.js',
    gulpFile: 'gulpfile.js'
  },
  build: {
    buildPath: 'dist/',
    entryPoint: 'src/index.js',
    bundleFile: 'convert-sbgnml.js',
    filesToClean: 'dist/**',
    filesToInject: ['./src/samples/*.xml', 'src/index.html'],
    srcMapFile: './'
  },
  test: {
    testEnvPath: 'test/testenv/',
    entryPoint: 'test/index.js',
    bundleFile: 'testBundle.js',
    filesToClean: ['test/testenv/fixtures/**/*.json', 'test/testenv/fixtures/**/*.xml', 'test/testenv/testBundle.js'],
    filesToInject: ['test/fixtures/**/*'],
    testRunner: 'tests.html'
  }
};

var browserifyOpts = {
  entries: [paths.entryPoint],
  debug: true
};

var opts = assign({}, watchify.args, browserifyOpts);
var watchBrow = watchify(browserify(opts));

// Common tasks

gulp.task('lint', function () {
  return gulp.src([
    paths.source.allSrcJs,
    paths.source.allTestJs,
    paths.source.gulpFile
  ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('clean-build', function () {
  return del.sync(paths.build.filesToClean);
});

gulp.task('clean-test', function () {
  return del.sync(paths.test.filesToClean);
});

gulp.task('clean', ['clean-build', 'clean-test'], function () {
});

// Build the tests and inject them into a test enviornment

gulp.task('fixtures', function () {
  return gulp.src(paths.test.filesToInject, {base: './test'})
    .pipe(gulp.dest(paths.test.testEnvPath));
});

gulp.task('build-test', ['clean', 'lint', 'fixtures'], function () {
  return browserify(paths.test.entryPoint)
      .bundle()
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source(paths.test.bundleFile))
      .pipe(gulp.dest(paths.test.testEnvPath));
});

gulp.task('run-test', ['build-test'], function () {
  return gulp.src(paths.test.testEnvPath + paths.test.testRunner)
    .pipe(mochaPhantomJs());
});

gulp.task('watch-test', ['build-test', 'run-test'], function (cb) {
  browserSync.reload();
  cb();
});


gulp.task('serve-test', ['build-test'], function (cb) {
  browserSync.init({
    server: paths.test.testEnvPath,
    index: paths.test.testRunner
  });

  gulp.watch([paths.source.allSrcJs, paths.source.allTestJs], ['watch-test']);
  cb();
});

// Build the bundle and put it into the dist directory

gulp.task('assets', function () {
  return gulp.src(paths.build.filesToInject, {base: './src'})
    .pipe(gulp.dest('dist'));
});

gulp.task('build', ['lint', 'clean', 'assets'], function () {
  return watchBrow.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source(paths.build.bundleFile))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write(paths.build.srcMapFile))
    .pipe(gulp.dest(paths.build.buildPath));
});

gulp.task('watch-build', ['build', 'run-test'], function (cb) {
  browserSync.reload();
  cb();
});

gulp.task('serve-build', ['build'], function (cb) {
  browserSync.init({
    server: './dist',
    index: 'index.html'
  });

  gulp.watch([paths.source.allSrcJs], ['watch-build']);
  cb();
});

gulp.task('default', ['serve-build']);
