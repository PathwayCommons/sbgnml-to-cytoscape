// /* eslint-disable no-console */
// /* eslint func-names: ["error", "never"]*/
var gulp = require('gulp');
var gutil = require('gulp-util');
var eslint = require('gulp-eslint');
var del = require('del');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var browserSync = require('browser-sync').create();
var mochaPhantomJs = require('gulp-mocha-phantomjs');

var paths = {
  source: {
    allSrcJs: 'src/**/*.js',
    allTestJs: 'test/*.js',
    gulpFile: 'gulpfile.js'
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

gulp.task('clean-test', function () {
  return del.sync(paths.test.filesToClean);
});

gulp.task('clean', ['clean-test'], function () {
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

gulp.task('default', ['serve-test']);
