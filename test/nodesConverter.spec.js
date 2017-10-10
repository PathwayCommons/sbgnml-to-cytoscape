/* global describe, it */
const nconvert = require('../src/nodesConverter');
const convert = require('xml-js');

const expect = require('chai').expect;

const makeSbgnml = (sbgnXml) => {
  return`
  <?xml version="1.0" encoding="UTF-8"?>
    <sbgn xmlns="http://sbgn.org/libsbgn/pd/0.1">
      <map>
      ${sbgnXml}
      </map>
    </sbgn>
  `;
};


describe('nodesConverter', function () {
  it('returns empty output for silly input', function () {
    const garbage = ['', false, true, {'blah': 'blah'}, {}];

    garbage.map((g) => {
      const {nodes: nodes, nodeIdSet: nodeIdSet, portIdMap} = nconvert(g);
      expect(nodes).to.deep.equal([]);
      expect(nodeIdSet.size).to.deep.equal(0);
      expect(portIdMap.size).to.deep.equal(0);
    });
  });

  it('throws an error when a node does not have an id', function () {
    const input = makeSbgnml(
      `
      <glyph class="macromolecule multimer">
        <label text=" m clone uinfo svar" />
        <bbox y="200" x="800" w="100" h="60" />
        <clone/>
        <glyph id="13a" class="state variable">
           <state value="P" />
           <bbox y="259.2873064873903" x="454.68302213209245" w="25.0" h="22.0" />
        </glyph>
        <glyph id='13b' class='unit of information'>
          <label text='mt:prot' />
          <bbox y='686.0266417318942' x='718.3012187112336' w='53.0' h='18.0' />
        </glyph>
      </glyph>
      `);

    const nullIdTest = function() {
      const basic = convert.xml2js(input, {compact: true, spaces: 2, trim: true, nativeType: true });
      const res = nconvert([].concat(basic.sbgn.map.glyph));
    };

    expect(nullIdTest).to.throw(Error);
  });

  it('returns null for auxiliary items that do not have an id', function () {
    const input = makeSbgnml(
      `
      <glyph id="1" class="macromolecule multimer">
        <label text=" m clone uinfo svar" />
        <bbox y="200" x="800" w="100" h="60" />
        <clone/>
        <glyph class="state variable">
           <state value="P" />
           <bbox y="259.2873064873903" x="454.68302213209245" w="25.0" h="22.0" />
        </glyph>
        <glyph class='unit of information'>
          <label text='mt:prot' />
          <bbox y='686.0266417318942' x='718.3012187112336' w='53.0' h='18.0' />
        </glyph>
      </glyph>
      `);

    const basic = convert.xml2js(input, {compact: true, spaces: 2, trim: true, nativeType: true });
    const res = nconvert([].concat(basic.sbgn.map.glyph));

    expect(res.nodes[0].data.stateVariables[0].id).to.equal(null);
    expect(res.nodes[0].data.unitsOfInformation[0].id).to.equal(null);
  });


  it('throws an error for undefined or null input', function () {
    const nullTest = function() { nconvert(null); };
    const undefinedTest = function() { nconvert(undefined); };

    expect(nullTest).to.throw(TypeError);
    expect(undefinedTest).to.throw(TypeError);
  });

  it('should convert basic (non-compound) nodes', function () {
    const input = makeSbgnml(
      `
      <glyph id="13" class="macromolecule multimer">
        <label text=" m clone uinfo svar" />
        <bbox y="200" x="800" w="100" h="60" />
        <clone/>
        <glyph id="13a" class="state variable">
           <state value="P" />
           <bbox y="259.2873064873903" x="454.68302213209245" w="25.0" h="22.0" />
        </glyph>
        <glyph id='13b' class='unit of information'>
          <label text='mt:prot' />
          <bbox y='686.0266417318942' x='718.3012187112336' w='53.0' h='18.0' />
        </glyph>
      </glyph>
      <glyph id="14" class="macromolecule">
        <label text=" clone uinfo svar" />
        <bbox y="200" x="1000" w="100" h="60" />
        <glyph id="14a" class="state variable">
           <state value="P" />
           <bbox y="259.2873064873903" x="454.68302213209245" w="25.0" h="22.0" />
        </glyph>
        <clone />
      </glyph>
      `);

    const output =
    [
      {
        "data": {
            "id": "14",
            "bbox": {
                "x": 1050,
                "y": 230,
                "w": 100,
                "h": 60
            },
            "class": "macromolecule",
            "label": "clone uinfo svar",
            "stateVariables": [
              {
                "id": "14a",
                "class": "state variable",
                "state": {
                  "value": "P",
                  "variable": ""
                }
              }
            ],
            unitsOfInformation: [],
            "parent": "",
            "clonemarker": true,
        },
      },
      {
        "data": {
            "id": "13",
            "bbox": {
                "x": 850,
                "y": 230,
                "w": 100,
                "h": 60
            },
            "class": "macromolecule multimer",
            "label": "m clone uinfo svar",
            "stateVariables": [
              {
                "id": "13a",
                "class": "state variable",
                "state": {
                  "value": "P",
                  "variable": ""
                },
              }
            ],
            "unitsOfInformation": [
              {
                "id": "13b",
                "class": "unit of information",
                "label": {
                  "text": "mt:prot"
                },
              }
            ],
            "parent": "",
            "clonemarker": true,
        }
      }
    ];

    const basic = convert.xml2js(input, {compact: true, spaces: 2, trim: true, nativeType: true });
    const res = nconvert([].concat(basic.sbgn.map.glyph));

    expect(res.nodes).to.deep.equal(output);
    expect(res.nodeIdSet.size).to.equal(2);
    expect(res.nodeIdSet.has('14')).to.be.true;
    expect(res.portIdMap.size).to.equal(0);
  });

  it('should convert compound nodes', function () {
    const input = makeSbgnml(
      `
      <glyph id="23" class="complex multimer">
        <label text="complex m" />
        <bbox y="800" x="700" w="220" h="270" />
        <glyph id="23c" class="simple chemical">
           <label text="ATP" />
           <bbox y="900" x="800" w="60" h="60" />
        </glyph>
      </glyph>
    `
    );

    const output = [
      {
        "data": {
          "id": "23",
          "class": "complex multimer",
          "label": "complex m",
          "parent": "",
          "clonemarker": false,
          "stateVariables": [],
          "unitsOfInformation": [],
          "bbox": {
            "x": 810,
            "y": 935,
            "w": 220,
            "h": 270
          }
        }
      },
      {
        "data": {
          "id": "23c",
          "class": "simple chemical",
          "label": "ATP",
          "parent": "23",
          "clonemarker": false,
          "stateVariables": [],
          "unitsOfInformation": [],
          "bbox": {
            "x": 830,
            "y": 930,
            "w": 60,
            "h": 60
          }
        }
      }
    ];


    const compound = convert.xml2js(input, {compact: true, spaces: 2, trim: true, nativeType: true });
    const res = nconvert([].concat(compound.sbgn.map.glyph));
    expect(res.nodes.length).to.deep.equal(2);
    expect(res.nodes).to.deep.equal(output);
    expect(res.portIdMap.size).to.equal(0);
  });

  it('should place immediate parent nodes as the parent to immediate child nodes (compounds)', function () {
    const input = makeSbgnml(
      `
      <glyph id="glyph1" class="compartment">
         <label text="synaptic cleft" />
         <bbox y="451.4672628114068" x="643.0041361913168" w="254.08954881649527" h="304.8762412720447" />
      </glyph>
      <glyph id="23" class="complex multimer" compartmentRef="glyph1">
        <label text="complex m" />
        <bbox y="800" x="700" w="220" h="270" />
        <glyph id="23c" class="simple chemical">
           <label text="ATP" />
           <bbox y="900" x="800" w="60" h="60" />
        </glyph>
      </glyph>
    `
    );
    const output = [
      {
        "data": {
            "id": "23",
            "class": "complex multimer",
            "label": "complex m",
            "parent": "glyph1",
            "clonemarker": false,
            "stateVariables": [],
            "unitsOfInformation": [],
            "bbox": {
                "x": 810,
                "y": 935,
                "w": 220,
                "h": 270
            }
        }
      },
      {
        "data": {
            "id": "23c",
            "class": "simple chemical",
            "label": "ATP",
            "parent": "23",
            "clonemarker": false,
            "stateVariables": [],
            "unitsOfInformation": [],
            "bbox": {
                "x": 830,
                "y": 930,
                "w": 60,
                "h": 60
            }
        }
      },
      {
        "data": {
            "id": "glyph1",
            "class": "compartment",
            "label": "synaptic cleft",
            "parent": "",
            "clonemarker": false,
            "stateVariables": [],
            "unitsOfInformation": [],
            "bbox": {
                "x": 770.0489105995644,
                "y": 603.9053834474291,
                "w": 254.08954881649527,
                "h": 304.8762412720447
            }
        }
      }
    ];


    const result = convert.xml2js(input, {compact: true, spaces: 2, trim: true, nativeType: true });
    const res = nconvert([].concat(result.sbgn.map.glyph));

    expect(res.nodes.length).to.deep.equal(3);
    expect(res.nodes).to.deep.equal(output);
    expect(res.portIdMap.size).to.equal(0);
  });

});
