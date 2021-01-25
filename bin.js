#!/usr/bin/env node

const Server = require('./index.js');
const server = new Server(process.env.FOLDER);

server.listen(process.env.PORT);
