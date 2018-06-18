const fs = require('fs');

// const fileContentStr = (fname) => {
//
// }
//
const input = [
  '/input/atm_mediated_phosphorylation_of_repair_proteins.xml',
  '/input/activated_stat1alpha_induction_of_the_irf1_gene.xml',
  '/input/CaM-CaMK_dependent_signaling_to_the_nucleus.xml',
  '/input/glycolysis.xml',
  '/input/insulin-like_growth_factor_signaling.xml',
  '/input/mapk_cascade.xml',
  '/input/neuronal_muscle_signalling.xml',
  '/input/polyq_proteins_interference.xml',
  '/input/vitamins_b6_activation_to_pyridoxal_phosphate.xml',


  '/input/small.xml',
  '/input/complex_multimer.xml',

  '/input/p53-Dependent_G1_DNA.sbgn.xml',
  '/input/pc_signallingByBMP.sbgn.xml',
  '/input/TP53_regulates_trans.sbgn.xml',

  '/input/single_root_node.xml'
].map(function (fname) {
  return fs.readFileSync(__dirname + fname, 'utf8');
});

const output = [
  require('./output/atm_mediated_phosphorylation_of_repair_proteins.json'),
  require('./output/activated_stat1alpha_induction_of_the_irf1_gene.json'),
  require('./output/CaM-CaMK_dependent_signaling_to_the_nucleus.json'),
  require('./output/glycolysis.json'),
  require('./output/insulin-like_growth_factor_signaling.json'),
  require('./output/mapk_cascade.json'),
  require('./output/neuronal_muscle_signalling.json'),
  require('./output/polyq_proteins_interference.json'),
  require('./output/vitamins_b6_activation_to_pyridoxal_phosphate.json'),


  require('./output/small.json'),
  require('./output/complex_multimer.json'),

  require('./output/p53-Dependent_G1_DNA.sbgn.json'),
  require('./output/pc_signallingByBMP.sbgn.json'),
  require('./output/TP53_regulates_trans.sbgn.json'),

  require('./output/single_root_node.json')
];

module.exports = {
  input: input,
  output: output
};
