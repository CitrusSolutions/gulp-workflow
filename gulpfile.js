var async = require('async');
var autoprefixer = require('gulp-autoprefixer');
var cleanCSS = require('gulp-clean-css');
var consolidate = require('gulp-consolidate');
var gulp = require('gulp');
var iconfont = require('gulp-iconfont');
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var sassGlob = require('gulp-sass-glob');

var config = require('./gulp-config.json');

const THEME_ROOT = config.theme_root;
const FONT_NAME = config.iconfont_name;
const STYLE_FILE = config.style_file_name;

const PATHS = {
  scss: `${THEME_ROOT}scss/`,
  css: `${THEME_ROOT}css/`,
  generated: `${THEME_ROOT}scss/generated/`,
  img: `${THEME_ROOT}img/`
};

// Default Gulp task run on `gulp` command.
gulp.task('default', ['watch']);

// A gulp watcher function.
gulp.task('watch', function(){
  // Watch SASS files.
  gulp.watch(PATHS.scss + '**/*.scss', ['sass']);
  // Watch for changes in main stylesheet.
  gulp.watch(PATHS.css + '*.css', ['minify-css']);
  // Watch for new or changed icons.
  gulp.watch(PATHS.img + 'icons/*.svg', ['icons']);
});

// Compile SASS to CSS. Handle errors with plumber function.
gulp.task('sass', function(){
  gulp.src([PATHS.scss + STYLE_FILE, PATHS.scss + 'print.scss'])
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
  .pipe(gulp.dest(PATHS.css))
});

// Minify SASS to CSS.
gulp.task('minify-css', function() {
  return gulp.src(PATHS.css + '*.css')
    .pipe(cleanCSS())
    .pipe(gulp.dest(PATHS.css));
});

// Generate icon font and a SCSS file.
gulp.task('icons', function(done) {
  var iconStream = gulp.src(PATHS.img + 'icons/*.svg')
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
        gulp.src(PATHS.scss + '_icon-template.scss')
          .pipe(consolidate('lodash', {
            glyphs: glyphs,
            fontName: FONT_NAME,
            fontPath: '../fonts/',
            className: 's'
          }))
          .pipe(rename('_icons.scss'))
          .pipe(gulp.dest(PATHS.generated))
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
