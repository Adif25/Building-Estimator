'use strict';

const deck = require('./deck');
const fence = require('./fence');
const shedFraming = require('./shedFraming');

const CALCULATORS = { deck, fence, shedFraming };

function calculate(projectType, dimensions, options) {
  const calc = CALCULATORS[projectType];
  if (!calc) throw new Error(`Unknown project type: ${projectType}`);
  return calc.calculate(dimensions, options);
}

module.exports = { calculate };
