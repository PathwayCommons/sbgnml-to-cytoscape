const getCenteredBbox = (glyph) => {
  let {x:x, y:y, w:w, h:h} = glyph.bbox._attributes;

  return {
    x: parseFloat(x) + ( parseFloat(w) / 2 ),
    y: parseFloat(y) + ( parseFloat(h) / 2 ),
    w: parseFloat(w),
    h: parseFloat(h)
  };
};

const getId = (glyph) => glyph._attributes ? glyph._attributes.id : '';

const getClass = (glyph) => glyph._attributes ? glyph._attributes['class'] : '';

const getLabel = (glyph) => glyph.label ? glyph.label._attributes ? glyph.label._attributes.text : '' : '';

const getParent = (glyph) => glyph._attributes ? glyph._attributes.compartmentRef : '';

const getClonemarker = (glyph) => glyph.clone !== undefined;

const getState = (glyph) => {
  const stateVariable = glyph.state._attributes.variable;
  const value = glyph.state._attributes.value;
  return {
    variable: stateVariable ? stateVariable : '',
    value: value ? value : ''
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
      text: glyph.label._attributes.text ? glyph.label._attributes.text : ''
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
  if (glyph.glyph === undefined) {
    return [];
  }
  return [].concat(glyph.glyph);
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

module.exports = (glyphs) => {
  const nodeIdSet = new Set();
  const stack = [];
  const nodes = [];

  stack.push(...glyphs);
  while (stack.length > 0) {
    const currGlyph = stack.pop();
    const currGlyphId = getId(currGlyph);
    const processedGlyph = convertGlyph(currGlyph);

    nodes.push(processedGlyph);
    nodeIdSet.add(currGlyphId);

    const children = getChildren(currGlyph);
    for (let child of children) {
      child.parent = currGlyphId;
    }
    stack.push(...children);
  }

  return {
    nodes: nodes,
    nodeIdSet: nodeIdSet
  };
};
