const { createServer } = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');
const contentTypes = require('./content-types');
const port = process.env.PORT || 3000;
const folder = process.env.FOLDER || './';

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
  const filePath = path.normalize(`${folder}${pathname}`);
  const extension = path.parse(filePath).ext;
  const contentType = contentTypes[extension];
  const request = { res, filePath, contentType, pathname };

  try {
    sendFile(request);
  } catch (err) {
    extension === '' ? sendFile({ ...request, filePath: path.normalize(`${folder}/index.html`) }) : send404(request, err);
  }
};

console.log(`${folder} served at http://localhost:${port}\n`);

module.exports = createServer(onRequest).listen(port);
