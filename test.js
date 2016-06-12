'use strict';

var _ = require('underscore'),
	expect = require('expect.js'),
	sinon = require('sinon'),
	plugin = require('./lib');

describe('Shields', function() {
	var handler;

	var app = {
		lib: {
			logger: function() {
				return {log: _.noop, error: _.noop};
			}
		},
		projects: {},
		builds: {},
		httpApp: {
			get: function(route, _handler) {
				handler = _handler;
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

	before(function() {
		plugin.register(app);
	});

	beforeEach(function() {
		res.sendStatus.reset();
		res.set.reset();
		res.end.reset();
	});

	it('should be ok with unexisted project', function() {
		app.projects.get = sinon.stub().returns(null);
		handler(getReq({projectName: 'unexisted'}), res);

		expect(res.sendStatus.firstCall.args[0]).to.eql(404);
	});

	it('should be ok with project without builds', function() {
		app.projects.get = sinon.stub().returns({});
		app.builds.getRecent = sinon.stub().callsArgWith(1, null, []);
		handler(getReq({projectName: 'ok'}), res);

		checkSvg('unknown');
	});

	it('should be ok with getRecent error', function() {
		app.projects.get = sinon.stub().returns({});
		app.builds.getRecent = sinon.stub().callsArgWith(1, new Error());
		handler(getReq({projectName: 'ok'}), res);

		checkSvg('unknown');
	});

	it('should be ok with getRecent non-Error instance error', function() {
		app.projects.get = sinon.stub().returns({});
		app.builds.getRecent = sinon.stub().callsArgWith(1, 'error');
		handler(getReq({projectName: 'ok'}), res);

		checkSvg('unknown');
	});

	_({
		done: 'passing',
		'in-progress': 'in progress',
		error: 'failing'
	}).each(function(text, status) {
		it('should be ok with `' + status + '` build', function() {
			app.projects.get = sinon.stub().returns({});
			app.builds.getRecent = sinon.stub()
				.callsArgWith(1, null, [{status: status}]);
			handler(getReq({projectName: 'ok'}), res);

			checkSvg(text);
		});
	});
});
