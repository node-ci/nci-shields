'use strict';

var fs = require('fs'),
	path = require('path');

exports.register = function(app) {
	var logger = app.lib.logger('shields listener');

	var shieldsHash = {};
	['done', 'in-progress', 'error', 'unknown'].forEach(function(status) {
		shieldsHash[status] = fs.readFileSync(
			path.resolve(__dirname, '../svg/' + status + '.svg'),
			'utf8'
		);
	});

	var getShield = function(status) {
		if (!shieldsHash[status]) {
			status = 'unknown';
		}

		return shieldsHash[status];
	};

	app.httpServer.addRequestListener(function(req, res, next) {
		var matched = req.url.match(/^\/shields\/([\-\w]+)\/build.svg/);
		if (!matched || req.method.toLowerCase() !== 'get') {
			return next();
		}

		var projectName = matched[1];
		if (!app.projects.get(projectName)) {
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end('404');
			return;
		}

		app.builds.getRecent({
			limit: 1,
			projectName: projectName
		}, function(err, builds) {
			if (err) {
				logger.err(err.stack || err);
			}

			var status = builds && builds[0] && builds[0].status || 'unknown';

			res.writeHead(200, {
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'Expires': '0'
			});
			res.end(getShield(status));
		});
	});
};
