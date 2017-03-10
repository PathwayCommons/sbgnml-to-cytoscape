var converter = require('./sbgnmlConverter');


module.exports = (text) => {
  return converter.convert(text);
};
