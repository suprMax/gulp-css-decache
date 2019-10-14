const assert = require('assert');
const Vinyl = require('vinyl');

const decache = require('./');

it('should decache url()', (done) => {
  const stream = decache({ value: '0.0.1' });

  stream.on('data', (file) => {
    assert(/\?decache=0\.0\.1/.test(file.contents.toString('utf8')));
    done();
  });

  stream.write(new Vinyl({
    contents: Buffer.from('body { background: url("fantastic_Image@2x.jpg"); }'),
  }));
});
