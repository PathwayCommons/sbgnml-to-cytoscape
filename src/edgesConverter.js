const getId = (arc) => arc._attributes ? arc._attributes.id : undefined;

const getClass = (arc) => arc._attributes ? arc._attributes.class : '';

const getSource = (arc) => arc._attributes ? arc._attributes.source : '';

const getTarget = (arc) => arc._attributes ? arc._attributes.target : '';

const getCardinality = (glyph) => parseInt(glyph.label._attributes.text);

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
