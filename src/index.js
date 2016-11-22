var converter = require('./sbgnmlConverter');

module.exports = function (xmlObject) {
  return converter.convert(xmlObject);
};
