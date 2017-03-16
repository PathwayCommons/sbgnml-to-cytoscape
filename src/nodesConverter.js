const objPath = require('object-path');

const validSbgnClass = require('./sbgnTags');

const getCenteredBbox = (glyph) => {
  let {x:x, y:y, w:w, h:h} = objPath.get(glyph, 'bbox._attributes', {x: 0, y: 0, w: 0, h: 0});

  return {
    x: parseFloat(x) + ( parseFloat(w) / 2 ),
    y: parseFloat(y) + ( parseFloat(h) / 2 ),
    w: parseFloat(w),
    h: parseFloat(h)
  };
};

const getId = (glyph) => objPath.get(glyph, '_attributes.id');

const getClass = (glyph) => objPath.get(glyph, '_attributes.class', '');

const getLabel = (glyph) => objPath.get(glyph, 'label._attributes.text', '');

const getParent = (glyph) => objPath.get(glyph, '_attributes.compartmentRef', '');

const getClonemarker = (glyph) => glyph.clone !== undefined;

const getState = (glyph) => {
  return {
    variable: objPath.get(glyph, 'state._attributes.variable', ''),
    value: objPath.get(glyph, 'state._attributes.value', '')
  };
};

const getStateVar = (glyph) => {
  return {
    id: getId(glyph),
    'class': getClass(glyph),
    state: getState(glyph)
  };
};

const getUnitOfInformation = (glyph) => {
  return {
    id: getId(glyph),
    'class': getClass(glyph),
    label: {
      text: objPath.get(glyph, 'label._attributes.text', '')
    }
  };
};

const getStateVars = (glyph) => {
  return getChildrenArray(glyph)
    .filter((child) =>  getClass(child) === 'state variable')
    .map((stateVar) => getStateVar(stateVar));
};

const getUnitsOfInformation = (glyph) => {
  return getChildrenArray(glyph)
    .filter((child) =>  getClass(child) === 'unit of information')
    .map((g) => getUnitOfInformation(g));
};

const getChildren = (glyph) => {
  return getChildrenArray(glyph).filter((child) => {
    return getClass(child) !== 'unit of information' && getClass(child) !== 'state variable';
  });
};

const getChildrenArray = (glyph) => {
  return [].concat(objPath.get(glyph, 'glyph', []));
};

const convertGlyph = (glyph, parent='') => {
  return {
    data: {
      id: getId(glyph),
      'class': getClass(glyph),
      label: getLabel(glyph),
      parent: glyph.parent || getParent(glyph) || parent,  // immediate parent takes precendence over compartments
      clonemarker: getClonemarker(glyph),
      stateVariables: getStateVars(glyph),
      unitsOfInformation: getUnitsOfInformation(glyph),
      bbox: getCenteredBbox(glyph)
    }
  };
};
const getPorts = (glyph) => {
  return [].concat(objPath.get(glyph, 'port', [])).map((port) => {
    return {
      id: getId(port),
      bbox: getCenteredBbox(port)
    };
  });
};

module.exports = (glyphs) => {
  const nodeIdSet = new Set();
  const portIdMap = new Map();
  const stack = [];
  const nodes = [];

  stack.push(...glyphs);
  while (stack.length > 0) {
    const currGlyph = stack.pop();
    const currGlyphId = getId(currGlyph);
    const processedGlyph = convertGlyph(currGlyph);

    if (validSbgnClass(processedGlyph.data['class'])) {
      nodes.push(processedGlyph);
      nodeIdSet.add(currGlyphId);

      for (const port of getPorts(currGlyph)) {
        portIdMap.set(port.id, currGlyphId);
      }

      const children = getChildren(currGlyph);
      for (let child of children) {
        child.parent = currGlyphId;
      }

      stack.push(...children);
    }
  }

  return {
    nodes: nodes,
    nodeIdSet: nodeIdSet,
    portIdMap: portIdMap
  };
};
