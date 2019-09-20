const { constants, createSecureServer } = require('http2');
const fs = require('fs');
const path = require('path');
const contentTypes = require('./content-types');
const [runtime, scriptName, port = 3000, folder = process.cwd()] = process.argv;
const child_process = require('child_process');
// child_process.execSync(`openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -keyout localhost-privkey.pem -out localhost-cert.pem`);

const send404 = (request, err) => {
  request.stream.respond({
    'content-type': request.contentType || 'text/html',
    'content-length': Buffer.byteLength(err.message),
    ':status': 404
  });

  request.stream.end();
};

const sendFile = request => {
  request.stream.respondWithFile(request.filePath, { 'content-type': request.contentType || 'text/html' }, {
    statCheck: (stat, headers) => {
      headers['content-length'] = stat.size;
      headers[':status'] = 200;
    },
    onError: (err) => {
      if (err.code === 'ERR_HTTP2_SEND_FILE') {
        sendFile({ ...request, filePath: path.normalize(`${request.filePath}/index.html`) });
      } else if (err.code === 'ENOENT' && request.ext === '') {
        sendFile({ ...request, filePath: path.normalize(`${folder}/index.html`) });
      } else {
        send404(request, err);
      }
    }
  });
};

const key = fs.readFileSync('localhost-privkey.pem');
const cert = fs.readFileSync('localhost-cert.pem');
const server = createSecureServer({ key, cert });

server.on('error', err => console.error(err));

server.on('stream', (stream, headers) => {
  const pathname = headers[':path'];
  const filePath = `${folder}${pathname}`;
  const { ext } = path.parse(filePath);
  const request = { stream, filePath, contentType: contentTypes[ext], pathname, ext };

  stream.on('close', () => {
    const { sentHeaders: { ':status': status, 'content-type': contentType } } = stream;
    console.log(`\x1b[3${status === 200 ? 2 : 1}m ${status} - ${pathname} as ${contentType}`);
  });

  sendFile(request);
});

server.listen(port);
console.log(`${folder} served at http://localhost:${port}\n`);
