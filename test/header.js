/**
 * @fileoverview Test for the module "header.js"
 * @author doberkofler
 */


/* jshint node: true */
/* global describe: false, it:false */


//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var assert = require('chai').assert;
var tough = require('tough-cookie');
var header = require('../lib/header');


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------
describe('header', function () {
	'use strict';

	describe('when calling tough-cookie.parse()', function () {
		it('the cookie string should return an object', function () {
			var cookie = {};

			assert.strictEqual(tough.Cookie.parse('', true), undefined);
			assert.strictEqual(tough.Cookie.parse('a', true), undefined);
			assert.strictEqual(tough.Cookie.parse('=a', true), undefined);

			cookie = tough.Cookie.parse('c1=v1', true);
			assert.strictEqual(cookie.key, 'c1');
			assert.strictEqual(cookie.value, 'v1');

			cookie = tough.Cookie.parse('c1="this is the value"', true);
			assert.strictEqual(cookie, undefined);

			cookie = tough.Cookie.parse('c1=this is the value', false);
			assert.strictEqual(cookie.key, 'c1');
			assert.strictEqual(cookie.value, 'this is the value');

			cookie = tough.Cookie.parse('c1="this is the value"', false);
			assert.strictEqual(cookie.key, 'c1');
			assert.strictEqual(cookie.value, 'this is the value');
		});
	});

	describe('when calling containsHttpHeader()', function () {
		it('should find text containing with one header line', function () {
			var code = header.containsHttpHeader;
			assert.equal(code('Content-type: '), true);
			assert.equal(code('CONTENT-TYPE: '), true);
			assert.equal(code('content-type: '), true);
			assert.equal(code('Location: '), true);
			assert.equal(code('Status: '), true);
			assert.equal(code('X-DB-Content-length: '), true);
			assert.equal(code('WWW-Authenticate: '), true);
			assert.equal(code(' Location: '), true);
			assert.equal(code(' Location:  '), true);
			assert.equal(code('\nLocation: \n'), true);
		});
		it('should find text containing with multiple header lines', function () {
			var code = header.containsHttpHeader;
			assert.equal(code('Location: Status: '), true);
			assert.equal(code('Location: \nStatus: '), true);
			assert.equal(code('\nContent-type: \nLocation: \nStatus: \n'), true);
		});
		it('should not find text containing without any header lines', function () {
			var code = header.containsHttpHeader;
			assert.equal(code(''), false);
			assert.equal(code(null), false);
			assert.equal(code(undefined), false);
			assert.equal(code('Content-type:'), false);
			assert.equal(code('Content type: '), false);
			assert.equal(code('Location:Status: '), true);
		});
	});

	describe('when calling getHeaderAndBody()', function () {
		it('the header and the body should be split', function () {
			var testData = [{
				text: 'Content-type: text/html\n\n<html>',
				header: 'Content-type: text/html\n\n',
				body: '<html>'
			},
			{
				text: 'Content-type: text/html',
				header: 'Content-type: text/html',
				body: ''
			},
			{
				text: '<html>',
				header: '',
				body: '<html>'
			},
			{
				text: '',
				header: '',
				body: ''
			}];

			for (var i = 0; i < testData.length; i++) {
				var result = header.getHeaderAndBody(testData[i].text);
				assert.equal(result.header, testData[i].header);
				assert.equal(result.body, testData[i].body);
			}
		});
	});

	describe('when calling parseHeader()', function () {
		it('the header text should return the following object', function () {
			var testHeaders = [{
				text: '',
				header: {},
				other: {},
				cookie: []
			},
			{
				text: '\n\n',
				header: {},
				other: {},
				cookie: []
			},
			{
				text: 'Location: index.html\nContent-type: text/html',
				header: {
					'contentType': 'text/html',
					'redirectLocation': 'index.html'
				},
				other: {},
				cookie: []
			},
			{
				text: '\nContent-type: text/html\n',
				header: {
					'contentType': 'text/html'
				},
				other: {},
				cookie: []
			},
			{
				text: 'Status: 400 error status\nContent-type: text/html\nX-DB-Content-length: 4711',
				header: {
					'statusCode': 400,
					'statusDescription': 'error status',
					'contentType': 'text/html',
					'contentLength': 4711
				},
				other: {},
				cookie: []
			},
			{
				text: 'Set-Cookie: c1=v1\nSet-Cookie: c2=another value',
				header: {},
				other: {},
				cookie: [{
					'key': 'c1',
					'value': 'v1'
				},
				{
					'key': 'c2',
					'value': 'another value'
				}]
			},
			{
				text: 'Status: 400 error status\nContent-type: text/html\nX-DB-Content-length: 4711\nSet-Cookie: c1=v1\nSet-Cookie: c2=another value\nsome attribute: some value',
				header: {
					'statusCode': 400,
					'statusDescription': 'error status',
					'contentType': 'text/html',
					'contentLength': 4711,
				},
				other: {
					'some attribute': 'some value'
				},
				cookie: [{
					'key': 'c1',
					'value': 'v1'
				},
				{
					'key': 'c2',
					'value': 'another value'
				}]
			},
			{
				text: '\nSet-Cookie: correctKey=correctValue\nSet-Cookie: illegalKey = illigalValue\nSet-Cookie: key=value\n',
				header: {},
				other: {},
				cookie: [{
					'key': 'correctKey',
					'value': 'correctValue'
				},
				{
					'key': 'key',
					'value': 'value'
				}]
			}];

			var testCookies = function (expectedCookies, resultCookies) {
				var findCookie = function (key) {
					var i = 0;
					for (i = 0; i < resultCookies.length; i++) {
						if (resultCookies[i].key === key) {
							return i;
						}
					}
					return -1;
				};

				var i = 0,
					f = 0,
					k = '';

				for (i = 0; i < expectedCookies.length; i++) {
					for (k in expectedCookies[i]) {
						if (expectedCookies.hasOwnProperty(k)) {
							f = findCookie(k);
							assert.notEqual(f, -1);
							assert.property(resultCookies[f], k);
							assert.propertyVal(resultCookies[f], k, expectedCookies[k]);
						}
					}
				}
			};

			var headerMain = {},
				headerOther = {},
				headerCookies = [],
				i = 0;

			for (i = 0; i < testHeaders.length; i++) {
				headerMain = {};
				headerOther = {};
				headerCookies = [];
				header.parseHeader(testHeaders[i].text, headerMain, headerOther, headerCookies);
				assert.deepEqual(headerMain, testHeaders[i].header);
				assert.deepEqual(headerOther, testHeaders[i].other);
				testCookies(testHeaders[i].cookie, headerCookies);
			}
		});
	});

});