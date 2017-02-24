(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.sbgnmlToCytoscape = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var converter = _dereq_('./sbgnmlConverter');

module.exports = function (text) {
  return converter.convert(text);
};

},{"./sbgnmlConverter":2}],2:[function(_dereq_,module,exports){
'use strict';

/* jslint browser: true */
/* global ActiveXObject: false */

var sbgnmlConverter = {
  loadXMLFromString: function loadXMLFromString(text) {
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
  sbgnmlTags: {
    'unspecified entity': true,
    'simple chemical': true,
    'macromolecule': true,
    'nucleic acid feature': true,
    'perturbing agent': true,
    'source and sink': true,
    'complex': true,
    'process': true,
    'omitted process': true,
    'uncertain process': true,
    'association': true,
    'dissociation': true,
    'phenotype': true,
    'tag': true,
    'consumption': true,
    'production': true,
    'modulation': true,
    'stimulation': true,
    'catalysis': true,
    'inhibition': true,
    'necessary stimulation': true,
    'logic arc': true,
    'equivalence arc': true,
    'and operator': true,
    'or operator': true,
    'not operator': true,
    'and': true,
    'or': true,
    'not': true,
    'nucleic acid feature multimer': true,
    'macromolecule multimer': true,
    'simple chemical multimer': true,
    'complex multimer': true,
    'compartment': true
  },
  insertedNodes: {},
  getAllCompartments: function getAllCompartments(xmlObject) {
    var compartments = [];

    var compartmentEls = xmlObject.querySelectorAll("glyph[class='compartment']");

    for (var i = 0; i < compartmentEls.length; i++) {
      var compartment = compartmentEls[i];
      var bbox = this.findChildNode(compartment, 'bbox');
      compartments.push({
        'x': parseFloat(bbox.getAttribute('x')),
        'y': parseFloat(bbox.getAttribute('y')),
        'w': parseFloat(bbox.getAttribute('w')),
        'h': parseFloat(bbox.getAttribute('h')),
        'id': compartment.getAttribute('id')
      });
    }

    compartments.sort(function (c1, c2) {
      if (c1.h * c1.w < c2.h * c2.w) {
        return -1;
      }
      if (c1.h * c1.w > c2.h * c2.w) {
        return 1;
      }
      return 0;
    });

    return compartments;
  },
  isInBoundingBox: function isInBoundingBox(bbox1, bbox2) {
    if (bbox1.x > bbox2.x && bbox1.y > bbox2.y && bbox1.x + bbox1.w < bbox2.x + bbox2.w && bbox1.y + bbox1.h < bbox2.y + bbox2.h) {
      return true;
    }
    return false;
  },
  bboxProp: function bboxProp(ele) {
    var bbox = {};
    var bboxEl = ele.querySelector('bbox');

    bbox.x = bboxEl.getAttribute('x');
    bbox.y = bboxEl.getAttribute('y');
    bbox.w = bboxEl.getAttribute('w');
    bbox.h = bboxEl.getAttribute('h');
    // set positions as center
    bbox.x = parseFloat(bbox.x) + parseFloat(bbox.w) / 2;
    bbox.y = parseFloat(bbox.y) + parseFloat(bbox.h) / 2;

    return bbox;
  },
  stateAndInfoBboxProp: function stateAndInfoBboxProp(ele, parentBbox) {
    var xPos = parseFloat(parentBbox.x);
    var yPos = parseFloat(parentBbox.y);

    var bbox = {};
    var bboxEl = ele.querySelector('bbox');

    bbox.x = bboxEl.getAttribute('x');
    bbox.y = bboxEl.getAttribute('y');
    bbox.w = bboxEl.getAttribute('w');
    bbox.h = bboxEl.getAttribute('h');

    // set positions as center
    bbox.x = parseFloat(bbox.x) + parseFloat(bbox.w) / 2 - xPos;
    bbox.y = parseFloat(bbox.y) + parseFloat(bbox.h) / 2 - yPos;

    bbox.x = bbox.x / parseFloat(parentBbox.w) * 100;
    bbox.y = bbox.y / parseFloat(parentBbox.h) * 100;

    return bbox;
  },
  findChildNodes: function findChildNodes(ele, childTagName) {
    // find child nodes at depth level of 1 relative to the element
    var children = [];
    for (var i = 0; i < ele.childNodes.length; i++) {
      var child = ele.childNodes[i];
      if (child.nodeType === 1 && child.tagName === childTagName) {
        children.push(child);
      }
    }
    return children;
  },
  findChildNode: function findChildNode(ele, childTagName) {
    var nodes = this.findChildNodes(ele, childTagName);
    return nodes.length > 0 ? nodes[0] : undefined;
  },
  stateAndInfoProp: function stateAndInfoProp(ele, parentBbox) {
    var self = this;
    var stateVariables = [];
    var unitsOfInformation = [];

    var childGlyphs = this.findChildNodes(ele, 'glyph');

    for (var i = 0; i < childGlyphs.length; i++) {
      var glyph = childGlyphs[i];
      var info = {};

      if (glyph.className === 'unit of information') {
        info.id = glyph.getAttribute('id') || undefined;
        info.clazz = glyph.className || undefined;
        var label = glyph.querySelector('label');
        info.label = {
          'text': label && label.getAttribute('text') || undefined
        };
        info.bbox = self.stateAndInfoBboxProp(glyph, parentBbox);
        unitsOfInformation.push(info);
      } else if (glyph.className === 'state variable') {
        info.id = glyph.getAttribute('id') || undefined;
        info.clazz = glyph.className || undefined;
        var state = glyph.querySelector('state');
        var value = state && state.getAttribute('value') || undefined;
        var variable = state && state.getAttribute('variable') || undefined;
        info.state = {
          'value': value,
          'variable': variable
        };
        info.bbox = self.stateAndInfoBboxProp(glyph, parentBbox);
        stateVariables.push(info);
      }
    }

    return { 'unitsOfInformation': unitsOfInformation, 'stateVariables': stateVariables };
  },
  addParentInfoToNode: function addParentInfoToNode(ele, nodeObj, parent, compartments) {
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
        if (self.isInBoundingBox(bbox, compartments[i])) {
          nodeObj.parent = compartments[i].id;
          break;
        }
      }
    }
  },
  addCytoscapeJsNode: function addCytoscapeJsNode(ele, jsonArray, parent, compartments) {
    var self = this;
    var nodeObj = {};

    // add id information
    nodeObj.id = ele.getAttribute('id');
    // add node bounding box information
    nodeObj.bbox = self.bboxProp(ele);
    // add class information
    nodeObj.class = ele.className;
    // add label information
    var label = self.findChildNode(ele, 'label');
    nodeObj.label = label && label.getAttribute('text') || undefined;
    // add state and info box information
    nodeObj.unitsOfInformation = self.stateAndInfoProp(ele, nodeObj.bbox).unitsOfInformation;
    nodeObj.stateVariables = self.stateAndInfoProp(ele, nodeObj.bbox).stateVariables;
    // adding parent information
    self.addParentInfoToNode(ele, nodeObj, parent, compartments);

    // add clone information
    var cloneMarkers = self.findChildNodes(ele, 'clone');
    if (cloneMarkers.length > 0) {
      nodeObj.clonemarker = true;
    } else {
      nodeObj.clonemarker = undefined;
    }

    // add port information
    var ports = [];
    var portElements = ele.querySelectorAll('port');

    for (var i = 0; i < portElements.length; i++) {
      var portEl = portElements[i];
      var id = portEl.getAttribute('id');
      var relativeXPos = parseFloat(portEl.getAttribute('x')) - nodeObj.bbox.x;
      var relativeYPos = parseFloat(portEl.getAttribute('y')) - nodeObj.bbox.y;

      relativeXPos = relativeXPos / parseFloat(nodeObj.bbox.w) * 100;
      relativeYPos = relativeYPos / parseFloat(nodeObj.bbox.h) * 100;

      ports.push({
        id: id,
        x: relativeXPos,
        y: relativeYPos
      });
    }

    nodeObj.ports = ports;

    var cytoscapeJsNode = { data: { sbgn: nodeObj } };
    jsonArray.push(cytoscapeJsNode);
  },
  traverseNodes: function traverseNodes(ele, jsonArray, parent, compartments) {
    var elId = ele.getAttribute('id');
    if (!this.sbgnmlTags[ele.className]) {
      return;
    }
    this.insertedNodes[elId] = true;
    var self = this;
    // add complex nodes here

    var eleClass = ele.className;

    if (eleClass === 'complex' || eleClass === 'complex multimer' || eleClass === 'submap') {
      self.addCytoscapeJsNode(ele, jsonArray, parent, compartments);

      var childGlyphs = self.findChildNodes(ele, 'glyph');
      for (var i = 0; i < childGlyphs.length; i++) {
        var glyph = childGlyphs[i];
        var glyphClass = glyph.className;
        if (glyphClass !== 'state variable' && glyphClass !== 'unit of information') {
          self.traverseNodes(glyph, jsonArray, elId, compartments);
        }
      }
    } else {
      self.addCytoscapeJsNode(ele, jsonArray, parent, compartments);
    }
  },
  getPorts: function getPorts(xmlObject) {
    return xmlObject._cachedPorts = xmlObject._cachedPorts || xmlObject.querySelectorAll('port');
  },
  getGlyphs: function getGlyphs(xmlObject) {
    var glyphs = xmlObject._cachedGlyphs;

    if (!glyphs) {
      glyphs = xmlObject._cachedGlyphs = xmlObject._cachedGlyphs || xmlObject.querySelectorAll('glyph');

      var id2glyph = xmlObject._id2glyph = {};

      for (var i = 0; i < glyphs.length; i++) {
        var g = glyphs[i];
        var id = g.getAttribute('id');

        id2glyph[id] = g;
      }
    }

    return glyphs;
  },
  getGlyphById: function getGlyphById(xmlObject, id) {
    this.getGlyphs(xmlObject); // make sure cache is built

    return xmlObject._id2glyph[id];
  },
  getArcSourceAndTarget: function getArcSourceAndTarget(arc, xmlObject) {
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
      for (i = 0; i < portEls.length; i++) {
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

    return { 'source': sourceNodeId, 'target': targetNodeId };
  },

  getArcBendPointPositions: function getArcBendPointPositions(ele) {
    var bendPointPositions = [];

    var children = this.findChildNodes(ele, 'next');

    for (var i = 0; i < children.length; i++) {
      var posX = children[i].getAttribute('x');
      var posY = children[i].getAttribute('y');

      bendPointPositions.push({
        x: posX,
        y: posY
      });
    }

    return bendPointPositions;
  },
  addCytoscapeJsEdge: function addCytoscapeJsEdge(ele, jsonArray, xmlObject) {
    if (!this.sbgnmlTags[ele.className]) {
      return;
    }

    var self = this;
    var sourceAndTarget = self.getArcSourceAndTarget(ele, xmlObject);

    if (!this.insertedNodes[sourceAndTarget.source] || !this.insertedNodes[sourceAndTarget.target]) {
      return;
    }

    var edgeObj = {};
    var bendPointPositions = self.getArcBendPointPositions(ele);

    edgeObj.id = ele.getAttribute('id') || undefined;
    edgeObj.class = ele.className;
    edgeObj.bendPointPositions = bendPointPositions;

    var glyphChildren = self.findChildNodes(ele, 'glyph');
    var glyphDescendents = ele.querySelectorAll('glyph');
    if (glyphDescendents.length <= 0) {
      edgeObj.cardinality = 0;
    } else {
      for (var i = 0; i < glyphChildren.length; i++) {
        if (glyphChildren[i].className === 'cardinality') {
          var label = glyphChildren[i].querySelector('label');
          edgeObj.cardinality = label.getAttribute('text') || undefined;
        }
      }
    }

    edgeObj.source = sourceAndTarget.source;
    edgeObj.target = sourceAndTarget.target;

    edgeObj.portsource = ele.getAttribute('source');
    edgeObj.porttarget = ele.getAttribute('target');

    var cytoscapeJsEdge = { data: edgeObj };
    jsonArray.push(cytoscapeJsEdge);
  },
  convert: function convert(sbgnmlText) {
    var self = this;
    var cytoscapeJsNodes = [];
    var cytoscapeJsEdges = [];

    var xmlObject = this.loadXMLFromString(sbgnmlText);

    var compartments = self.getAllCompartments(xmlObject);

    var glyphs = self.findChildNodes(xmlObject.querySelector('map'), 'glyph');
    var arcs = self.findChildNodes(xmlObject.querySelector('map'), 'arc');

    var i;
    for (i = 0; i < glyphs.length; i++) {
      var glyph = glyphs[i];
      self.traverseNodes(glyph, cytoscapeJsNodes, '', compartments);
    }

    for (i = 0; i < arcs.length; i++) {
      var arc = arcs[i];
      self.addCytoscapeJsEdge(arc, cytoscapeJsEdges, xmlObject);
    }

    var cytoscapeJsGraph = {};
    cytoscapeJsGraph.nodes = cytoscapeJsNodes;
    cytoscapeJsGraph.edges = cytoscapeJsEdges;

    this.insertedNodes = {};

    return cytoscapeJsGraph;
  }
};

module.exports = sbgnmlConverter;

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvc2Jnbm1sQ29udmVydGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFJLFlBQVksUUFBUSxtQkFBUixDQUFoQjs7QUFFQSxPQUFPLE9BQVAsR0FBaUIsVUFBVSxJQUFWLEVBQWdCO0FBQy9CLFNBQU8sVUFBVSxPQUFWLENBQWtCLElBQWxCLENBQVA7QUFDRCxDQUZEOzs7OztBQ0ZBO0FBQ0E7O0FBRUEsSUFBSSxrQkFBa0I7QUFDcEIscUJBQW1CLDJCQUFVLElBQVYsRUFBZ0I7QUFDakMsUUFBSSxHQUFKO0FBQ0EsUUFBSSxPQUFPLGFBQVgsRUFBMEI7QUFDeEIsWUFBTSxJQUFJLGFBQUosQ0FBa0Isa0JBQWxCLENBQU47QUFDQSxVQUFJLEtBQUosR0FBWSxPQUFaO0FBQ0EsVUFBSSxPQUFKLENBQVksSUFBWjtBQUNELEtBSkQsTUFJTztBQUNMLFVBQUksU0FBUyxJQUFJLFNBQUosRUFBYjtBQUNBLFlBQU0sT0FBTyxlQUFQLENBQXVCLElBQXZCLEVBQTZCLFVBQTdCLENBQU47QUFDRDs7QUFFRCxRQUFJLGFBQWEsSUFBSSxvQkFBSixDQUF5QixhQUF6QixDQUFqQjtBQUNBLFFBQUksV0FBVyxNQUFYLEdBQW9CLENBQXhCLEVBQTJCO0FBQ3pCLFlBQU0sSUFBSSxLQUFKLENBQVUsa0RBQWtELEtBQUssU0FBTCxDQUFlLElBQWYsQ0FBNUQsQ0FBTjtBQUNEOztBQUVELFdBQU8sR0FBUDtBQUNELEdBbEJtQjtBQW1CcEIsY0FBWTtBQUNWLDBCQUFzQixJQURaO0FBRVYsdUJBQW1CLElBRlQ7QUFHVixxQkFBaUIsSUFIUDtBQUlWLDRCQUF3QixJQUpkO0FBS1Ysd0JBQW9CLElBTFY7QUFNVix1QkFBbUIsSUFOVDtBQU9WLGVBQVcsSUFQRDtBQVFWLGVBQVcsSUFSRDtBQVNWLHVCQUFtQixJQVRUO0FBVVYseUJBQXFCLElB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QixVQUFVLGFBQVYsQ0FBd0IsS0FBeEIsQ0FBcEIsRUFBb0QsS0FBcEQsQ0FBWDs7QUFFQSxRQUFJLENBQUo7QUFDQSxTQUFLLElBQUksQ0FBVCxFQUFZLElBQUksT0FBTyxNQUF2QixFQUErQixHQUEvQixFQUFvQztBQUNsQyxVQUFJLFFBQVEsT0FBTyxDQUFQLENBQVo7QUFDQSxXQUFLLGFBQUwsQ0FBbUIsS0FBbkIsRUFBMEIsZ0JBQTFCLEVBQTRDLEVBQTVDLEVBQWdELFlBQWhEO0FBQ0Q7O0FBRUQsU0FBSyxJQUFJLENBQVQsRUFBWSxJQUFJLEtBQUssTUFBckIsRUFBNkIsR0FBN0IsRUFBa0M7QUFDaEMsVUFBSSxNQUFNLEtBQUssQ0FBTCxDQUFWO0FBQ0EsV0FBSyxrQkFBTCxDQUF3QixHQUF4QixFQUE2QixnQkFBN0IsRUFBK0MsU0FBL0M7QUFDRDs7QUFFRCxRQUFJLG1CQUFtQixFQUF2QjtBQUNBLHFCQUFpQixLQUFqQixHQUF5QixnQkFBekI7QUFDQSxxQkFBaUIsS0FBakIsR0FBeUIsZ0JBQXpCOztBQUVBLFNBQUssYUFBTCxHQUFxQixFQUFyQjs7QUFFQSxXQUFPLGdCQUFQO0FBQ0Q7QUEvYm1CLENBQXRCOztBQWtjQSxPQUFPLE9BQVAsR0FBaUIsZUFBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGNvbnZlcnRlciA9IHJlcXVpcmUoJy4vc2Jnbm1sQ29udmVydGVyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHRleHQpIHtcbiAgcmV0dXJuIGNvbnZlcnRlci5jb252ZXJ0KHRleHQpO1xufTtcbiIsIi8qIGpzbGludCBicm93c2VyOiB0cnVlICovXG4vKiBnbG9iYWwgQWN0aXZlWE9iamVjdDogZmFsc2UgKi9cblxudmFyIHNiZ25tbENvbnZlcnRlciA9IHtcbiAgbG9hZFhNTEZyb21TdHJpbmc6IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgdmFyIGRvYztcbiAgICBpZiAod2luZG93LkFjdGl2ZVhPYmplY3QpIHtcbiAgICAgIGRvYyA9IG5ldyBBY3RpdmVYT2JqZWN0KCdNaWNyb3NvZnQuWE1MRE9NJyk7XG4gICAgICBkb2MuYXN5bmMgPSAnZmFsc2UnO1xuICAgICAgZG9jLmxvYWRYTUwodGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XG4gICAgICBkb2MgPSBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKHRleHQsICd0ZXh0L3htbCcpO1xuICAgIH1cblxuICAgIHZhciBwYXJzZUVycm9yID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdwYXJzZXJlcnJvcicpO1xuICAgIGlmIChwYXJzZUVycm9yLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGNvbnZlcnQgdGhlIGZvbGxvd2luZyB0ZXh0IHRvIHhtbDogJyArIEpTT04uc3RyaW5naWZ5KHRleHQpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZG9jO1xuICB9LFxuICBzYmdubWxUYWdzOiB7XG4gICAgJ3Vuc3BlY2lmaWVkIGVudGl0eSc6IHRydWUsXG4gICAgJ3NpbXBsZSBjaGVtaWNhbCc6IHRydWUsXG4gICAgJ21hY3JvbW9sZWN1bGUnOiB0cnVlLFxuICAgICdudWNsZWljIGFjaWQgZmVhdHVyZSc6IHRydWUsXG4gICAgJ3BlcnR1cmJpbmcgYWdlbnQnOiB0cnVlLFxuICAgICdzb3VyY2UgYW5kIHNpbmsnOiB0cnVlLFxuICAgICdjb21wbGV4JzogdHJ1ZSxcbiAgICAncHJvY2Vzcyc6IHRydWUsXG4gICAgJ29taXR0ZWQgcHJvY2Vzcyc6IHRydWUsXG4gICAgJ3VuY2VydGFpbiBwcm9jZXNzJzogdHJ1ZSxcbiAgICAnYXNzb2NpYXRpb24nOiB0cnVlLFxuICAgICdkaXNzb2NpYXRpb24nOiB0cnVlLFxuICAgICdwaGVub3R5cGUnOiB0cnVlLFxuICAgICd0YWcnOiB0cnVlLFxuICAgICdjb25zdW1wdGlvbic6IHRydWUsXG4gICAgJ3Byb2R1Y3Rpb24nOiB0cnVlLFxuICAgICdtb2R1bGF0aW9uJzogdHJ1ZSxcbiAgICAnc3RpbXVsYXRpb24nOiB0cnVlLFxuICAgICdjYXRhbHlzaXMnOiB0cnVlLFxuICAgICdpbmhpYml0aW9uJzogdHJ1ZSxcbiAgICAnbmVjZXNzYXJ5IHN0aW11bGF0aW9uJzogdHJ1ZSxcbiAgICAnbG9naWMgYXJjJzogdHJ1ZSxcbiAgICAnZXF1aXZhbGVuY2UgYXJjJzogdHJ1ZSxcbiAgICAnYW5kIG9wZXJhdG9yJzogdHJ1ZSxcbiAgICAnb3Igb3BlcmF0b3InOiB0cnVlLFxuICAgICdub3Qgb3BlcmF0b3InOiB0cnVlLFxuICAgICdhbmQnOiB0cnVlLFxuICAgICdvcic6IHRydWUsXG4gICAgJ25vdCc6IHRydWUsXG4gICAgJ251Y2xlaWMgYWNpZCBmZWF0dXJlIG11bHRpbWVyJzogdHJ1ZSxcbiAgICAnbWFjcm9tb2xlY3VsZSBtdWx0aW1lcic6IHRydWUsXG4gICAgJ3NpbXBsZSBjaGVtaWNhbCBtdWx0aW1lcic6IHRydWUsXG4gICAgJ2NvbXBsZXggbXVsdGltZXInOiB0cnVlLFxuICAgICdjb21wYXJ0bWVudCc6IHRydWVcbiAgfSxcbiAgaW5zZXJ0ZWROb2Rlczoge30sXG4gIGdldEFsbENvbXBhcnRtZW50czogZnVuY3Rpb24gKHhtbE9iamVjdCkge1xuICAgIHZhciBjb21wYXJ0bWVudHMgPSBbXTtcblxuICAgIHZhciBjb21wYXJ0bWVudEVscyA9IHhtbE9iamVjdC5xdWVyeVNlbGVjdG9yQWxsKFwiZ2x5cGhbY2xhc3M9J2NvbXBhcnRtZW50J11cIik7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbXBhcnRtZW50RWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY29tcGFydG1lbnQgPSBjb21wYXJ0bWVudEVsc1tpXTtcbiAgICAgIHZhciBiYm94ID0gdGhpcy5maW5kQ2hpbGROb2RlKGNvbXBhcnRtZW50LCAnYmJveCcpO1xuICAgICAgY29tcGFydG1lbnRzLnB1c2goe1xuICAgICAgICAneCc6IHBhcnNlRmxvYXQoYmJveC5nZXRBdHRyaWJ1dGUoJ3gnKSksXG4gICAgICAgICd5JzogcGFyc2VGbG9hdChiYm94LmdldEF0dHJpYnV0ZSgneScpKSxcbiAgICAgICAgJ3cnOiBwYXJzZUZsb2F0KGJib3guZ2V0QXR0cmlidXRlKCd3JykpLFxuICAgICAgICAnaCc6IHBhcnNlRmxvYXQoYmJveC5nZXRBdHRyaWJ1dGUoJ2gnKSksXG4gICAgICAgICdpZCc6IGNvbXBhcnRtZW50LmdldEF0dHJpYnV0ZSgnaWQnKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29tcGFydG1lbnRzLnNvcnQoZnVuY3Rpb24gKGMxLCBjMikge1xuICAgICAgaWYgKGMxLmggKiBjMS53IDwgYzIuaCAqIGMyLncpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgaWYgKGMxLmggKiBjMS53ID4gYzIuaCAqIGMyLncpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gMDtcbiAgICB9KTtcblxuICAgIHJldHVybiBjb21wYXJ0bWVudHM7XG4gIH0sXG4gIGlzSW5Cb3VuZGluZ0JveDogZnVuY3Rpb24gKGJib3gxLCBiYm94Mikge1xuICAgIGlmIChiYm94MS54ID4gYmJveDIueCAmJlxuICAgICAgICBiYm94MS55ID4gYmJveDIueSAmJlxuICAgICAgICBiYm94MS54ICsgYmJveDEudyA8IGJib3gyLnggKyBiYm94Mi53ICYmXG4gICAgICAgIGJib3gxLnkgKyBiYm94MS5oIDwgYmJveDIueSArIGJib3gyLmgpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG4gIGJib3hQcm9wOiBmdW5jdGlvbiAoZWxlKSB7XG4gICAgdmFyIGJib3ggPSB7fTtcbiAgICB2YXIgYmJveEVsID0gZWxlLnF1ZXJ5U2VsZWN0b3IoJ2Jib3gnKTtcblxuICAgIGJib3gueCA9IGJib3hFbC5nZXRBdHRyaWJ1dGUoJ3gnKTtcbiAgICBiYm94LnkgPSBiYm94RWwuZ2V0QXR0cmlidXRlKCd5Jyk7XG4gICAgYmJveC53ID0gYmJveEVsLmdldEF0dHJpYnV0ZSgndycpO1xuICAgIGJib3guaCA9IGJib3hFbC5nZXRBdHRyaWJ1dGUoJ2gnKTtcbiAgICAvLyBzZXQgcG9zaXRpb25zIGFzIGNlbnRlclxuICAgIGJib3gueCA9IHBhcnNlRmxvYXQoYmJveC54KSArIHBhcnNlRmxvYXQoYmJveC53KSAvIDI7XG4gICAgYmJveC55ID0gcGFyc2VGbG9hdChiYm94LnkpICsgcGFyc2VGbG9hdChiYm94LmgpIC8gMjtcblxuICAgIHJldHVybiBiYm94O1xuICB9LFxuICBzdGF0ZUFuZEluZm9CYm94UHJvcDogZnVuY3Rpb24gKGVsZSwgcGFyZW50QmJveCkge1xuICAgIHZhciB4UG9zID0gcGFyc2VGbG9hdChwYXJlbnRCYm94LngpO1xuICAgIHZhciB5UG9zID0gcGFyc2VGbG9hdChwYXJlbnRCYm94LnkpO1xuXG4gICAgdmFyIGJib3ggPSB7fTtcbiAgICB2YXIgYmJveEVsID0gZWxlLnF1ZXJ5U2VsZWN0b3IoJ2Jib3gnKTtcblxuICAgIGJib3gueCA9IGJib3hFbC5nZXRBdHRyaWJ1dGUoJ3gnKTtcbiAgICBiYm94LnkgPSBiYm94RWwuZ2V0QXR0cmlidXRlKCd5Jyk7XG4gICAgYmJveC53ID0gYmJveEVsLmdldEF0dHJpYnV0ZSgndycpO1xuICAgIGJib3guaCA9IGJib3hFbC5nZXRBdHRyaWJ1dGUoJ2gnKTtcblxuICAgIC8vIHNldCBwb3NpdGlvbnMgYXMgY2VudGVyXG4gICAgYmJveC54ID0gcGFyc2VGbG9hdChiYm94LngpICsgcGFyc2VGbG9hdChiYm94LncpIC8gMiAtIHhQb3M7XG4gICAgYmJveC55ID0gcGFyc2VGbG9hdChiYm94LnkpICsgcGFyc2VGbG9hdChiYm94LmgpIC8gMiAtIHlQb3M7XG5cbiAgICBiYm94LnggPSBiYm94LnggLyBwYXJzZUZsb2F0KHBhcmVudEJib3gudykgKiAxMDA7XG4gICAgYmJveC55ID0gYmJveC55IC8gcGFyc2VGbG9hdChwYXJlbnRCYm94LmgpICogMTAwO1xuXG4gICAgcmV0dXJuIGJib3g7XG4gIH0sXG4gIGZpbmRDaGlsZE5vZGVzOiBmdW5jdGlvbiAoZWxlLCBjaGlsZFRhZ05hbWUpIHtcbiAgICAvLyBmaW5kIGNoaWxkIG5vZGVzIGF0IGRlcHRoIGxldmVsIG9mIDEgcmVsYXRpdmUgdG8gdGhlIGVsZW1lbnRcbiAgICB2YXIgY2hpbGRyZW4gPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY2hpbGQgPSBlbGUuY2hpbGROb2Rlc1tpXTtcbiAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gMSAmJiBjaGlsZC50YWdOYW1lID09PSBjaGlsZFRhZ05hbWUpIHtcbiAgICAgICAgY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfSxcbiAgZmluZENoaWxkTm9kZTogZnVuY3Rpb24gKGVsZSwgY2hpbGRUYWdOYW1lKSB7XG4gICAgdmFyIG5vZGVzID0gdGhpcy5maW5kQ2hpbGROb2RlcyhlbGUsIGNoaWxkVGFnTmFtZSk7XG4gICAgcmV0dXJuIG5vZGVzLmxlbmd0aCA+IDAgPyBub2Rlc1swXSA6IHVuZGVmaW5lZDtcbiAgfSxcbiAgc3RhdGVBbmRJbmZvUHJvcDogZnVuY3Rpb24gKGVsZSwgcGFyZW50QmJveCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgc3RhdGVWYXJpYWJsZXMgPSBbXTtcbiAgICB2YXIgdW5pdHNPZkluZm9ybWF0aW9uID0gW107XG5cbiAgICB2YXIgY2hpbGRHbHlwaHMgPSB0aGlzLmZpbmRDaGlsZE5vZGVzKGVsZSwgJ2dseXBoJyk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkR2x5cGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgZ2x5cGggPSBjaGlsZEdseXBoc1tpXTtcbiAgICAgIHZhciBpbmZvID0ge307XG5cbiAgICAgIGlmIChnbHlwaC5jbGFzc05hbWUgPT09ICd1bml0IG9mIGluZm9ybWF0aW9uJykge1xuICAgICAgICBpbmZvLmlkID0gZ2x5cGguZ2V0QXR0cmlidXRlKCdpZCcpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgaW5mby5jbGF6eiA9IGdseXBoLmNsYXNzTmFtZSB8fCB1bmRlZmluZWQ7XG4gICAgICAgIHZhciBsYWJlbCA9IGdseXBoLnF1ZXJ5U2VsZWN0b3IoJ2xhYmVsJyk7XG4gICAgICAgIGluZm8ubGFiZWwgPSB7XG4gICAgICAgICAgJ3RleHQnOiAobGFiZWwgJiYgbGFiZWwuZ2V0QXR0cmlidXRlKCd0ZXh0JykpIHx8IHVuZGVmaW5lZFxuICAgICAgICB9O1xuICAgICAgICBpbmZvLmJib3ggPSBzZWxmLnN0YXRlQW5kSW5mb0Jib3hQcm9wKGdseXBoLCBwYXJlbnRCYm94KTtcbiAgICAgICAgdW5pdHNPZkluZm9ybWF0aW9uLnB1c2goaW5mbyk7XG4gICAgICB9IGVsc2UgaWYgKGdseXBoLmNsYXNzTmFtZSA9PT0gJ3N0YXRlIHZhcmlhYmxlJykge1xuICAgICAgICBpbmZvLmlkID0gZ2x5cGguZ2V0QXR0cmlidXRlKCdpZCcpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgaW5mby5jbGF6eiA9IGdseXBoLmNsYXNzTmFtZSB8fCB1bmRlZmluZWQ7XG4gICAgICAgIHZhciBzdGF0ZSA9IGdseXBoLnF1ZXJ5U2VsZWN0b3IoJ3N0YXRlJyk7XG4gICAgICAgIHZhciB2YWx1ZSA9IChzdGF0ZSAmJiBzdGF0ZS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJykpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgdmFyIHZhcmlhYmxlID0gKHN0YXRlICYmIHN0YXRlLmdldEF0dHJpYnV0ZSgndmFyaWFibGUnKSkgfHwgdW5kZWZpbmVkO1xuICAgICAgICBpbmZvLnN0YXRlID0ge1xuICAgICAgICAgICd2YWx1ZSc6IHZhbHVlLFxuICAgICAgICAgICd2YXJpYWJsZSc6IHZhcmlhYmxlXG4gICAgICAgIH07XG4gICAgICAgIGluZm8uYmJveCA9IHNlbGYuc3RhdGVBbmRJbmZvQmJveFByb3AoZ2x5cGgsIHBhcmVudEJib3gpO1xuICAgICAgICBzdGF0ZVZhcmlhYmxlcy5wdXNoKGluZm8pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7J3VuaXRzT2ZJbmZvcm1hdGlvbic6IHVuaXRzT2ZJbmZvcm1hdGlvbiwgJ3N0YXRlVmFyaWFibGVzJzogc3RhdGVWYXJpYWJsZXN9O1xuICB9LFxuICBhZGRQYXJlbnRJbmZvVG9Ob2RlOiBmdW5jdGlvbiAoZWxlLCBub2RlT2JqLCBwYXJlbnQsIGNvbXBhcnRtZW50cykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgY29tcGFydG1lbnRSZWYgPSBlbGUuZ2V0QXR0cmlidXRlKCdjb21wYXJ0bWVudFJlZicpO1xuXG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgbm9kZU9iai5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGNvbXBhcnRtZW50UmVmKSB7XG4gICAgICBub2RlT2JqLnBhcmVudCA9IGNvbXBhcnRtZW50UmVmO1xuICAgIH0gZWxzZSB7XG4gICAgICBub2RlT2JqLnBhcmVudCA9ICcnO1xuXG4gICAgICAvLyBhZGQgY29tcGFydG1lbnQgYWNjb3JkaW5nIHRvIGdlb21ldHJ5XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbXBhcnRtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgYmJveEVsID0gc2VsZi5maW5kQ2hpbGROb2RlKGVsZSwgJ2Jib3gnKTtcbiAgICAgICAgdmFyIGJib3ggPSB7XG4gICAgICAgICAgJ3gnOiBwYXJzZUZsb2F0KGJib3hFbC5nZXRBdHRyaWJ1dGUoJ3gnKSksXG4gICAgICAgICAgJ3knOiBwYXJzZUZsb2F0KGJib3hFbC5nZXRBdHRyaWJ1dGUoJ3knKSksXG4gICAgICAgICAgJ3cnOiBwYXJzZUZsb2F0KGJib3hFbC5nZXRBdHRyaWJ1dGUoJ3cnKSksXG4gICAgICAgICAgJ2gnOiBwYXJzZUZsb2F0KGJib3hFbC5nZXRBdHRyaWJ1dGUoJ2gnKSksXG4gICAgICAgICAgJ2lkJzogZWxlLmdldEF0dHJpYnV0ZSgnaWQnKVxuICAgICAgICB9O1xuICAgICAgICBpZiAoc2VsZi5pc0luQm91bmRpbmdCb3goYmJveCwgY29tcGFydG1lbnRzW2ldKSkge1xuICAgICAgICAgIG5vZGVPYmoucGFyZW50ID0gY29tcGFydG1lbnRzW2ldLmlkO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBhZGRDeXRvc2NhcGVKc05vZGU6IGZ1bmN0aW9uIChlbGUsIGpzb25BcnJheSwgcGFyZW50LCBjb21wYXJ0bWVudHMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG5vZGVPYmogPSB7fTtcblxuICAgIC8vIGFkZCBpZCBpbmZvcm1hdGlvblxuICAgIG5vZGVPYmouaWQgPSBlbGUuZ2V0QXR0cmlidXRlKCdpZCcpO1xuICAgIC8vIGFkZCBub2RlIGJvdW5kaW5nIGJveCBpbmZvcm1hdGlvblxuICAgIG5vZGVPYmouYmJveCA9IHNlbGYuYmJveFByb3AoZWxlKTtcbiAgICAvLyBhZGQgY2xhc3MgaW5mb3JtYXRpb25cbiAgICBub2RlT2JqLmNsYXNzID0gZWxlLmNsYXNzTmFtZTtcbiAgICAvLyBhZGQgbGFiZWwgaW5mb3JtYXRpb25cbiAgICB2YXIgbGFiZWwgPSBzZWxmLmZpbmRDaGlsZE5vZGUoZWxlLCAnbGFiZWwnKTtcbiAgICBub2RlT2JqLmxhYmVsID0gKGxhYmVsICYmIGxhYmVsLmdldEF0dHJpYnV0ZSgndGV4dCcpKSB8fCB1bmRlZmluZWQ7XG4gICAgLy8gYWRkIHN0YXRlIGFuZCBpbmZvIGJveCBpbmZvcm1hdGlvblxuICAgIG5vZGVPYmoudW5pdHNPZkluZm9ybWF0aW9uID0gc2VsZi5zdGF0ZUFuZEluZm9Qcm9wKGVsZSwgbm9kZU9iai5iYm94KS51bml0c09mSW5mb3JtYXRpb247XG4gICAgbm9kZU9iai5zdGF0ZVZhcmlhYmxlcyA9IHNlbGYuc3RhdGVBbmRJbmZvUHJvcChlbGUsIG5vZGVPYmouYmJveCkuc3RhdGVWYXJpYWJsZXM7XG4gICAgLy8gYWRkaW5nIHBhcmVudCBpbmZvcm1hdGlvblxuICAgIHNlbGYuYWRkUGFyZW50SW5mb1RvTm9kZShlbGUsIG5vZGVPYmosIHBhcmVudCwgY29tcGFydG1lbnRzKTtcblxuICAgIC8vIGFkZCBjbG9uZSBpbmZvcm1hdGlvblxuICAgIHZhciBjbG9uZU1hcmtlcnMgPSBzZWxmLmZpbmRDaGlsZE5vZGVzKGVsZSwgJ2Nsb25lJyk7XG4gICAgaWYgKGNsb25lTWFya2Vycy5sZW5ndGggPiAwKSB7XG4gICAgICBub2RlT2JqLmNsb25lbWFya2VyID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZU9iai5jbG9uZW1hcmtlciA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvLyBhZGQgcG9ydCBpbmZvcm1hdGlvblxuICAgIHZhciBwb3J0cyA9IFtdO1xuICAgIHZhciBwb3J0RWxlbWVudHMgPSBlbGUucXVlcnlTZWxlY3RvckFsbCgncG9ydCcpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb3J0RWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBwb3J0RWwgPSBwb3J0RWxlbWVudHNbaV07XG4gICAgICB2YXIgaWQgPSBwb3J0RWwuZ2V0QXR0cmlidXRlKCdpZCcpO1xuICAgICAgdmFyIHJlbGF0aXZlWFBvcyA9IHBhcnNlRmxvYXQocG9ydEVsLmdldEF0dHJpYnV0ZSgneCcpKSAtIG5vZGVPYmouYmJveC54O1xuICAgICAgdmFyIHJlbGF0aXZlWVBvcyA9IHBhcnNlRmxvYXQocG9ydEVsLmdldEF0dHJpYnV0ZSgneScpKSAtIG5vZGVPYmouYmJveC55O1xuXG4gICAgICByZWxhdGl2ZVhQb3MgPSByZWxhdGl2ZVhQb3MgLyBwYXJzZUZsb2F0KG5vZGVPYmouYmJveC53KSAqIDEwMDtcbiAgICAgIHJlbGF0aXZlWVBvcyA9IHJlbGF0aXZlWVBvcyAvIHBhcnNlRmxvYXQobm9kZU9iai5iYm94LmgpICogMTAwO1xuXG4gICAgICBwb3J0cy5wdXNoKHtcbiAgICAgICAgaWQ6IGlkLFxuICAgICAgICB4OiByZWxhdGl2ZVhQb3MsXG4gICAgICAgIHk6IHJlbGF0aXZlWVBvc1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgbm9kZU9iai5wb3J0cyA9IHBvcnRzO1xuXG4gICAgdmFyIGN5dG9zY2FwZUpzTm9kZSA9IHtkYXRhOiB7c2Jnbjogbm9kZU9ian19O1xuICAgIGpzb25BcnJheS5wdXNoKGN5dG9zY2FwZUpzTm9kZSk7XG4gIH0sXG4gIHRyYXZlcnNlTm9kZXM6IGZ1bmN0aW9uIChlbGUsIGpzb25BcnJheSwgcGFyZW50LCBjb21wYXJ0bWVudHMpIHtcbiAgICB2YXIgZWxJZCA9IGVsZS5nZXRBdHRyaWJ1dGUoJ2lkJyk7XG4gICAgaWYgKCF0aGlzLnNiZ25tbFRhZ3NbZWxlLmNsYXNzTmFtZV0pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5pbnNlcnRlZE5vZGVzW2VsSWRdID0gdHJ1ZTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gYWRkIGNvbXBsZXggbm9kZXMgaGVyZVxuXG4gICAgdmFyIGVsZUNsYXNzID0gZWxlLmNsYXNzTmFtZTtcblxuICAgIGlmIChlbGVDbGFzcyA9PT0gJ2NvbXBsZXgnIHx8IGVsZUNsYXNzID09PSAnY29tcGxleCBtdWx0aW1lcicgfHwgZWxlQ2xhc3MgPT09ICdzdWJtYXAnKSB7XG4gICAgICBzZWxmLmFkZEN5dG9zY2FwZUpzTm9kZShlbGUsIGpzb25BcnJheSwgcGFyZW50LCBjb21wYXJ0bWVudHMpO1xuXG4gICAgICB2YXIgY2hpbGRHbHlwaHMgPSBzZWxmLmZpbmRDaGlsZE5vZGVzKGVsZSwgJ2dseXBoJyk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkR2x5cGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBnbHlwaCA9IGNoaWxkR2x5cGhzW2ldO1xuICAgICAgICB2YXIgZ2x5cGhDbGFzcyA9IGdseXBoLmNsYXNzTmFtZTtcbiAgICAgICAgaWYgKGdseXBoQ2xhc3MgIT09ICdzdGF0ZSB2YXJpYWJsZScgJiYgZ2x5cGhDbGFzcyAhPT0gJ3VuaXQgb2YgaW5mb3JtYXRpb24nKSB7XG4gICAgICAgICAgc2VsZi50cmF2ZXJzZU5vZGVzKGdseXBoLCBqc29uQXJyYXksIGVsSWQsIGNvbXBhcnRtZW50cyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5hZGRDeXRvc2NhcGVKc05vZGUoZWxlLCBqc29uQXJyYXksIHBhcmVudCwgY29tcGFydG1lbnRzKTtcbiAgICB9XG4gIH0sXG4gIGdldFBvcnRzOiBmdW5jdGlvbiAoeG1sT2JqZWN0KSB7XG4gICAgcmV0dXJuICggeG1sT2JqZWN0Ll9jYWNoZWRQb3J0cyA9IHhtbE9iamVjdC5fY2FjaGVkUG9ydHMgfHwgeG1sT2JqZWN0LnF1ZXJ5U2VsZWN0b3JBbGwoJ3BvcnQnKSk7XG4gIH0sXG4gIGdldEdseXBoczogZnVuY3Rpb24gKHhtbE9iamVjdCkge1xuICAgIHZhciBnbHlwaHMgPSB4bWxPYmplY3QuX2NhY2hlZEdseXBocztcblxuICAgIGlmICghZ2x5cGhzKSB7XG4gICAgICBnbHlwaHMgPSB4bWxPYmplY3QuX2NhY2hlZEdseXBocyA9IHhtbE9iamVjdC5fY2FjaGVkR2x5cGhzIHx8IHhtbE9iamVjdC5xdWVyeVNlbGVjdG9yQWxsKCdnbHlwaCcpO1xuXG4gICAgICB2YXIgaWQyZ2x5cGggPSB4bWxPYmplY3QuX2lkMmdseXBoID0ge307XG5cbiAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGdseXBocy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgdmFyIGcgPSBnbHlwaHNbaV07XG4gICAgICAgIHZhciBpZCA9IGcuZ2V0QXR0cmlidXRlKCdpZCcpO1xuXG4gICAgICAgIGlkMmdseXBoWyBpZCBdID0gZztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZ2x5cGhzO1xuICB9LFxuICBnZXRHbHlwaEJ5SWQ6IGZ1bmN0aW9uICh4bWxPYmplY3QsIGlkKSB7XG4gICAgdGhpcy5nZXRHbHlwaHMoeG1sT2JqZWN0KTsgLy8gbWFrZSBzdXJlIGNhY2hlIGlzIGJ1aWx0XG5cbiAgICByZXR1cm4geG1sT2JqZWN0Ll9pZDJnbHlwaFtpZF07XG4gIH0sXG4gIGdldEFyY1NvdXJjZUFuZFRhcmdldDogZnVuY3Rpb24gKGFyYywgeG1sT2JqZWN0KSB7XG4gICAgLy8gc291cmNlIGFuZCB0YXJnZXQgY2FuIGJlIGluc2lkZSBvZiBhIHBvcnRcbiAgICB2YXIgc291cmNlID0gYXJjLmdldEF0dHJpYnV0ZSgnc291cmNlJyk7XG4gICAgdmFyIHRhcmdldCA9IGFyYy5nZXRBdHRyaWJ1dGUoJ3RhcmdldCcpO1xuICAgIHZhciBzb3VyY2VOb2RlSWQ7XG4gICAgdmFyIHRhcmdldE5vZGVJZDtcblxuICAgIHZhciBzb3VyY2VFeGlzdHMgPSB0aGlzLmdldEdseXBoQnlJZCh4bWxPYmplY3QsIHNvdXJjZSk7XG4gICAgdmFyIHRhcmdldEV4aXN0cyA9IHRoaXMuZ2V0R2x5cGhCeUlkKHhtbE9iamVjdCwgdGFyZ2V0KTtcblxuICAgIGlmIChzb3VyY2VFeGlzdHMpIHtcbiAgICAgIHNvdXJjZU5vZGVJZCA9IHNvdXJjZTtcbiAgICB9XG5cbiAgICBpZiAodGFyZ2V0RXhpc3RzKSB7XG4gICAgICB0YXJnZXROb2RlSWQgPSB0YXJnZXQ7XG4gICAgfVxuXG5cbiAgICB2YXIgaTtcbiAgICB2YXIgcG9ydEVscyA9IHRoaXMuZ2V0UG9ydHMoeG1sT2JqZWN0KTtcbiAgICB2YXIgcG9ydDtcbiAgICBpZiAoc291cmNlTm9kZUlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBwb3J0RWxzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICBwb3J0ID0gcG9ydEVsc1tpXTtcbiAgICAgICAgaWYgKHBvcnQuZ2V0QXR0cmlidXRlKCdpZCcpID09PSBzb3VyY2UpIHtcbiAgICAgICAgICBzb3VyY2VOb2RlSWQgPSBwb3J0LnBhcmVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdpZCcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRhcmdldE5vZGVJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgcG9ydEVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICBwb3J0ID0gcG9ydEVsc1tpXTtcbiAgICAgICAgaWYgKHBvcnQuZ2V0QXR0cmlidXRlKCdpZCcpID09PSB0YXJnZXQpIHtcbiAgICAgICAgICB0YXJnZXROb2RlSWQgPSBwb3J0LnBhcmVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdpZCcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHsnc291cmNlJzogc291cmNlTm9kZUlkLCAndGFyZ2V0JzogdGFyZ2V0Tm9kZUlkfTtcbiAgfSxcblxuICBnZXRBcmNCZW5kUG9pbnRQb3NpdGlvbnM6IGZ1bmN0aW9uIChlbGUpIHtcbiAgICB2YXIgYmVuZFBvaW50UG9zaXRpb25zID0gW107XG5cbiAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmZpbmRDaGlsZE5vZGVzKGVsZSwgJ25leHQnKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBwb3NYID0gY2hpbGRyZW5baV0uZ2V0QXR0cmlidXRlKCd4Jyk7XG4gICAgICB2YXIgcG9zWSA9IGNoaWxkcmVuW2ldLmdldEF0dHJpYnV0ZSgneScpO1xuXG4gICAgICBiZW5kUG9pbnRQb3NpdGlvbnMucHVzaCh7XG4gICAgICAgIHg6IHBvc1gsXG4gICAgICAgIHk6IHBvc1lcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBiZW5kUG9pbnRQb3NpdGlvbnM7XG4gIH0sXG4gIGFkZEN5dG9zY2FwZUpzRWRnZTogZnVuY3Rpb24gKGVsZSwganNvbkFycmF5LCB4bWxPYmplY3QpIHtcbiAgICBpZiAoIXRoaXMuc2Jnbm1sVGFnc1tlbGUuY2xhc3NOYW1lXSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgc291cmNlQW5kVGFyZ2V0ID0gc2VsZi5nZXRBcmNTb3VyY2VBbmRUYXJnZXQoZWxlLCB4bWxPYmplY3QpO1xuXG4gICAgaWYgKCF0aGlzLmluc2VydGVkTm9kZXNbc291cmNlQW5kVGFyZ2V0LnNvdXJjZV0gfHwgIXRoaXMuaW5zZXJ0ZWROb2Rlc1tzb3VyY2VBbmRUYXJnZXQudGFyZ2V0XSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBlZGdlT2JqID0ge307XG4gICAgdmFyIGJlbmRQb2ludFBvc2l0aW9ucyA9IHNlbGYuZ2V0QXJjQmVuZFBvaW50UG9zaXRpb25zKGVsZSk7XG5cbiAgICBlZGdlT2JqLmlkID0gZWxlLmdldEF0dHJpYnV0ZSgnaWQnKSB8fCB1bmRlZmluZWQ7XG4gICAgZWRnZU9iai5jbGFzcyA9IGVsZS5jbGFzc05hbWU7XG4gICAgZWRnZU9iai5iZW5kUG9pbnRQb3NpdGlvbnMgPSBiZW5kUG9pbnRQb3NpdGlvbnM7XG5cbiAgICB2YXIgZ2x5cGhDaGlsZHJlbiA9IHNlbGYuZmluZENoaWxkTm9kZXMoZWxlLCAnZ2x5cGgnKTtcbiAgICB2YXIgZ2x5cGhEZXNjZW5kZW50cyA9IGVsZS5xdWVyeVNlbGVjdG9yQWxsKCdnbHlwaCcpO1xuICAgIGlmIChnbHlwaERlc2NlbmRlbnRzLmxlbmd0aCA8PSAwKSB7XG4gICAgICBlZGdlT2JqLmNhcmRpbmFsaXR5ID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnbHlwaENoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChnbHlwaENoaWxkcmVuW2ldLmNsYXNzTmFtZSA9PT0gJ2NhcmRpbmFsaXR5Jykge1xuICAgICAgICAgIHZhciBsYWJlbCA9IGdseXBoQ2hpbGRyZW5baV0ucXVlcnlTZWxlY3RvcignbGFiZWwnKTtcbiAgICAgICAgICBlZGdlT2JqLmNhcmRpbmFsaXR5ID0gbGFiZWwuZ2V0QXR0cmlidXRlKCd0ZXh0JykgfHwgdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZWRnZU9iai5zb3VyY2UgPSBzb3VyY2VBbmRUYXJnZXQuc291cmNlO1xuICAgIGVkZ2VPYmoudGFyZ2V0ID0gc291cmNlQW5kVGFyZ2V0LnRhcmdldDtcblxuICAgIGVkZ2VPYmoucG9ydHNvdXJjZSA9IGVsZS5nZXRBdHRyaWJ1dGUoJ3NvdXJjZScpO1xuICAgIGVkZ2VPYmoucG9ydHRhcmdldCA9IGVsZS5nZXRBdHRyaWJ1dGUoJ3RhcmdldCcpO1xuXG4gICAgdmFyIGN5dG9zY2FwZUpzRWRnZSA9IHtkYXRhOiBlZGdlT2JqfTtcbiAgICBqc29uQXJyYXkucHVzaChjeXRvc2NhcGVKc0VkZ2UpO1xuICB9LFxuICBjb252ZXJ0OiBmdW5jdGlvbiAoc2Jnbm1sVGV4dCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgY3l0b3NjYXBlSnNOb2RlcyA9IFtdO1xuICAgIHZhciBjeXRvc2NhcGVKc0VkZ2VzID0gW107XG5cbiAgICB2YXIgeG1sT2JqZWN0ID0gdGhpcy5sb2FkWE1MRnJvbVN0cmluZyhzYmdubWxUZXh0KTtcblxuICAgIHZhciBjb21wYXJ0bWVudHMgPSBzZWxmLmdldEFsbENvbXBhcnRtZW50cyh4bWxPYmplY3QpO1xuXG4gICAgdmFyIGdseXBocyA9IHNlbGYuZmluZENoaWxkTm9kZXMoeG1sT2JqZWN0LnF1ZXJ5U2VsZWN0b3IoJ21hcCcpLCAnZ2x5cGgnKTtcbiAgICB2YXIgYXJjcyA9IHNlbGYuZmluZENoaWxkTm9kZXMoeG1sT2JqZWN0LnF1ZXJ5U2VsZWN0b3IoJ21hcCcpLCAnYXJjJyk7XG5cbiAgICB2YXIgaTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgZ2x5cGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgZ2x5cGggPSBnbHlwaHNbaV07XG4gICAgICBzZWxmLnRyYXZlcnNlTm9kZXMoZ2x5cGgsIGN5dG9zY2FwZUpzTm9kZXMsICcnLCBjb21wYXJ0bWVudHMpO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBhcmNzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYXJjID0gYXJjc1tpXTtcbiAgICAgIHNlbGYuYWRkQ3l0b3NjYXBlSnNFZGdlKGFyYywgY3l0b3NjYXBlSnNFZGdlcywgeG1sT2JqZWN0KTtcbiAgICB9XG5cbiAgICB2YXIgY3l0b3NjYXBlSnNHcmFwaCA9IHt9O1xuICAgIGN5dG9zY2FwZUpzR3JhcGgubm9kZXMgPSBjeXRvc2NhcGVKc05vZGVzO1xuICAgIGN5dG9zY2FwZUpzR3JhcGguZWRnZXMgPSBjeXRvc2NhcGVKc0VkZ2VzO1xuXG4gICAgdGhpcy5pbnNlcnRlZE5vZGVzID0ge307XG5cbiAgICByZXR1cm4gY3l0b3NjYXBlSnNHcmFwaDtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzYmdubWxDb252ZXJ0ZXI7XG4iXX0=
