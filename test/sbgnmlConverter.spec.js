/* global describe, it */
/* jslint browser: true */

var convert = require('../src/sbgnmlConverter');
var expect = require('chai').expect;
var fixtures = require('./fixtures');

describe('sbgnmlConverter', function () {
  it('should return an object containing a nodes and edges array for these inputs', function () {
    const garbage = ['', false, true];
    garbage.map((g) => {
      expect(convert(g)).to.deep.equal({nodes:[], edges:[]});
    });
  });

  it('should throw an error for invalid inputs', function () {
    const nullTest = function() { convert(null); };
    const undefinedTest = function() { convert(undefined); };
    const objTest = function() { convert({'blah': 'blah'}); };

    expect(nullTest).to.throw(Error);
    expect(undefinedTest).to.throw(TypeError);
    expect(objTest).to.throw(Error);
  });

  it('should remove edges that do not have both a source and target node', function () {

  });

  it('should process sbgnml files and output the expected fixture file', function () {
    for (const [index, fixture] of fixtures.input.entries()) {
      const actual = convert(fixture);
      const expected = fixtures.output[index];

      console.log('testing fixture' + index);

      expect(expected.nodes.length).to.equal(actual.nodes.length);
      expect(expected.edges.length).to.equal(actual.edges.length);
      expect(JSON.stringify(expected, null, 2)).to.deep.equal(JSON.stringify(actual, null, 2));
    }
  });
});
