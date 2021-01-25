const { createServer } = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');
const contentTypes = require('./content-types');

module.exports = class Server {

  constructor(folder = './') {
    this.folder = folder;
    this.server = createServer(this.onRequest.bind(this));
  }

  sendFile(request) {
    const stat = fs.statSync(request.filePath);
    if (stat.isDirectory()) return this.sendFile({ ...request, filePath: path.normalize(`${request.filePath}/index.html`) });
    request.res.setHeader('Content-Type', request.contentType || 'text/html');
    request.res.writeHead(200, { 'Content-Length': stat.size });
    fs.createReadStream(request.filePath).pipe(request.res);
    console.log('\x1b[32m%s\x1b[0m', `${request.res.statusCode} - ${request.pathname} - ${request.filePath} as ${request.res.getHeader('Content-Type')}`);
  }

  send404(request, err) {
    request.res.setHeader('Content-Type', request.contentType || 'text/html');
    request.res.writeHead(404, { 'Content-Length': Buffer.byteLength(err.message) });
    request.res.end();
    console.log('\x1b[31m%s\x1b[0m', `${request.res.statusCode} - ${request.pathname} - ${'404 ERROR'} as ${request.res.getHeader('Content-Type')}`);
  }

  onRequest(req, res) {
    const pathname = url.parse(req.url).pathname;
    const filePath = path.normalize(`${this.folder}${pathname}`);
    const extension = path.parse(filePath).ext;
    const contentType = contentTypes[extension];
    const request = { res, filePath, contentType, pathname };

    try {
      this.sendFile(request);
    } catch (err) {
      if (extension === '') {
        this.sendFile({ ...request, filePath: path.normalize(`${this.folder}/index.html`) });
      } else {
        this.send404(request, err);
      }
    }
  }

  listen(port = 3000) {
    this.server.listen(port);
    console.log('\x1b[36m%s\x1b[0m', `Serving ${this.folder} folder at http://localhost:${port}`);
  }

  close() {
    this.server.close();
  }

}
