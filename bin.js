#!/usr/bin/env node

const serve = require('./index.js');

let port = 3000;
let http2 = false;
let folder = process.cwd();

process.argv.forEach(argv => {
  if (argv === '--http2') http2 = true;
  if (argv.startsWith('--path=')) folder = argv.split('=')[1];
  if (argv.startsWith('--port=')) port = argv.split('=')[1];
});

serve(port, folder, http2);
