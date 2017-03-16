const objPath = require('object-path');

const getId = (arc) => objPath.get(arc, '_attributes.id');

const getClass = (arc) => objPath.get(arc, '_attributes.class', '');

const getSource = (arc) => objPath.get(arc, '_attributes.source', '');

const getTarget = (arc) => objPath.get(arc, '_attributes.target', '');


const getCardinality = (glyph) => parseInt(objPath.get(glyph, 'label._attributes.text', ''));

const convertArc = (arc) => {
  return {
    data: {
      id: getId(arc),
      'class': getClass(arc),
      cardinality: arc.glyph ? getCardinality(arc.glyph): 0,
      source: getSource(arc),
      target: getTarget(arc)
    }
  };
};

const validEdge = (arc, nodeIdSet, portIdMap) => {
  const srcNodeId = getSource(arc);
  const tgtNodeId = getTarget(arc);

  return (nodeIdSet.has(srcNodeId) || nodeIdSet.has(portIdMap.get(srcNodeId)))
  && (nodeIdSet.has(tgtNodeId) || nodeIdSet.has(portIdMap.get(tgtNodeId)));
};


const validEdges = (arcs, nodeIdSet, portIdMap) => arcs.filter((arc) => validEdge(arc, nodeIdSet, portIdMap));

const convertEdges = (arcs, nodeIdSet, portIdMap) => validEdges(arcs, nodeIdSet, portIdMap).map(arc => convertArc(arc));

module.exports = convertEdges;
