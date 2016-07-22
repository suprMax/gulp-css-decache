'use strict';
var gutil = require('gulp-util');

var through2 = require('through2');
var md5File = require('md5-file');

var fs = require('fs');
var path = require('path');

var querystring = require('querystring');
var url = require('url');

const PLUGIN_NAME = 'gulp-css-decache';
const REGEX = 'url\\s*\\(["\']?([a-zA-Z0-9\\/\\.\\?=\\-_#@]+)["\']?\\)';
const ENCODING = 'utf8';


var getBuster = function(urlPath, opts) {
  if (opts.value) return opts.value;

  var parsed = url.parse(urlPath),
      file = parsed.pathname,
      query = parsed.query ? querystring.parse(parsed.query) : {},
      stats;

  if (query[opts.name]) return null; // already processed

  if (!file) {
    if (opts.logMissing) gutil.log('Strange declaration encountered', gutil.colors.red(urlPath));
    return null;
  }

  file = path.join(opts.base + '/', file);

  try {
    stats = fs.statSync(file);
  }
  catch (e) {
    if (opts.logMissing) gutil.log('File not found', gutil.colors.red(file));
    return null;
  }

  if (stats) {
    if (opts.md5 && !stats.isDirectory()) {
      return md5File.sync(file);
    }
    else {
      return +(new Date(stats.mtime));
    }
  }

  return null;
};

var getReplacement = function(statement, opts) {
  var matches = statement.match(new RegExp(REGEX)),
      url = matches[1],

      prefix = url.indexOf('?') === -1 ? '?' : '&',
      buster = getBuster(url, opts),
      insert = opts.name + '=' + buster,

      replacement;

  if (!buster) return null;

  if (url.indexOf('#') === -1) {
    replacement = url + prefix + insert;
  }
  else {
    var urlParts = url.split('#');
    replacement = urlParts[0] + prefix + insert + '#' + urlParts[1];
  }

  return 'url("' + replacement + '")';
};

var decacheFile = function(source, opts) {
  var matches = source.match(new RegExp(REGEX, 'g')),
      replacement;

  if (!matches) return source;

  matches.forEach(function(match) {
    replacement = getReplacement(match, opts);
    // Sometimes there is no replacement, like MD5 mode is on and file is not located on the disk.
    if (replacement) source = source.replace(match, replacement);
  });

  return source;
};

module.exports = function (opts) {
  var defaults = {
    name: 'decache',
    value: null,
    md5: true,
    base: process.cwd(),
    logMissing: false
  };

  opts = Object.assign(defaults, opts || {})

  return through2.obj(function (file, enc, next) {
    if (file.isNull()) {
      next(null, file);
      return;
    }

    if (file.isStream()) {
      next(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
      return;
    }

    try {
      file.contents = new Buffer(decacheFile(file.contents.toString(ENCODING), opts).toString(ENCODING));
      this.push(file);
    } catch (err) {
      this.emit('error', new gutil.PluginError(PLUGIN_NAME, err, { fileName: file.path }));
    }

    next();
  });
};
