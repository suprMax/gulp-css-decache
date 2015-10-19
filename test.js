'use strict';
var assert = require('assert');
var gutil = require('gulp-util');
var decache = require('./');

it('should decache url()', function (cb) {
  var stream = decache();

  stream.on('data', function (file) {
    console.warn(file.contents.toString())
    assert(/\?decache=\d+/.test(file.contents.toString()));
    cb();
  });

  stream.write(new gutil.File({
    contents: new Buffer('body { background: url("fantastic_Image@2x.jpg"); }')
  }));
});
