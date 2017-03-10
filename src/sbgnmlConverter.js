const convert = require('xml-js');

module.exports = (sbgnmlText) => convert.xml2json(sbgnmlText, {compact: false, spaces: 4});
