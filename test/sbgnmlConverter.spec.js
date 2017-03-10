/* global describe, it */
/* jslint browser: true */

var converter = require('../src/sbgnmlConverter');
var assert = require('assert');
var fixtures = require('./fixtures');

describe('sbgnmlConverter', function () {
  it('should process sbgnml files and output the expected fixture file', function () {
    var expected;
    var actual;

    for (var i = 0; i < fixtures.output.length; i++) {
      var text = fixtures.input[i];
      actual = JSON.stringify(converter.convert(text), null, 4);

      expected = JSON.stringify(fixtures.output[i], null, 4);

      assert.deepEqual(expected, actual);
    }
  });
  it('should throw an error when the text to xml conversion function fails', function () {
    var garbageInputs = [null, 'blah', true, false, {'stuff': 'stuff'}, '', {}];

    var c = function (input) {
      converter.convert(input);
    };

    /* eslint-disable */
    for (var i = 0; i < garbageInputs.length; i++) {
      assert.throws(function () { c(garbageInputs[i]) }, Error); // show invalid argument in the error message
    }

    /* eslint-enable */
  });
});
