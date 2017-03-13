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


describe('sbgnmlConverter', function () {
  it('should do something reasonable for garbage outputs', function () {
    // const garbage = ['', null, false, undefined, true, {'blah': 'blah'}, {}];
    //
    // garbage.map((g) => {
    //   expect(nconvert(g)).to.equal({});
    // });
  });

  it('should convert basic (non-compound) nodes', function () {
    const input = makeSbgnml(
      `
      <glyph id="10" class="macromolecule">
        <label text=" clone" />
        <bbox y="200" x="200" w="100" h="60" />
        <clone/>
      </glyph>
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

    const basic = convert.xml2js(input, {compact: true, spaces: 4, trim: true, nativeType: true });
    const res = nconvert([].concat(basic.sbgn.map.glyph));
    console.log(JSON.stringify(res, null, 4));
  });

  it('should convert compound nodes', function () {

  });

  it('should convert a node from sbgnml to a cytoscape.js compatible JSON', function () {
    // const i0 = makeSbgnml(
  //   `
  //   <glyph id="glyph8" class="source and sink">
  //     <bbox y="571.1691314755299" x="352.15049199906457" w="60.0" h="60.0" />
  //   </glyph>
  //   <glyph id="glyph8" class="source and sink">
  //     <bbox y="571.1691314755299" x="352.15049199906457" w="60.0" h="60.0" />
  //   </glyph>`
  //   );
   //
  //   const i1 = makeSbgnml(
  //  `<glyph id="glyph8" class="source and sink">
  //     <bbox y="571.1691314755299" x="352.15049199906457" w="60.0" h="60.0" />
  //   </glyph>
  //   <glyph id="glyph8" class="source and sink">
  //      <bbox y="571.1691314755299" x="352.15049199906457" w="60.0" h="60.0" />
  //   </glyph>`
  //   );
   //
  //   const i2 = makeSbgnml(
  //  `<glyph id="glyph8" class="source and sink">
  //     <bbox y="571.1691314755299" x="352.15049199906457" w="60.0" h="60.0" />
  //   </glyph>
  //   `
  //   );
  //   const i3 = makeSbgnml('');
  //   const output = {
  //     nodes: [
  //       {
  //           "data": {
  //               "sbgn": {
  //                   "id": "glyph8",
  //                   "bbox": {
  //                       "x": 382.15049199906457,
  //                       "y": 601.1691314755299,
  //                       "w": "60.0",
  //                       "h": "60.0"
  //                   },
  //                   "class": "source and sink",
  //                   "unitsOfInformation": [],
  //                   "stateVariables": [],
  //                   "parent": "",
  //                   "ports": []
  //               }
  //           }
  //       }
  //     ],
  //     edges: []
  //   };
  //   nconvert(i0);
    // convert(i1);
    // convert(i2);
    // convert(i3);
    // convert(i4);

    // expect(convert(input)).to.equal(output);

  });

});
