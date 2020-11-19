'use strict';

var async = require('async');
var autoprefixer = require('gulp-autoprefixer');
var cleanCSS = require('gulp-clean-css');
var consolidate = require('gulp-consolidate');
var fs = require('fs');
var glob = require('glob');
var gulp = require('gulp');
var iconfont = require('gulp-iconfont');
var notify = require('gulp-notify');
var path = require('path');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var sassGlob = require('gulp-sass-glob');
var sourcemaps = require('gulp-sourcemaps');
var watch = require('gulp-watch');

var runTimestamp = Math.round(Date.now() / 1000);

const paths = {
  css: '/css/',
  fonts: '/fonts',
  generated: '/scss/generated/',
  icons_dir: '/img/icons',
  icons: '/img/icons/**/*.svg',
  img: '/img/',
  scss: '/scss/**/*.scss'
};

// Default to watching all of the themes found under themes directory.
var theme_paths = glob.sync('web/themes/custom/*');
var themes = [];
theme_paths.forEach(function(path) {
  themes.push({
    name: path.split('/').splice(-1),
    path: path
  });
});

/**
 * Possible legacy stuff starts.
 */
// Check for the external gulp-config.json file. It can be used to specify
// only one theme for compiling and to give a special name for iconfont.
// This function might be ideal to remove in the future.
var config_path = './gulp-config.json';
var font_name;
if (fs.existsSync(config_path)) {
  var config = require('./gulp-config.json');
  var theme_root = config.theme_root;

  if (theme_root.charAt(theme_root.length - 1) == '/') {
    theme_root = theme_root.slice(0, -1);
  }

  // Replace the theme array with a single value
  themes = [{
    name: theme_root.split('/').splice(-1),
    path: theme_root
  }];

  font_name = config.iconfont_name;
} else {

}

// Check if iconfont is given a special name in config file.
// Otherwise set it to icons.
if (typeof font_name == 'undefined') {
  font_name = 'icons';
}
/**
 * Possible legacy stuff ends.
 */

// Create custom functions for each theme.
themes.forEach(function(theme) {
  // Create a theme specific SCSS compiler.
  gulp.task(theme.name + '_styles', function() {
    return gulp.src(theme.path + paths.scss)
    .pipe(plumber({errorHandler: function(err) {
      notify.onError({
        title: "Gulp error in " + err.plugin,
        message: err.toString()
      })(err);
      this.emit('end');
    }}))
    .pipe(sourcemaps.init())
    .pipe(sassGlob())
    .pipe(sass())
    .pipe(autoprefixer({
      cascade: false,
    }))
    .pipe(gulp.dest(theme.path + paths.css))
    // Continue with minifying newly created css files.
    .pipe(cleanCSS())
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(theme.path + paths.css));
  });

  // Create a theme specific iconfont compiler.
  gulp.task(theme.name + '_iconfont', function(done) {
    // This is a hack for fixing unicode prepend problems.
    // The newer version of gulp-iconfont doesn't understand
    // which unicode characters are already used.
    var lastUnicode = 0xEA01; //59905

    // Create config object from presets.
    var iconfontConfig = Object.create({
      fontHeight: 1001,
      fontName: font_name,
      prependUnicode: true,
      formats: ['svg', 'ttf', 'eot', 'woff', 'woff2'],
      normalize: true,
      timestamp: runTimestamp,
    });

    // Read source directory and sort by name.
    var files = fs.readdirSync(theme.path + paths.icons_dir);

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
    var iconStream = gulp.src(theme.path + paths.icons)
      .pipe(iconfont(iconfontConfig));

    async.parallel([
      function handleGlyphs(callback) {
        iconStream.on('glyphs', function(glyphs, options) {
          gulp.src(theme.path + paths.scss + '_icon-template.scss')
            .pipe(consolidate('lodash', {
              glyphs: glyphs,
              fontName: font_name,
              fontPath: '../fonts/',
              className: 's'
            }))
            .pipe(rename('_icons.scss'))
            .pipe(gulp.dest(theme.path + paths.generated))
            .on('finish', callback);
        });
      },
      function handleFonts(callback) {
        iconStream
          .pipe(gulp.dest(theme.path + paths.fonts))
          .on('finish', callback);
      }
    ], done);
  });
});

// One watcher to watch them all.
gulp.task('watch', function() {
  // Loop through theme object and watch theme specific tasks.
  themes.forEach(function(theme) {
    console.log('\x1b[32m%s\x1b[0m', 'Watching theme ' + theme.name + '.');
    // Watch for changed SCSS files.
    gulp.watch(theme.path + paths.scss, gulp.series(theme.name + '_styles'));
    // Watch for new or changed icons.
    gulp.watch(theme.path + paths.icons, gulp.series(theme.name + '_iconfont'));
  });
});

// Default Gulp task run on `gulp` command.
gulp.task('default', gulp.parallel('watch'));
