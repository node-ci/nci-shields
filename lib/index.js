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

	var sendSvg = function(res, status) {
		if (!shieldsHash[status]) {
			status = 'unknown';
		}

		res.set({
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'no-cache, no-store, must-revalidate',
			'Expires': '0'
		});

		res.end(shieldsHash[status]);
	};

	app.express.get('/shields/:projectName.svg', function(req, res, next) {
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

			sendSvg(res, !_(builds).isEmpty() && _(builds).first().status);
		});
	});

	app.express.get('/shields/builds/:id(\\d+).svg', function(req, res, next) {
		app.builds.get(Number(req.params.id), function(err, build) {
			if (err) {
				logger.error(err.stack || err);
			}

			if (build) {
				sendSvg(res, build.status);
			} else {
				res.sendStatus(404);
			}
		});
	});
};
