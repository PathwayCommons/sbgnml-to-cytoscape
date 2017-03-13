const getCenteredBbox = (glyph) => {
  let {x:x, y:y, w:w, h:h} = glyph.bbox._attributes;

  return {
    x: parseFloat(x) + ( parseFloat(w) / 2 ),
    y: parseFloat(y) + ( parseFloat(h) / 2 ),
    w: parseFloat(w),
    h: parseFloat(h)
  };
};


const getId = (glyph) => {
  return glyph._attributes.id;
};

const getClass = (glyph) => {
  return glyph._attributes['class'];
};

const getLabel = (glyph) => {
  return glyph.label._attributes.text;
};

const getParent = (glyph) => {
  return glyph._attributes.compartmentRef;
};

const getClonemarker = (glyph) => {
  return glyph.clone != null;
};

const getState = (glyph) => {
  const variable = glyph.state._attributes.variable;
  const value = glyph.state._attributes.value;
  return {
    variable: variable ? variable : '',
    value: value ? value : ''
  };
};

const getSvar = (glyph) => {
  return {
    id: getId(glyph),
    'class': getClass(glyph),
    state: getState(glyph)
  };
};

const getSVars = (glyph) => {
  let sVars = [];
  if (glyph.glyph != null) {

    sVars = sVars.concat(glyph.glyph)
    .filter((g) =>  g._attributes['class'] == 'state variable')
    .map((g) => getSvar(g));
  }

  return sVars;
};

const getUinfo = (glyph) => {
  return {
    id: getId(glyph),
    'class': getClass(glyph),
    label: {
      text: glyph.label._attributes.text
    }
  };
};

const getUInfos = (glyph) => {
  let uInfos = [];
  if (glyph.glyph != null) {
    uInfos = uInfos.concat(glyph.glyph)
    .filter((g) =>  g._attributes['class'] == 'unit of information')
    .map((g) => getUinfo(g));
  }
  return uInfos;
};

const convertGlyph = (g, parent='') => {
  return {
    data: {
      // original: g,
      id: getId(g),
      'class': getClass(g),
      label: getLabel(g),
      parent: getParent(g) || parent,
      clonemarker: getClonemarker(g),
      stateVariables: getSVars(g),
      unitsOfInformation: getUInfos(g),
      bbox: getCenteredBbox(g)
    }
  };
};

module.exports = (glyphs) => {
  const nodeIdMap = new Set();
  const stack = [];
  const nodes = [];

  stack.push(...glyphs);
  while (stack.length > 0) {
    // get curr glyph
    // process glyph
    // for each of the glyphs children add a parent field with the id of the curr glyph
    // push children onto stack

    const children = [];

    const currGlyph = stack.pop();
    console.log(currGlyph);
    const currGlyphId = getId(currGlyph);
    const processedGlyph = convertGlyph(currGlyph);
    nodes.push(processedGlyph);

    nodeIdMap.add(currGlyphId);
    if (currGlyph.glyph) {
      children.push([].concat(currGlyph.glyph).filter((child) => {
        const childClass = getClass(child);
        return childClass !== 'unit of information' || childClass !== 'state variable';
      }));
    }
    for (let child of children) {
      child.parent = currGlyphId;
    }
    stack.push(...children);
  }

  return {
    nodes: nodes,
    nodeIdMap: nodeIdMap
  };
};
