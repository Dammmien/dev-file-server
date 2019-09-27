const assert = require('assert').strict;
const http2 = require('http2');
const fs = require('fs');

const child_process = require('child_process');
child_process.execSync(`openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -keyout localhost-privkey.pem -out localhost-cert.pem`);

const ca = fs.readFileSync('localhost-cert.pem');
const client = http2.connect('https://localhost:8000', { ca });

const get = (path, data = '', headers = '') => new Promise((res, rej) => {
	const req = client.request({ ':path': path });

	req.on('response', response => headers = response);
	req.on('data', chunk => data += chunk);
	req.on('error', rej);
	req.on('end', () => res({ data, headers }));

	req.end();
});

const test = async (path, filePath, status, contentType) => {
	const { data, headers } = await get(path);
	const file = filePath ? fs.readFileSync(filePath, 'utf8') : '';

	try {
		assert.strictEqual(headers['content-type'], contentType);
	} catch({ actual, expected}) {
		console.error( `Incorrect Content-Type for path: '${path}', received: ${actual} instead of ${expected}`);
	}

	try {
		assert.strictEqual(headers[':status'], status);
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
	await test('/', './index.html', 200, 'text/html');
	await test('/index.html', './index.html', 200, 'text/html');
	await test('/bar', './index.html', 200, 'text/html');
	await test('/bar/toto', './index.html', 200, 'text/html');
	await test('/foo', './foo/index.html', 200, 'text/html');
	await test('/test.png', './test.png', 200, 'image/png');
	await test('/foo.css', null, 404, 'text/css');

	client.close();
};

run();
