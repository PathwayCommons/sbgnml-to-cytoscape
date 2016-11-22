# convert-sbgnml
An npm module that converts xml based Systems Biology Graphical Notation(SBGN) files to javascript objects.

## Requirements
convert-sbgnml needs an xmlobject that implements common
web APIs such as ```document.querySelector``` and ```element.getAttribute```.

convert-sbgnml also expects that it will be receiving sbgnml files.  You can see some example sbgnml files [here](https://github.com/PathwayCommons/convert-sbgnml/tree/master/test/fixtures/input), and their corresponding output [here](https://github.com/PathwayCommons/convert-sbgnml/tree/master/test/fixtures/output).

It would also be helpful to understand the [SBGN language spec](http://sbgn.github.io/sbgn/).

## Installation
Instal with npm:

```sh
npm install PathwayCommons/convert-sbgnml
```

## Usage

```js
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

var xmlDom = loadXML('sbgnml-file.xml');

convert(xmlDom);
```

## Tests
Run the tests with:
```sh
npm test
```
