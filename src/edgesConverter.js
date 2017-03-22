const objPath = require('object-path');

const getId = (arc) => objPath.get(arc, '_attributes.id');

const getClass = (arc) => objPath.get(arc, '_attributes.class', '');

const getSource = (arc, nodeIdSet, portIdMap) => {
  const portSource = getPortSource(arc);
  return nodeIdSet.has(portSource) ? portSource : portIdMap.get(portSource);
};

const getTarget = (arc, nodeIdSet, portIdMap) => {
  const portTarget = getPortTarget(arc);
  return nodeIdSet.has(portTarget) ? portTarget : portIdMap.get(portTarget);
};

const getPortSource = (arc) => objPath.get(arc, '_attributes.source', '');

const getPortTarget = (arc) => objPath.get(arc, '_attributes.target', '');

const getCardinality = (glyph) => parseInt(objPath.get(glyph, 'label._attributes.text', ''));

const getBendPointPositions = (arc) => {
  return [].concat(objPath.get(arc, 'next', []))
  .map((bendPoint) => {
    return {
      x: parseInt(bendPoint.x),
      y: parseInt(bendPoint.y)
    };
  });
};


const convertArc = (arc, nodeIdSet, portIdMap) => {
  return {
    data: {
      id: getId(arc),
      'class': getClass(arc),
      cardinality: arc.glyph ? getCardinality(arc.glyph): 0,
      source: getSource(arc, nodeIdSet, portIdMap),
      target: getTarget(arc, nodeIdSet, portIdMap),
      bendPointPositions: getBendPointPositions(arc),
      portSource: getPortSource(arc),
      portTarget: getPortTarget(arc)
    }
  };
};

const validArc = (arc, nodeIdSet, portIdMap) => {
  const srcNodeId = getSource(arc, nodeIdSet, portIdMap);
  const tgtNodeId = getTarget(arc, nodeIdSet, portIdMap);

  return (nodeIdSet.has(srcNodeId)) && (nodeIdSet.has(tgtNodeId));
};

const convertEdges = (arcs, nodeIdSet, portIdMap) => {
  return arcs
  .filter((arc) => validArc(arc, nodeIdSet, portIdMap))
  .map((arc) => convertArc(arc, nodeIdSet, portIdMap));
};
module.exports = convertEdges;
