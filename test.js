'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	plugin = require('./lib');

describe('Shields plugin', function() {
	var projectHandler, buildHandler, projectRevHandler;

	var app = {
		lib: {
			logger: function() {
				return {log: _.noop, error: _.noop};
			}
		},
		projects: {},
		builds: {},
		express: {
			get: function(route, handler) {
				switch (route) {
					case '/shields/:projectName.svg':
						projectHandler = handler;
						break;
					case '/shields/builds/:id(\\d+).svg':
						buildHandler = handler;
						break;
					case '/shields/:projectName/revs/:rev.svg':
						projectRevHandler = handler;
						break;
					default:
						break;
				}
			}
		}
	};

	var res = {
		sendStatus: sinon.spy(),
		set: sinon.spy(),
		end: sinon.spy()
	};

	var getReq = function(params) {
		return {
			params: params
		};
	};

	var checkSvg = function(text) {
		expect(res.set.firstCall.args[0]['Content-Type'])
			.to.eql('image/svg+xml');
		expect(res.end.firstCall.args[0]).match(new RegExp(text));
	};

	var statusesHash = {
		done: 'passing',
		'in-progress': 'in progress',
		error: 'failing'
	};

	before(function() {
		plugin.register(app);
	});

	beforeEach(function() {
		res.sendStatus.reset();
		res.set.reset();
		res.end.reset();
	});

	describe('project', function() {
		it('should be ok with unexisting project', function() {
			app.projects.get = sinon.stub().returns(null);
			projectHandler(getReq({projectName: 'unexisted'}), res);

			expect(res.sendStatus.firstCall.args[0]).to.eql(404);
		});

		it('should be ok with project without builds', function() {
			app.projects.get = sinon.stub().returns({});
			app.builds.getRecent = sinon.stub().callsArgWith(1, null, []);
			projectHandler(getReq({projectName: 'ok'}), res);

			checkSvg('unknown');
		});

		it('should be ok with getRecent error', function() {
			app.projects.get = sinon.stub().returns({});
			app.builds.getRecent = sinon.stub().callsArgWith(1, new Error());
			projectHandler(getReq({projectName: 'ok'}), res);

			checkSvg('unknown');
		});

		it('should be ok with getRecent non-Error instance error', function() {
			app.projects.get = sinon.stub().returns({});
			app.builds.getRecent = sinon.stub().callsArgWith(1, 'error');
			projectHandler(getReq({projectName: 'ok'}), res);

			checkSvg('unknown');
		});

		_(statusesHash).each(function(text, status) {
			it('should be ok with `' + status + '` build', function() {
				app.projects.get = sinon.stub().returns({});
				app.builds.getRecent = sinon.stub()
					.callsArgWith(1, null, [{status: status}]);
				projectHandler(getReq({projectName: 'ok'}), res);

				checkSvg(text);
			});
		});
	});

	describe('build', function() {
		it('should be ok with unexisting build', function() {
			app.builds.get = sinon.stub().callsArgWith(1, null, null);
			buildHandler(getReq({id: 777}), res);

			expect(res.sendStatus.firstCall.args[0]).to.eql(404);
		});

		it('should be ok with get error', function() {
			app.builds.get = sinon.stub().callsArgWith(1, new Error());
			buildHandler(getReq({id: 1}), res);

			expect(res.sendStatus.firstCall.args[0]).to.eql(404);
		});

		it('should be ok with getRecent non-Error instance error', function() {
			app.builds.get = sinon.stub().callsArgWith(1, 'error');
			buildHandler(getReq({id: 1}), res);

			expect(res.sendStatus.firstCall.args[0]).to.eql(404);
		});

		_(statusesHash).each(function(text, status) {
			it('should be ok with `' + status + '` build', function() {
				app.builds.get = sinon.stub()
					.callsArgWith(1, null, {status: status});
				buildHandler(getReq({id: 1}), res);

				checkSvg(text);
			});
		});
	});

	describe('project rev', function() {
		it('should be ok with unexisting project', function() {
			app.projects.get = sinon.stub().returns(null);
			projectRevHandler(getReq({projectName: 'unexisted'}), res);

			expect(res.sendStatus.firstCall.args[0]).to.eql(404);
		});

		it('should be ok when no builds with such rev', function() {
			app.projects.get = sinon.stub().returns({});
			app.builds.getRecent = sinon.stub().callsArgWith(1, null, []);
			projectRevHandler(getReq({projectName: 'ok'}), res);

			checkSvg('unknown');
		});

		it('should be ok with getRecent error', function() {
			app.projects.get = sinon.stub().returns({});
			app.builds.getRecent = sinon.stub().callsArgWith(1, new Error());
			projectRevHandler(getReq({projectName: 'ok'}), res);

			checkSvg('unknown');
		});

		it('should be ok with getRecent non-Error instance error', function() {
			app.projects.get = sinon.stub().returns({});
			app.builds.getRecent = sinon.stub().callsArgWith(1, 'error');
			projectRevHandler(getReq({projectName: 'ok'}), res);

			checkSvg('unknown');
		});

		_(statusesHash).each(function(text, status) {
			it('should be ok with `' + status + '` build', function() {
				app.projects.get = sinon.stub().returns({});
				app.builds.getRecent = sinon.stub()
					.callsArgWith(1, null, [{status: status}]);
				projectRevHandler(getReq({projectName: 'ok'}), res);

				checkSvg(text);
			});
		});
	});

});
