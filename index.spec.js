const assert = require('assert').strict;
const fs = require('fs');
const Server = require('./index.js');
const http = require('http');
const server = new Server('./example');
const PORT = 3000;

const get = (path, data = '') => new Promise((resolve, rej) => {
  http.get(`http://localhost:${PORT}${path}`, res => {
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => resolve({ data, headers: res.headers, statusCode: res.statusCode }));
  }).on("error", (err) => {
    reject({});
  });
});

const test = async (path, filePath, status, contentType) => {
  const { data, headers, statusCode } = await get(path);
  const file = filePath ? fs.readFileSync(filePath, 'utf8') : '';

  try {
    assert.strictEqual(headers['content-type'], contentType);
  } catch({ actual, expected}) {
    console.error( `Incorrect Content-Type for path: '${path}', received: ${actual} instead of ${expected}`);
  }

  try {
    assert.strictEqual(statusCode, status);
  } catch({ actual, expected}) {
    console.error( `Incorrect status for path: '${path}', received: ${actual} instead of ${expected}`);
  }

  try {
    assert.strictEqual(data, file);
  } catch({ actual, expected}) {
    console.error( `Incorrect content for path: '${path}', received: ${actual} instead of ${expected}`);
  }
};

const run = async () => {
  server.listen(PORT);

  await test('/', './example/index.html', 200, 'text/html');
  await test('/index.html', './example/index.html', 200, 'text/html');
  await test('/bar', './example/index.html', 200, 'text/html');
  await test('/bar/toto', './example/index.html', 200, 'text/html');
  await test('/foo', './example/foo/index.html', 200, 'text/html');
  await test('/test.png', './example/test.png', 200, 'image/png');
  await test('/foo.css', null, 404, 'text/css');
  await test('/...', null, 404, 'text/html');

  server.close();
};

run();
