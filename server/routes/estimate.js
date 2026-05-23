'use strict';

const express = require('express');
const router = express.Router();
const calculators = require('../calculators');
const { lookupPrice } = require('../services/priceLookup');

const VALID_TYPES = ['deck', 'fence', 'shedFraming'];
const STAGGER_MS = 300;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateRequest(body) {
  const { projectType, dimensions } = body;
  if (!VALID_TYPES.includes(projectType)) {
    return `projectType must be one of: ${VALID_TYPES.join(', ')}`;
  }
  if (!dimensions || typeof dimensions !== 'object') {
    return 'dimensions object is required';
  }
  const { length, width, height } = dimensions;
  if (!length || length <= 0 || length > 500) {
    return 'dimensions.length must be between 1 and 500 feet';
  }
  if (projectType !== 'fence' && (!width || width <= 0 || width > 500)) {
    return 'dimensions.width must be between 1 and 500 feet';
  }
  if ((projectType === 'fence' || projectType === 'shedFraming') && (!height || height <= 0 || height > 100)) {
    return 'dimensions.height must be between 1 and 100 feet';
  }
  return null;
}

router.post('/estimate', async (req, res) => {
  const validationError = validateRequest(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { projectType, dimensions, options = {} } = req.body;

  let materials;
  try {
    materials = calculators.calculate(projectType, dimensions, options);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  // Deduplicate by searchQuery to avoid re-fetching the same item
  const seenQueries = new Map();
  for (const item of materials) {
    if (!seenQueries.has(item.searchQuery)) {
      seenQueries.set(item.searchQuery, null);
    }
  }

  // Fetch prices with stagger
  let i = 0;
  for (const [query, ] of seenQueries) {
    if (i > 0) await sleep(STAGGER_MS);
    const item = materials.find((m) => m.searchQuery === query);
    const result = await lookupPrice(item.id, query);
    seenQueries.set(query, result);
    i++;
  }

  // Attach prices to each material item
  let subtotal = 0;
  const priced = materials.map((item) => {
    const result = seenQueries.get(item.searchQuery);
    const unitPrice = result ? result.price : null;
    const totalPrice = unitPrice !== null ? Math.round(unitPrice * item.quantity * 100) / 100 : null;
    if (totalPrice !== null) subtotal += totalPrice;
    return {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice,
      totalPrice,
      priceSource: result ? result.source : 'unavailable',
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  const contingency = Math.round(subtotal * 0.10 * 100) / 100;
  const total = Math.round((subtotal + contingency) * 100) / 100;

  res.json({
    projectType,
    dimensions,
    options,
    materials: priced,
    subtotal,
    contingency,
    total,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
