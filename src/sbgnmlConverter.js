const convert = require('xml-js');
const objPath = require('object-path');

const nodesConverter = require('./nodesConverter');
const edgesConverter = require('./edgesConverter');


module.exports = (sbgnmlText) => {

  if (sbgnmlText === null) {
    throw new Error(`'${sbgnmlText} is invalid input.`);
  }

  const converted = convert.xml2js(sbgnmlText, {compact: true, spaces: 2, trim: true, nativeType: true });

  const result = objPath.get(converted, 'sbgn.map', undefined);
  if (result === undefined) {
    return {nodes: [], edges: []};
  }

  const glyphs = [];
  const arcs = [];
  if (result.glyph) {
    glyphs.push(...result.glyph);
  }
  if (result.arc) {
    arcs.push(...result.arc);
  }

  const {nodes: nodes, nodeIdSet: nodeIdSet, portIdMap} = nodesConverter(glyphs);
  const edges = edgesConverter(arcs, nodeIdSet, portIdMap);

  return {nodes: nodes, edges: edges};
};
