module.exports = (argvs, folder) => {
	const options = { port: 3000, http2: false, folder };

	argvs.forEach(argv => {
	  if (argv === '--http2') options.http2 = true;
	  if (argv.startsWith('--path=')) options.folder = argv.split('=')[1];
	  if (argv.startsWith('--port=')) options.port = argv.split('=')[1];
	});

	return options;
};
