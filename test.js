'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var decache = require('./');

it('should decache url()', function (cb) {
  var stream = decache({ value: '0.0.1' });

  stream.on('data', function (file) {
    assert(/\?decache=0\.0\.1/.test(file.contents.toString('utf8')));
    cb();
  });

  stream.write(new gutil.File({
    contents: new Buffer('body { background: url("fantastic_Image@2x.jpg"); }')
  }));
});
