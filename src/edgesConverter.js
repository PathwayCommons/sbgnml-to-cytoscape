const objPath = require('object-path');

const getId = (arc) => objPath.get(arc, '_attributes.id');

const getClass = (arc) => objPath.get(arc, '_attributes.class', '');

const getSource = (arc) => {
  const source = objPath.get(arc, '_attributes.source', '');
  return source.replace('InputPort_', '').replace('OutputPort_', '');
};
const getTarget = (arc) => {
  const target = objPath.get(arc, '_attributes.target', '');
  return target.replace('InputPort_', '').replace('OutputPort_', '');
};

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

const validEdge = (arc, nodeIdSet) => nodeIdSet.has(getSource(arc)) && nodeIdSet.has(getTarget(arc));

const validEdges = (arcs, nodeIdSet) => arcs.filter((arc) => validEdge(arc, nodeIdSet));

const convertEdges = (arcs, nodeIdSet) => validEdges(arcs, nodeIdSet).map(arc => convertArc(arc));

module.exports = convertEdges;
