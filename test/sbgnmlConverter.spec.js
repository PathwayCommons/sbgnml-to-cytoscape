/* global describe, it */
/* jslint browser: true */

var convert = require('../src/sbgnmlConverter');
var expect = require('chai').expect;
var fixtures = require('./fixtures');

describe('sbgnmlConverter', function () {
  // it('should return an object containing a nodes and edges array', function () {
  //
  // });
  //
  // it('should throw an error for invalid inputs', function () {
  //
  // });
  //
  //
  // it('should process sbgnml files and output the expected fixture file', function () {
  //   var expected;
  //   var actual;
  //
  //   for (var i = 0; i < fixtures.output.length; i++) {
  //     var text = fixtures.input[i];
  //
  //     actual = convert(text);
  //
  //     expected = JSON.stringify(fixtures.output[i], null, 4);
  //
  //     expect(expected).to.equal(actual);
  //   }
  // });
  // it('should throw an error when the text to xml conversion function fails', function () {
  //   var garbageInputs = [null, 'blah', true, false, {'stuff': 'stuff'}, '', {}];
  //
  //   var c = function (input) {
  //     convert(input);
  //   };
  //
  //   /* eslint-disable */
  //   for (var i = 0; i < garbageInputs.length; i++) {
  //     assert.throws(function () { c(garbageInputs[i]) }, Error); // show invalid argument in the error message
  //   }
  //
  //   /* eslint-enable */
  // });
});
