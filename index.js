const fs = require('fs');
const path = require('path');

const through2 = require('through2');
const md5File = require('md5-file');
const url = require('url');

const colors = require('ansi-colors');
const PluginError = require('plugin-error');
const log = require('fancy-log');

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
  if (urlPath.includes('#VML')) return null;
  if (options.value) return options.value;

  const { name, base, md5, logStrange, logMissing } = options;
  const { query, pathname } = url.parse(urlPath);

  if (query && query.includes(`${name}=`)) return null; // already processed

  if (!pathname) {
    if (logStrange) log('Strange declaration encountered', colors.red(urlPath));
    return null;
  }

  const file = path.join(`${base}/`, pathname);
  let stats;

  try {
    stats = fs.statSync(file);
  } catch (e) {
    if (logMissing) log('File not found', colors.red(file));
    return null;
  }

  if (stats) {
    if (md5 && !stats.isDirectory()) return md5File.sync(file);
    return Number(new Date(stats.mtime));
  }

  return null;
};

const getReplacement = (statement, options) => {
  const fileUrl = statement.match(new RegExp(REGEX))[1];

  const prefix = fileUrl.includes('?') ? '&' : '?';
  const buster = getBuster(fileUrl, options);
  const insert = `${options.name}=${buster}`;

  if (!buster) return null;

  let replacement;

  if (fileUrl.includes('#')) {
    const [fragment, hash] = fileUrl.split('#');
    replacement = `${fragment}${prefix}${insert}#${hash}`;
  } else {
    replacement = fileUrl + prefix + insert;
  }

  return `url("${replacement}")`;
};

const decacheFile = (source, options) => {
  const matches = source.match(new RegExp(REGEX, 'g'));
  if (!matches) return source;

  return matches.reduce((result, match) => {
    const replacement = getReplacement(match, options);
    // Sometimes there is no replacement, like MD5 mode is on and file is not on the disk.
    if (replacement) return result.replace(match, replacement);
    return result;
  }, source);
};

const getStreamReader = (userOptions) => {
  const options = { ...DEFAULT_OPTIONS, ...userOptions };

  const parseStream = function(chunk, encoding, callback) {
    if (chunk.isNull()) {
      callback(null, chunk);
      return;
    }

    if (chunk.isStream()) {
      callback(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
      return;
    }

    try {
      const processed = decacheFile(chunk.contents.toString(ENCODING), options);
      chunk.contents = Buffer.from(processed.toString(ENCODING));
      this.push(chunk);
    } catch (error) {
      this.emit('error', new PluginError(PLUGIN_NAME, error, {
        fileName: chunk.path,
      }));
    }

    callback();
  };

  return through2.obj(parseStream);
};

module.exports = getStreamReader;
