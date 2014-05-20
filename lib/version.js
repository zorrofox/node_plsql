/* jshint node: true */

/**
* Module dependencies.
*/

var path = require('path');
var fs = require('fs');

/**
* Get the version
*
* @return {String}
* @api public
*/
function get()
{
	'use strict';

	var filePath = path.join(__dirname, '../package.json');
	var version = '';

	try {
		version = JSON.parse(fs.readFileSync(filePath, 'utf8')).version;
	} catch (e) {
		throw new TypeError('Could not parse file: ' + filePath + ' Error: ' + e.message);
	}

	return version;
}

module.exports = {
	get: get
};