const gulp = require('gulp');
/** REMOVE ME **/ const decache = require('../../');
/** USE ME **/ // const decache = require('gulp-css-decache');

gulp.task('decache', () => (
  gulp.src(['css/*.css'])
    .pipe(decache({ base: './public/', md5: true }))
    .pipe(gulp.dest('./public'))
));

gulp.task('default', ['decache']);
