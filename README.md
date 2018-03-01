# gulp-workflow
A custom workflow for compiling theme files with Gulp. It compiles and minifies scss files and compiles svg files into a iconfont.

## Installation
You can just clone this repository and start using it or install it with Composer. Add this to your _composer.json_
```
{
  "type": "package",
  "package": {
    "name": "gulp-workflow",
    "version": "dev-master",
    "type": "project",
    "source": {
      "url": "https://github.com/CitrusSolutions/gulp-workflow.git",
      "type": "git",
      "reference": "origin/master"
    }
  }
}
```

and add `"gulp-workflow": "dev-master",` to your list of requirements.

### NPM packages
Dependencies are handled in _package.json_ file. Before running Gulp you must install dependencies with node package manager by running:
```
npm install
```

## Usage
Gulp workflow needs a _gulp-config.json_ file in the same directory as the _gulpfile.babel.js_. Best way is to link your existing config next to _gulpfile.babel.js_.

You can use this example content in creating the config file.
```
{
  "theme_root" : "web/themes/custom/theme_name/"
}
```

Additionally you can change the iconfont's name with config file by adding this to your _gulp-config.json_. Otherwise iconfont's name is set to _icons_.

```
  "iconfont_name" : "font_name"
``
