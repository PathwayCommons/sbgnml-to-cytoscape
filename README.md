# sbgnml-to-cytoscape
An npm module that converts xml based Systems Biology Graphical Notation(SBGN) files to [cytoscape.js](https://github.com/Cytoscape/cytoscape.js) graph JSON.

## Requirements
sbgnml-to-cytoscape assumes that it will be run in the browser using one of (Chrome, Safari, FireFox).

sbgnml-to-cytoscape also expects that it will be receiving sbgnml files.  You can see some example sbgnml files [here](https://github.com/PathwayCommons/sbgnml-to-cytoscape/tree/master/test/fixtures/input), and their corresponding output [here](https://github.com/PathwayCommons/sbgnml-to-cytoscape/tree/master/test/fixtures/output).

It would also be helpful to understand the [SBGN language spec](http://sbgn.github.io/sbgn/).

## Installation
Instal with npm:

```sh
npm install sbgnml-to-cytoscape
```

## Usage

```js
let convert = require('sbgnml-to-cytoscape');

fetch('some-sbgnml-file.xml').then( fileString => {
  let cyGraph = convert( fileString );
} );
```

For a holistic view on how to use this module, take a look at the [example](https://github.com/PathwayCommons/sbgnml-to-cytoscape/tree/master/example) folder.

## Tests
Run the tests with:
```sh
npm test
```
