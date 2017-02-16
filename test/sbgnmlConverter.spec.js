/* global describe, it, ActiveXObject */
/* jslint browser: true */

var converter = require('../src/sbgnmlConverter.js');
var assert = require('assert');

var fixtureFiles = [
  './fixtures/input/atm_mediated_phosphorylation_of_repair_proteins.xml',
  './fixtures/input/activated_stat1alpha_induction_of_the_irf1_gene.xml',
  './fixtures/input/CaM-CaMK_dependent_signaling_to_the_nucleus.xml',
  './fixtures/input/glycolysis.xml',
  './fixtures/input/insulin-like_growth_factor_signaling.xml',
  './fixtures/input/mapk_cascade.xml',
  './fixtures/input/neuronal_muscle_signalling.xml',
  './fixtures/input/polyq_proteins_interference.xml',
  './fixtures/input/vitamins_b6_activation_to_pyridoxal_phosphate.xml',


  './fixtures/input/small.xml'
];

var outputFiles = [
  require('./fixtures/output/atm_mediated_phosphorylation_of_repair_proteins.json'),
  require('./fixtures/output/activated_stat1alpha_induction_of_the_irf1_gene.json'),
  require('./fixtures/output/CaM-CaMK_dependent_signaling_to_the_nucleus.json'),
  require('./fixtures/output/glycolysis.json'),
  require('./fixtures/output/insulin-like_growth_factor_signaling.json'),
  require('./fixtures/output/mapk_cascade.json'),
  require('./fixtures/output/neuronal_muscle_signalling.json'),
  require('./fixtures/output/polyq_proteins_interference.json'),
  require('./fixtures/output/vitamins_b6_activation_to_pyridoxal_phosphate.json'),


  require('./fixtures/output/small.json')
];

var getFileText = function (filename) {
  var xhttp;
  if (window.XMLHttpRequest) {
    xhttp = new XMLHttpRequest();
  } else {
    xhttp = new ActiveXObject('Microsoft.XMLHTTP');
  }
  xhttp.open('GET', filename, false);
  xhttp.send();
  return xhttp.responseText;
};

describe('sbgnmlConverter', function () {
  it('should process sbgnml files and output the expected fixture file', function () {
    var expected;
    var actual;

    for (var i = 0; i < outputFiles.length; i++) {
      var text = getFileText(fixtureFiles[i]);
      actual = JSON.stringify(converter.convert(text), null, 4);


      expected = JSON.stringify(outputFiles[i], null, 4);

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
