const gulp = require('gulp');
// REMOVE THIS
const decache = require('../../');
// USE THIS
// const decache = require('gulp-css-decache');

gulp.task('decache', () => (
  gulp.src(['css/*.css'])
    .pipe(decache({ base: './public/', logMissing: true }))
    .pipe(gulp.dest('./public'))
));

gulp.task('default', ['decache']);
