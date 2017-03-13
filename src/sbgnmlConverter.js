const convert = require('xml-js');

const nodesConverter = require('./nodesConverter');
const edgesConverter = require('./edgesConverter');


module.exports = (sbgnmlText) => {

  const converted = convert.xml2js(sbgnmlText, {compact: true, spaces: 4, trim: true, nativeType: true });
  const result = converted.sbgn.map;

  const glyphs = result.glyph ? result.glyph : [];
  const arcs = result.arc ? result.arc : [];

  const {nodes: nodes, nodeIdMap: nodeIdMap} = nodesConverter([].concat(glyphs));
  const edges = edgesConverter(arcs, nodeIdMap);

  console.log(nodes);
  console.log(edges);

  return {nodes: nodes, edges: edges};
};
