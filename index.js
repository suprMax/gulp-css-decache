const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const through2 = require('through2');
const md5File = require('md5-file');
const url = require('url');

const gutil = require('gulp-util');

const PLUGIN_NAME = 'gulp-css-decache';
const REGEX = 'url\\s*\\(["\']?([a-zA-Z0-9\\/\\.\\?=\\-_#@]+)["\']?\\)';
const ENCODING = 'utf8';

const DEFAULT_OPTIONS = {
  name: 'decache',
  value: null,
  md5: true,
  base: process.cwd(),
  logMissing: false,
  logStrange: true,
};


const getBuster = (urlPath, options) => {
  // Archaic VML standart that is still supported by some libraries
  // Format: https://msdn.microsoft.com/en-us/library/ee384217(v=vs.85).aspx
  // Some libraries: https://github.com/Leaflet/Leaflet/blob/master/dist/leaflet.css#L99
  if (urlPath.includes('VML')) return null;
  if (options.value) return options.value;

  const { name, base, md5, logStrange, logMissing } = options;
  const parsed = url.parse(urlPath);
  const query = parsed.query ? querystring.parse(parsed.query || {}) : {};

  let file = parsed.pathname;
  let stats;

  if (query[name]) return null; // already processed

  if (!file) {
    if (logStrange) gutil.log('Strange declaration encountered', gutil.colors.red(urlPath));
    return null;
  }

  file = path.join(`${base}/`, file);

  try {
    stats = fs.statSync(file);
  } catch (e) {
    if (logMissing) gutil.log('File not found', gutil.colors.red(file));
    return null;
  }

  if (stats) {
    if (md5 && !stats.isDirectory()) return md5File.sync(file);
    return +(new Date(stats.mtime));
  }

  return null;
};

const getReplacement = (statement, options) => {
  const matches = statement.match(new RegExp(REGEX));
  const fileUrl = matches[1];

  const prefix = fileUrl.indexOf('?') === -1 ? '?' : '&';
  const buster = getBuster(fileUrl, options);
  const insert = `${options.name}=${buster}`;

  let replacement;

  if (!buster) return null;

  if (fileUrl.indexOf('#') === -1) {
    replacement = fileUrl + prefix + insert;
  } else {
    const urlParts = fileUrl.split('#');
    replacement = `${urlParts[0]}${prefix}${insert}#${urlParts[1]}`;
  }

  return `url("${replacement}")`;
};

const decacheFile = (source, options) => {
  const matches = source.match(new RegExp(REGEX, 'g'));
  if (!matches) return source;

  matches.forEach((match) => {
    const replacement = getReplacement(match, options);
    // Sometimes there is no replacement, like MD5 mode is on and file is not on the disk.
    if (replacement) source = source.replace(match, replacement);
  });

  return source;
};

const getStreamReader = (userOptions) => {
  const options = Object.assign(DEFAULT_OPTIONS, userOptions);

  const parseStream = function(chunk, encoding, callback) {
    if (chunk.isNull()) {
      callback(null, chunk);
      return;
    }

    if (chunk.isStream()) {
      callback(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
      return;
    }

    try {
      const processed = decacheFile(chunk.contents.toString(ENCODING), options);
      chunk.contents = new Buffer(processed.toString(ENCODING));
      this.push(chunk);
    } catch (error) {
      this.emit('error', new gutil.PluginError(PLUGIN_NAME, error, {
        fileName: chunk.path,
      }));
    }

    callback();
  };

  return through2.obj(parseStream);
};

module.exports = getStreamReader;
