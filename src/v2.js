/* jslint browser: true */
/* global ActiveXObject: false */

const convert = require('xml-js');

module.exports = (sbgnmlText) => convert.xml2json(sbgnmlText, {compact: false, spaces: 4});



const validSbgnClass = require('./sbgnTags.js');


const findChildNodes = (ele, tag) => {
  // find child nodes at depth level of 1 relative to the element
  return ele.childNodes.filter(child => child.nodeType === 1 && child.tagName === tag);
};

const findChildNode = (ele, tag)  => {
  const childNodes = findChildNodes(ele, tag);
  return childNodes.length > 0 ? childNodes[0] : undefined;
};

const parsedBBox = (element) => {
  const bb = findChildNode(element, 'bbox');
  const parsedBB = {};
  if (bb != null) {
    parsedBB.x = parseFloat(bb.getAttribute('x'));
    parsedBB.y = parseFloat(bb.getAttribute('y'));
    parsedBB.w = parseFloat(bb.getAttribute('w'));
    parsedBB.h = parseFloat(bb.getAttribute('h'));
  }
  return parsedBB;
};

const inBBox = (bb1, bb2) => {
  return bb1.x > bb2.x &&
         bb1.y > bb2.y &&
         bb1.x + bb1.w < bb2.x + bb2.w &&
         bb1.y + bb1.h < bb2.y + bb2.h;
};

