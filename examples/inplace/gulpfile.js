var gulp = require('gulp');
/** REMOVE ME **/ var decache = require('../../');
/** USE ME **/ // var decache = require('gulp-css-decache');

gulp.task('decache', function() {
  return gulp.src(['css/*.css'])
    .pipe(decache({ base : './public/', md5: true }))
    .pipe(gulp.dest('./public'));
});

gulp.task('default', ['decache']);
