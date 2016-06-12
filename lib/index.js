'use strict';

var _ = require('underscore'),
	fs = require('fs'),
	path = require('path');

exports.register = function(app) {
	var logger = app.lib.logger('shields listener');

	var shieldsHash = {};
	_(['done', 'in-progress', 'error', 'unknown']).each(function(status) {
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

	app.httpApp.get('/shields/:projectName.svg', function(req, res, next) {
		if (!app.projects.get(req.params.projectName)) {
			return res.sendStatus(404);
		}

		app.builds.getRecent({
			limit: 1,
			projectName: req.params.projectName
		}, function(err, builds) {
			if (err) {
				logger.error(err.stack || err);
			}

			var status = !_(builds).isEmpty() && _(builds).first().status;

			res.set({
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'Expires': '0'
			});
			res.end(getShield(status));
		});
	});
};
