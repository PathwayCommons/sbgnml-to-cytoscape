var converter = require('./sbgnmlConverter');

module.exports = function (text) {
  return converter.convert(text);
};
