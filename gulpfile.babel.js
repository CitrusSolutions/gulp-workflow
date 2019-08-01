'use strict';

var async = require('async');
var autoprefixer = require('gulp-autoprefixer');
var cleanCSS = require('gulp-clean-css');
var consolidate = require('gulp-consolidate');
var fs = require('fs');
var gulp = require('gulp');
var iconfont = require('gulp-iconfont');
var notify = require('gulp-notify');
var path = require('path');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var sassGlob = require('gulp-sass-glob');
var watch = require('gulp-watch');

var config = require('./gulp-config.json');
var runTimestamp = Math.round(Date.now() / 1000);

const THEME_ROOT = config.theme_root;

// Check if iconfont is given a special name in config file.
// Otherwise set it to icons.
var font_name = config.iconfont_name;
if (typeof font_name == 'undefined') {
  font_name = 'icons';
}

const paths = {
  styles: {
    scss: `${THEME_ROOT}scss/`,
    css: `${THEME_ROOT}css/`
  },
  generated: `${THEME_ROOT}scss/generated/`,
  img: `${THEME_ROOT}img/`
};

// A gulp watcher function.
gulp.task('watch', function(){
  // Watch SASS files.
  gulp.watch(paths.styles.scss + '**/*.scss', gulp.series('styles'));
  // Watch for new or changed icons.
  gulp.watch(paths.img + 'icons/**/*.svg', gulp.series('icons'));
});

// Compile SASS to CSS. Handle errors with plumber function.
gulp.task('styles', function() {
  return gulp.src([paths.styles.scss + '**/*.scss'])
  .pipe(plumber({ errorHandler: function(err) {
    notify.onError({
      title: "Gulp error in " + err.plugin,
      message: err.toString()
    })(err);
    this.emit('end');
  }}))
  .pipe(sassGlob())
  .pipe(sass())
  .pipe(autoprefixer({
    cascade: false,
  }))
  .pipe(gulp.dest(paths.styles.css))
  // Continue with minifying newly created css files.
  .pipe(cleanCSS())
  .pipe(gulp.dest(paths.styles.css));;
});

// Generate icon font and a SCSS file.
gulp.task('icons', function(done) {
  // This is a hack for fixing unicode prepend problems.
  // The newer version of gulp-iconfont doesn't understand
  // which unicode characters are already used.
  var lastUnicode = 0xEA01; //59905

  // Create config object from your presets.
  var iconfontConfig = Object.create({
    fontHeight: 1001,
    fontName: font_name,
    prependUnicode: true,
    formats: ['svg', 'ttf', 'eot', 'woff', 'woff2'],
    normalize: true,
    timestamp: runTimestamp,
  });

  // Read source directory and sort by name.
  var files = fs.readdirSync(paths.img + 'icons');

  // Filter files with containing unicode value and set last unicode.
  files.forEach(function(file) {
    var basename = path.basename(file);
    var matches = basename.match(/^(?:((?:u[0-9a-f]{4,6},?)+)\-)?(.+)\.svg$/i);
    var currentCode = -1;

    if(matches && matches[1]) {
      currentCode = parseInt(matches[1].split('u')[1], 16);
    }

    if (currentCode >= lastUnicode) {
      lastUnicode = ++currentCode;
    }
  });

  // Set startUnicode option to determined unicode from filenames
  iconfontConfig.startUnicode = lastUnicode;
  // End of hack.

  // Create an iconstream.
  var iconStream = gulp.src(paths.img + 'icons/**/*.svg')
    .pipe(iconfont(iconfontConfig));

  async.parallel([
    function handleGlyphs(callback) {
      iconStream.on('glyphs', function(glyphs, options) {
        gulp.src(paths.styles.scss + '_icon-template.scss')
          .pipe(consolidate('lodash', {
            glyphs: glyphs,
            fontName: font_name,
            fontPath: '../fonts/',
            className: 's'
          }))
          .pipe(rename('_icons.scss'))
          .pipe(gulp.dest(paths.generated))
          .on('finish', callback);
      });
    },
    function handleFonts(callback) {
      iconStream
        .pipe(gulp.dest(THEME_ROOT + 'fonts/'))
        .on('finish', callback);
    }
  ], done);
});

// Default Gulp task run on `gulp` command.
gulp.task('default', gulp.parallel('watch'));