var sbgnmlConverter = {
  loadXMLFromString (text) {
    var doc;
    if (window.ActiveXObject) {
      doc = new ActiveXObject('Microsoft.XMLDOM');
      doc.async = 'false';
      doc.loadXML(text);
    } else {
      var parser = new DOMParser();
      doc = parser.parseFromString(text, 'text/xml');
    }

    var parseError = doc.getElementsByTagName('parsererror');
    if (parseError.length > 0) {
      throw new Error('Could not convert the following text to xml: ' + JSON.stringify(text));
    }

    return doc;
  },

  compartmentBBoxes (xmlObject) {

    const compartmentEls = xmlObject.querySelectorAll('glyph[class="compartment"]');

    return compartmentEls.map(compartment => {
      const {x, y, w, h} = parsedBBox(compartment);
      return {
        x: x,
        y: y,
        w: w,
        h: h,
        id: compartment.getAttribute('id')
      };
    })
    .sort((c1, c2) => {
      if (c1.h * c1.w < c2.h * c2.w) {
        return -1;
      }
      if (c1.h * c1.w > c2.h * c2.w) {
        return 1;
      }
      return 0;
    });
  },

  bboxProp (ele) {
    let bbox = parsedBBox(ele);

    bbox.x = (bbox.x +  bbox.w) / 2;
    bbox.y = (bbox.y + bbox.h) / 2;

    return bbox;
  },

  auxItemBBox (ele, parentBbox) {
    const {parentX, parentY, parentW, parentH} = parentBbox;

    let bbox = parsedBBox(ele);

    // set positions as center
    bbox.x = (bbox.x + bbox.w) / 2 - parentX;
    bbox.y = (bbox.y + bbox.h) / 2 - parentY;

    bbox.x = bbox.x / parentW * 100;
    bbox.y = bbox.y / parentH * 100;

    return bbox;
  },

  stateAndInfoProp (ele, parentBBox) {
    var self = this;

    const childGlyphs = findChildNodes(ele, 'glyph');

    const stateVars = childGlyphs.filter(child => child.className === 'state variable');
    const unitInfos = childGlyphs.filter(child => child.className === 'unit of information');

    const stateVariables = stateVars.map(stateVar => {
      const state = findChildNode(stateVar, 'state');
      return {
        id: stateVar.getAttribute('id') || '',
        class: stateVar.className || '',
        state: {
          value: (state && state.getAttribute('value')) || '',
          variable: (state && state.getAttribute('variable')) || ''
        },
        bbox: self.auxItemBBox(stateVar, parentBBox)
      };
    });

    const unitsOfInformation = unitInfos.map(uinfo => {
      const label = findChildNode(uinfo, 'label');
      return {
        id: uinfo.getAttribute('id') || '',
        class: uinfo.className || '',
        label: {
          text: (label && label.getAttribute('text')) || ''
        },
        bbox: self.auxItemBBox(uinfo, parentBBox)
      };
    });

    return {'unitsOfInformation': unitsOfInformation, 'stateVariables': stateVariables};
  },

  addParentInfoToNode (ele, nodeObj, parent, compartments) {
    var self = this;
    var compartmentRef = ele.getAttribute('compartmentRef');

    if (parent) {
      nodeObj.parent = parent;
      return;
    }

    if (compartmentRef) {
      nodeObj.parent = compartmentRef;
    } else {
      nodeObj.parent = '';

      // add compartment according to geometry
      for (var i = 0; i < compartments.length; i++) {
        var bboxEl = self.findChildNode(ele, 'bbox');
        var bbox = {
          'x': parseFloat(bboxEl.getAttribute('x')),
          'y': parseFloat(bboxEl.getAttribute('y')),
          'w': parseFloat(bboxEl.getAttribute('w')),
          'h': parseFloat(bboxEl.getAttribute('h')),
          'id': ele.getAttribute('id')
        };
        if (inBBox(bbox, compartments[i])) {
          nodeObj.parent = compartments[i].id;
          break;
        }
      }
    }
  },
  glyph2JSON (glyph) {
    var self = this;
    var node = {};

    node.id = glyph.getAttribute('id');
    node.bbox = self.bboxProp(glyph);
    node.class = glyph.className;

    var label = self.findChildNode(glyph, 'label');
    node.label = (label && label.getAttribute('text')) || undefined;

    const { unitsOfInformation, stateVariables } = self.stateAndInfoProp(glyph, node.bbox);
    node.unitsOfInformation = unitsOfInformation;
    node.stateVariables = stateVariables;

    self.addParentInfoToNode(glyph, node, parent);

    node.clonemarker = self.findChildNode(glyph, 'clone') != undefined;

    // add port information
    const portElements = glyph.querySelectorAll('port');
    const ports = portElements.map(port => {
      const id = port.getAttribute('id');
      let relativeXPos = parseFloat(port.getAttribute('x')) - node.bbox.x;
      let relativeYPos = parseFloat(port.getAttribute('y')) - node.bbox.y;

      relativeXPos = relativeXPos / parseFloat(node.bbox.w) * 100;
      relativeYPos = relativeYPos / parseFloat(node.bbox.h) * 100;

      return {
        id: id,
        x: relativeXPos,
        y: relativeYPos
      };
    });
    node.ports = ports;

    return { data: { sbgn: node } };
  },
  traverseNodes (node, jsonArray, parent, compartments) {
    var elId = node.getAttribute('id');
    if (!validSbgnClass(node.className)) {
      return;
    }
    var self = this;


    var nodeClass = node.className;

    if (nodeClass === 'complex' || nodeClass === 'complex multimer' || nodeClass === 'submap') {
      self.addCytoscapeJsNode(node, jsonArray, parent, compartments);

      var childGlyphs = self.findChildNodes(node, 'glyph');
      for (var i = 0; i < childGlyphs.length; i++) {
        var glyph = childGlyphs[i];
        var glyphClass = glyph.className;
        if (glyphClass !== 'state variable' && glyphClass !== 'unit of information') {
          self.traverseNodes(glyph, jsonArray, elId, compartments);
        }
      }
    } else {
      self.addCytoscapeJsNode(node, jsonArray, parent, compartments);
    }
  },
  getPorts (xmlObject) {
    return ( xmlObject._cachedPorts = xmlObject._cachedPorts || xmlObject.querySelectorAll('port'));
  },
  getGlyphs (xmlObject) {
    var glyphs = xmlObject._cachedGlyphs;

    if (!glyphs) {
      glyphs = xmlObject._cachedGlyphs = xmlObject._cachedGlyphs || xmlObject.querySelectorAll('glyph');

      var id2glyph = xmlObject._id2glyph = {};

      for ( var i = 0; i < glyphs.length; i++ ) {
        var g = glyphs[i];
        var id = g.getAttribute('id');

        id2glyph[ id ] = g;
      }
    }

    return glyphs;
  },
  getGlyphById (xmlObject, id) {
    this.getGlyphs(xmlObject); // make sure cache is built

    return xmlObject._id2glyph[id];
  },
  endPoints (arc, xmlObject) {
    // source and target can be inside of a port
    var source = arc.getAttribute('source');
    var target = arc.getAttribute('target');
    var sourceNodeId;
    var targetNodeId;

    var sourceExists = this.getGlyphById(xmlObject, source);
    var targetExists = this.getGlyphById(xmlObject, target);

    if (sourceExists) {
      sourceNodeId = source;
    }

    if (targetExists) {
      targetNodeId = target;
    }


    var i;
    var portEls = this.getPorts(xmlObject);
    var port;
    if (sourceNodeId === undefined) {
      for (i = 0; i < portEls.length; i++ ) {
        port = portEls[i];
        if (port.getAttribute('id') === source) {
          sourceNodeId = port.parentElement.getAttribute('id');
        }
      }
    }

    if (targetNodeId === undefined) {
      for (i = 0; i < portEls.length; i++) {
        port = portEls[i];
        if (port.getAttribute('id') === target) {
          targetNodeId = port.parentElement.getAttribute('id');
        }
      }
    }

    return {'source': sourceNodeId, 'target': targetNodeId};
  },

  bendPointPositions (arc) {
    const self = this;
    const bendPoints = self.findChildNodes(arc, 'next');

    return bendPoints.map((bendPoint) => {
      return  {
        x: bendPoint.getAttribute('x'),
        y: bendPoint.getAttribute('y')
      };
    });
  },

  arc2JSON (arc, xmlObject) {
    if (!validSbgnClass(arc.className)) {
      return;
    }

    var self = this;
    var {source, target} = self.endPoints(arc, xmlObject);

    var edge = {};

    edge.id = arc.getAttribute('id') || undefined;
    edge.class = arc.className;
    edge.bendPointPositions = self.bendPointPositions(arc);

    var glyphChildren = self.findChildNodes(arc, 'glyph');
    var glyphDescendents = arc.querySelectorAll('glyph');
    if (glyphDescendents.length <= 0) {
      edge.cardinality = 0;
    } else {
      for (var i = 0; i < glyphChildren.length; i++) {
        if (glyphChildren[i].className === 'cardinality') {
          var label = glyphChildren[i].querySelector('label');
          edge.cardinality = label.getAttribute('text') || undefined;
        }
      }
    }

    edge.source = source;
    edge.target = target;

    edge.portsource = arc.getAttribute('source');
    edge.porttarget = arc.getAttribute('target');

    return { sbgn: { data: edge } };
  },
  convert (sbgnmlText) {
    var self = this;

    var xmlObject = self.loadXMLFromString(sbgnmlText);

    var glyphs = self.findChildNodes(xmlObject.querySelector('map'), 'glyph');
    var arcs = self.findChildNodes(xmlObject.querySelector('map'), 'arc');

    return {
      nodes: glyphs.map(glyph => self.glyph2JSON(glyph)),
      edges: arcs.map(arc => self.arc2JSON(arc))
    };
  }
};

module.exports = sbgnmlConverter;
