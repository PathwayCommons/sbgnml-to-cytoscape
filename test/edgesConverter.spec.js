/* global describe, it */
const econvert = require('../src/edgesConverter');
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
describe('edgesConverter', function () {
  it('should convert edges', function () {
    const input = makeSbgnml(
      `
      <arc id="glyph21-13" target="glyph13" source="glyph21" class="consumption">
         <start y="347.8180972732039" x="863.0538165387796" />
         <end y="295.62165823750354" x="847.6106014608313" />
      </arc>
      `
    );

    const output = [{
      data: {
        id: 'glyph21-13',
        'class': 'consumption',
        'source': 'glyph21',
        'target': 'glyph13',
        'cardinality': 0
      }
    }];
    const js = convert.xml2js(input, {compact: true, spaces: 2, trim: true, nativeType: true });
    const res = econvert([].concat(js.sbgn.map.arc), new Set(['glyph21', 'glyph13']), new Map());

    expect(res).to.deep.equal(output);
  });

  it('should filter edges without a source or target node in the node id set', function () {
    const input = makeSbgnml(
      `
      <arc target="glyph13" source="glyph21" class="consumption">
         <start y="347.8180972732039" x="863.0538165387796" />
         <end y="295.62165823750354" x="847.6106014608313" />
      </arc>
      `
    );

    const output = [];
    const js = convert.xml2js(input, {compact: true, spaces: 2, trim: true, nativeType: true });
    const res = econvert([].concat(js.sbgn.map.arc), new Set(), new Map());

    expect(res).to.deep.equal(output);
  });

});
