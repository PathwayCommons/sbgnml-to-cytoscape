/* global describe, it */
/* jslint browser: true */

var convert = require('../src/sbgnmlConverter');
var expect = require('chai').expect;
var fixtures = require('./fixtures');

describe('sbgnmlConverter', function () {
    it('should convert a node from sbgnml to a cytoscape.js compatible JSON', function () {
    // const i0 = makeSbgnml(
  //   `
  //   <glyph id="glyph8" class="source and sink">
  //     <bbox y="571.1691314755299" x="352.15049199906457" w="60.0" h="60.0" />
  //   </glyph>
  //   <glyph id="glyph8" class="source and sink">
  //     <bbox y="571.1691314755299" x="352.15049199906457" w="60.0" h="60.0" />
  //   </glyph>`
  //   );
   //
  //   const i1 = makeSbgnml(
  //  `<glyph id="glyph8" class="source and sink">
  //     <bbox y="571.1691314755299" x="352.15049199906457" w="60.0" h="60.0" />
  //   </glyph>
  //   <glyph id="glyph8" class="source and sink">
  //      <bbox y="571.1691314755299" x="352.15049199906457" w="60.0" h="60.0" />
  //   </glyph>`
  //   );
   //
  //   const i2 = makeSbgnml(
  //  `<glyph id="glyph8" class="source and sink">
  //     <bbox y="571.1691314755299" x="352.15049199906457" w="60.0" h="60.0" />
  //   </glyph>
  //   `
  //   );
  //   const i3 = makeSbgnml('');
  //   const output = {
  //     nodes: [
  //       {
  //           "data": {
  //               "sbgn": {
  //                   "id": "glyph8",
  //                   "bbox": {
  //                       "x": 382.15049199906457,
  //                       "y": 601.1691314755299,
  //                       "w": "60.0",
  //                       "h": "60.0"
  //                   },
  //                   "class": "source and sink",
  //                   "unitsOfInformation": [],
  //                   "stateVariables": [],
  //                   "parent": "",
  //                   "ports": []
  //               }
  //           }
  //       }
  //     ],
  //     edges: []
  //   };
  //   nconvert(i0);
    // convert(i1);
    // convert(i2);
    // convert(i3);
    // convert(i4);

    // expect(convert(input)).to.equal(output);

  });

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
