# gulp-css-decache [![Build Status](https://travis-ci.org/suprMax/gulp-css-decache.svg?branch=master)](https://travis-ci.org/suprMax/gulp-css-decache)

> Finds all url() statements in your CSS files and adds cachebusting parameters to them.


## Install

```
$ npm install --save-dev gulp-css-decache
```


## Usage

```js
var gulp = require('gulp');
var decache = require('gulp-css-decache');

gulp.task('decache', function() {
  return gulp.src(['css/*.css'])
    .pipe(decache({ base : './public/', md5: true, ignore: [/regexToMatchURIsToSkip/] }))
    .pipe(gulp.dest('./public'));
});
```


## License

MIT © [Max Degterev](http://max.degterev.me)
