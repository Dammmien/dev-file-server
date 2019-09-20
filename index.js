const { createServer } = require('http');
const { createSecureServer, constants } = require('http2');
const fs = require('fs');
const url = require('url');
const path = require('path');
const contentTypes = require('./content-types');
const getOptions = require('./arguments');
const { port, http2, folder } = getOptions(process.argv, process.cwd());
const child_process = require('child_process');
child_process.execSync(`openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -keyout localhost-privkey.pem -out localhost-cert.pem`);

const sendFile = (request) => {
  const stat = fs.statSync(request.filePath);
  if (stat.isDirectory()) return sendFile({ ...request, filePath: path.normalize(`${request.filePath}/index.html`) });
  request.res.setHeader('Content-Type', request.contentType || 'text/html');
  request.res.writeHead(200, { 'Content-Length': stat.size });
  fs.createReadStream(request.filePath).pipe(request.res);
  console.log(`\x1b[32m ${request.res.statusCode} - ${request.pathname} - ${request.filePath} as ${request.res.getHeader('Content-Type')}`);
};

const send404 = (request, err) => {
  request.res.setHeader('Content-Type', request.contentType);
  request.res.writeHead(404, { 'Content-Length': Buffer.byteLength(err.message) });
  request.res.end();
  console.log(`\x1b[31m ${request.res.statusCode} - ${request.pathname} - ${'404 ERROR'} as ${request.res.getHeader('Content-Type')}`);
};

const onRequest = (req, res) => {
  const pathname = url.parse(req.url).pathname;
  const filePath = `${folder}${pathname}`;
  const extension = path.parse(filePath).ext;
  const contentType = contentTypes[extension];
  const request = { res, filePath, contentType, pathname };

  try {
    sendFile(request);
  } catch (err) {
    extension === '' ? sendFile({ ...request, filePath: path.normalize(`${folder}/index.html`) }) : send404(request, err);
  }
};

const getHttp2Options = () => ({
  key: fs.readFileSync('localhost-privkey.pem'),
  cert: fs.readFileSync('localhost-cert.pem'),
  allowHTTP1: true
});

const server = http2 ? createSecureServer(getHttp2Options(), onRequest) : createServer(onRequest);

server.listen(port);

console.log(`${folder} served at http://localhost:${port}\n`);
