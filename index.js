'use strict';
var _ = require('lodash');
var gutil = require('gulp-util');
var through = require('through2');
var md5File = require('md5-file');
var fs = require('fs');

const PLUGIN_NAME = 'gulp-css-decache';
const REGEX = 'url\\s*\\(["\']?([a-zA-Z0-9\\/\\.\\?=\\-_#@]+)["\']?\\)';
const NOW = Date.now();

var getBuster = function(url, opts) {
  var file, stats;

  file = url.split('?')[0].split('#')[0];
  if (file.charAt(0) === '/') file = file.substr(1);

  if (opts.base) {
    file = opts.base + file;

    try {
      stats = fs.statSync(file);
    }
    catch (e) {
      return null;
    }

    if (stats) {
      if (opts.md5 && !stats.isDirectory()) {
        return md5File(file);
      }
      else {
        return +(new Date(stats.mtime));
      }
    }
  }

  return NOW;
};

var getReplacement = function(statement, opts) {
    var matches = statement.match(new RegExp(REGEX)),
        url = matches[1],

        prefix = url.indexOf('?') >= 0 ? '&' : '?',
        buster = getBuster(url, opts),
        insert = opts.name + '=' + getBuster(url, opts),

        replacement;

    if (!buster) return null;

    if (url.indexOf('#') >= 0) {
      var urlParts = url.split('#');
      replacement = urlParts[0] + prefix + insert + '#' + urlParts[1];
    }
    else {
      replacement = url + prefix + insert;
    }

  return 'url("' + replacement + '")';
};

var decacheFile = function(source, opts) {
  var matches = source.match(new RegExp(REGEX, 'g')),
      replacement;

  if (!matches) return source;

  for (var i = 0, _i = matches.length; i < _i; i++) {
    replacement = getReplacement(matches[i], opts);
    // Sometimes there is no replacement, like MD5 mode is on and file is not located on the disk.
    if (replacement) source = source.replace(matches[i], replacement);
  }

  return source;
};

module.exports = function (opts) {
  opts = _.defaults(opts || {}, {
    name: 'decache',
    md5: false,
    base: null
  });

  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      cb(null, file);
      return;
    }

    if (file.isStream()) {
      cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
      return;
    }

    try {
      file.contents = new Buffer(decacheFile(file.contents.toString(), opts).toString());
      this.push(file);
    } catch (err) {
      this.emit('error', new gutil.PluginError(PLUGIN_NAME, err, { fileName: file.path }));
    }

    cb();
  });
};
