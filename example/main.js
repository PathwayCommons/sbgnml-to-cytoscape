var convert = require('convert-sbgnml');

var loadXML = function (filename) {
  var xhttp;
  if (window.XMLHttpRequest) {
    xhttp = new XMLHttpRequest();
  } else {
    xhttp = new ActiveXObject('Microsoft.XMLHTTP');
  }
  xhttp.open('GET', filename, false);
  xhttp.send();
  return xhttp.responseXML;
};

var toJson = function (obj) {
  return JSON.stringify(obj, null, 4);
};

var xmlDom = loadXML('activated_stat1alpha_induction_of_the_irf1_gene.xml');

var sbgnObj = convert(xmlDom);
