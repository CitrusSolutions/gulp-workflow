# gulp-workflow
A custom workflow for compiling theme files with Gulp. It compiles and minifies scss files and turns svg files into a iconfont. Compiler provides scss sourcemaps as well.

## Installation
Before using this magnificent Gulp Workflow be sure to check that you have [Node](https://nodejs.org/), [NPM](https://www.npmjs.com/) and [Gulp with Gulp CLI](https://gulpjs.com/) globally installed on your microcomputer.

You can just clone this repository and start using it or install it with Composer. Add this to your _composer.json_. Replace the version number with the latest version.
```
{
  "type": "package",
  "package": {
    "name": "citrussolutions/gulp-workflow",
    "version": "2.0.0",
    "type": "project",
    "source": {
      "url": "https://github.com/CitrusSolutions/gulp-workflow.git",
      "type": "git",
      "reference": "origin/master"
    }
  }
}
```

and add `"citrussolutions/gulp-workflow: "2.0.0",` to your list of development requirements.

### NPM packages
Dependencies are handled in _package.json_ file. Before running Gulp you must install dependencies with node package manager by running:
```
npm install
```

## Usage
Gulp workflow automatically detects Drupal site's themes and compiles them.

On default when running `gulp` in your terminal the system will activate `gulp watch` function. It watches SCSS files and uses the iconfont compiler.

The workflow will try to find themes under directory `web/themes/custom` and iconfiles under directory `web/themes/custom/theme_name/img/icons` and turn them into an iconfont found inside `web/themes/custom/theme_name/fonts`.

### Possible legacy stuff

Overriding the default theme watcher is possible by creating a file named _gulp-config.json_ file in the same directory as the _gulpfile.babel.js_. Best way is to link your existing config next to _gulpfile.babel.js_. The configuration can be used to make compiler watch only single theme e.g. in a special path.

You can use this example content in creating the config file.
```
{
  "theme_root" : "web/themes/custom/theme_name"
}
```

Additionally you can change the iconfont's name with config file by adding this to your _gulp-config.json_. Otherwise iconfont's name is set to _icons_.

```
  "iconfont_name" : "font_name"
```
