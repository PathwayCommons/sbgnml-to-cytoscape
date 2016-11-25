var convert = require('sbgnml-to-cytoscape');

var getText = function (fname) {
  fetch(fname).then(function (res) {
    console.log('here');
    return res.text();
  }).then(function (data) {
    return data;
  });
};

var toJson = function (obj) {
  return JSON.stringify(obj, null, 4);
};

var xmlText = getText('activated_stat1alpha_induction_of_the_irf1_gene.xml');


var cyGraph = convert(xmlText);
console.log(cyGraph);
