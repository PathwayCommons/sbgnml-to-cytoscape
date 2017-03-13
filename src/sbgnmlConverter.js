const convert = require('xml-js');

const nodesConverter = require('./nodesConverter');
const edgesConverter = require('./edgesConverter');


module.exports = (sbgnmlText) => {

  const converted = convert.xml2js(sbgnmlText, {compact: true, spaces: 2, trim: true, nativeType: true });
  const result = converted.sbgn.map;

  const glyphs = [];
  const arcs = [];
  if (result.glyph) {
    glyphs.push(...result.glyph);
  }
  if (result.arc) {
    arcs.push(...result.arc);
  }


  const {nodes: nodes, nodeIdSet: nodeIdSet} = nodesConverter(glyphs);
  const edges = edgesConverter(arcs, nodeIdSet);

  console.log(nodes);
  console.log(edges);

  return {nodes: nodes, edges: edges};
};
