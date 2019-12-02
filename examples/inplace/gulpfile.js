const gulp = require('gulp');
// REMOVE THIS
const gulpCssDecache = require('../../');
// USE THIS
// const decache = require('gulp-css-decache');

const decache = () => (
  gulp.src(['css/*.css'])
    .pipe(gulpCssDecache({ base: './public/', logMissing: true, ignore: [/^skipped/] }))
    .pipe(gulp.dest('./public'))
);

exports.default = decache;
