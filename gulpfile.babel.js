'use strict';

import async from 'async'
import autoprefixer from 'gulp-autoprefixer'
import cleanCSS from 'gulp-clean-css'
import consolidate from 'gulp-consolidate'
import gulp from 'gulp'
import iconfont from 'gulp-iconfont'
import notify from 'gulp-notify'
import plumber from 'gulp-plumber'
import rename from 'gulp-rename'
import sass from 'gulp-sass'
import sassGlob from 'gulp-sass-glob'

var config = require('./gulp-config.json');

const THEME_ROOT = config.theme_root;
const FONT_NAME = config.iconfont_name;
const STYLE_FILE = config.style_file_name;

const paths = {
  styles: {
    scss: `${THEME_ROOT}scss/`,
    css: `${THEME_ROOT}css/`
  },
  generated: `${THEME_ROOT}scss/generated/`,
  img: `${THEME_ROOT}img/`
};

// Default Gulp task run on `gulp` command.
gulp.task('default', ['watch']);

// A gulp watcher function.
gulp.task('watch', function(){
  // Watch SASS files.
  gulp.watch(paths.styles.scss + '**/*.scss', ['styles']);
  // Watch for new or changed icons.
  gulp.watch(paths.img + 'icons/*.svg', ['icons']);
});

// Compile SASS to CSS. Handle errors with plumber function.
gulp.task('styles', function(){
  gulp.src([paths.styles.scss + '**/*.scss', paths.styles.scss + 'print.scss'])
  .pipe(sassGlob())
  .pipe(plumber({ errorHandler: function(err) {
    notify.onError({
      title: "Gulp error in " + err.plugin,
      message: err.toString()
    })(err);
  }}))
  .pipe(sass())
  .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false,
  }))
  .pipe(gulp.dest(paths.styles.css))
  // Continue with minifying newly created css files.
  .pipe(cleanCSS())
  .pipe(gulp.dest(paths.styles.css));
});

// Generate icon font and a SCSS file.
gulp.task('icons', function(done) {
  var iconStream = gulp.src(paths.img + 'icons/*.svg')
    .pipe(iconfont({
      fontHeight: 1001,
      fontName: FONT_NAME,
      formats: ['svg', 'ttf', 'eot', 'woff', 'woff2'],
      normalize: true,
      prependUnicode: true,
    }));

  async.parallel([
    function handleGlyphs (cb) {
      iconStream.on('glyphs', function(glyphs, options) {
        gulp.src(paths.styles.scss + '_icon-template.scss')
          .pipe(consolidate('lodash', {
            glyphs: glyphs,
            fontName: FONT_NAME,
            fontPath: '../fonts/',
            className: 's'
          }))
          .pipe(rename('_icons.scss'))
          .pipe(gulp.dest(paths.generated))
          .on('finish', cb);
      });
    },
    function handleFonts (cb) {
      iconStream
        .pipe(gulp.dest(THEME_ROOT + 'fonts/'))
        .on('finish', cb);
    }
  ], done);
});
