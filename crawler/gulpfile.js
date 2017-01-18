'use strict';

const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const sass = require('gulp-sass');
const babel = require('gulp-babel');
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const wrap = require('gulp-wrap');
const argv = require('yargs').argv;


const buildPath = 'public/build/';
const cssSrc = [
  'public/libs/**/*.scss',
  'public/libs/**/*.css',
  'public/css/all.scss',
];
const cssWatchSrc = [
  'public/libs/**/*.scss',
  'public/libs/**/*.css',
  'public/css/*.scss',
  'public/css/**/*.scss',
];
const appScriptSrc = [
  'public/app/*.js',
  'public/app/**/*.js',
];
const libScriptSrc = [
  'public/libs/jquery-1.11.3.min.js',
  'public/libs/angular-1.5.7/angular.js',
  'public/libs/angular-1.5.7/angular-route.js',
  'public/libs/angular-1.5.7/angular-touch.js',
  'public/libs/angular-loading-bar/loading-bar.js',
  'public/libs/ng-infinite-scroll.js',

  'public/libs/moment.js',
  'public/libs/ng-table.js',
  'public/libs/eppz-scroll-to.js',
];


function transpileLibraries(outputName, src) {
  if (argv.production) return transpileProduction(outputName, src);
  return transpileDev(outputName, src);

  function transpileDev() {
    return gulp.src(src)
      .pipe(sourcemaps.init())
      .pipe(concat(outputName))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(`${buildPath}js/`));
  }

  function transpileProduction() {
    return gulp.src(src)
      .pipe(concat(outputName))
      .pipe(uglify())
      .pipe(gulp.dest(`${buildPath}js/`));
  }
}


function transpileApp(outputName, src) {
  if (argv.production) return transpileProduction(outputName, src);
  return transpileDev(outputName, src);

  function transpileDev() {
    return gulp.src(src)
      .pipe(wrap('(function(){ <%= contents %> })();'))
      .pipe(sourcemaps.init())
      .pipe(babel({ presets: ['es2015'] }))
      .pipe(concat(outputName))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(`${buildPath}js/`));
  }

  function transpileProduction() {
    return gulp.src(src)
      .pipe(wrap('(function(){ <%= contents %> })();'))
      .pipe(babel({ presets: ['es2015'] }))
      .pipe(concat(outputName))
      .pipe(uglify())
      .pipe(gulp.dest(`${buildPath}js/`));
  }
}

function transpileSass(outputName, src) {
  if (argv.production) return transpileProductionSass(outputName, src);
  return transpileDevSass(outputName, src);

  function transpileDevSass() {
    return gulp.src(src)
      .pipe(sourcemaps.init())
      .pipe(sass())
      .pipe(concat(outputName))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(`${buildPath}css/`));
  }

  function transpileProductionSass() {
    return gulp.src(src)
      .pipe(sass({ outputStyle: 'compressed' }))
      .pipe(autoprefixer({ cascade: false }))
      .pipe(concat(outputName))
      .pipe(cleanCSS())
      .pipe(gulp.dest(`${buildPath}css/`));
  }
}


gulp.task('libScripts', () => transpileLibraries('libs.min.js', libScriptSrc));
gulp.task('appScripts', () => transpileApp('app.min.js', appScriptSrc));
gulp.task('sass', () => transpileSass('all.min.css', cssSrc));
gulp.task('watch', () => {
  if (argv.production) return;
  gulp.watch(cssWatchSrc, ['sass']);
  gulp.watch(appScriptSrc, ['appScripts']);
});


gulp.task('default', ['libScripts', 'appScripts', 'sass', 'watch']);
