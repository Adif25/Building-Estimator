'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const deck = require('../server/calculators/deck');
const fence = require('../server/calculators/fence');
const shedFraming = require('../server/calculators/shedFraming');

// ─── Helpers ───────────────────────────────────────────────────────────────

function findItem(materials, namePart) {
  return materials.find((m) => m.name.toLowerCase().includes(namePart.toLowerCase()));
}

function assertMaterialItem(item, namePart) {
  assert.ok(item, `Expected a material containing "${namePart}" but none was found`);
  assert.ok(item.id, 'Material must have an id');
  assert.ok(item.searchQuery, 'Material must have a searchQuery');
  assert.ok(item.quantity > 0, `Quantity for "${item.name}" must be > 0`);
  assert.ok(item.fallbackPrice > 0, `Fallback price for "${item.name}" must be > 0`);
}

// ─── Deck ──────────────────────────────────────────────────────────────────

describe('deck calculator', () => {
  const dims = { length: 16, width: 12 };

  test('returns an array of material items', () => {
    const result = deck.calculate(dims);
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0);
  });

  test('each item has required fields', () => {
    const result = deck.calculate(dims);
    for (const item of result) {
      assertMaterialItem(item, item.name);
    }
  });

  test('includes decking boards', () => {
    const result = deck.calculate(dims);
    const item = findItem(result, 'decking');
    assertMaterialItem(item, 'decking');
  });

  test('includes concrete bags', () => {
    const result = deck.calculate(dims);
    const item = findItem(result, 'concrete');
    assertMaterialItem(item, 'concrete');
  });

  test('includes posts', () => {
    const result = deck.calculate(dims);
    const item = findItem(result, 'post');
    assertMaterialItem(item, 'post');
  });

  test('wider deck needs more decking boards than narrower deck', () => {
    const narrow = deck.calculate({ length: 16, width: 8 });
    const wide = deck.calculate({ length: 16, width: 16 });
    const narrowBoards = findItem(narrow, 'decking').quantity;
    const wideBoards = findItem(wide, 'decking').quantity;
    assert.ok(wideBoards > narrowBoards, `Wide deck (${wideBoards}) should need more boards than narrow (${narrowBoards})`);
  });

  test('longer deck needs more posts', () => {
    const short = deck.calculate({ length: 8, width: 10 });
    const long = deck.calculate({ length: 24, width: 10 });
    const shortPosts = findItem(short, '4×4').quantity;
    const longPosts = findItem(long, '4×4').quantity;
    assert.ok(longPosts > shortPosts, `Longer deck (${longPosts}) should need more posts than shorter (${shortPosts})`);
  });

  test('composite material changes search query', () => {
    const pt = deck.calculate(dims, { deckingMaterial: 'pressure-treated' });
    const comp = deck.calculate(dims, { deckingMaterial: 'composite' });
    const ptBoards = findItem(pt, 'decking');
    const compBoards = findItem(comp, 'decking');
    assert.notEqual(ptBoards.searchQuery, compBoards.searchQuery);
    assert.ok(compBoards.searchQuery.toLowerCase().includes('composite'));
  });
});

// ─── Fence ─────────────────────────────────────────────────────────────────

describe('fence calculator', () => {
  const dims = { length: 100, height: 6 };

  test('returns an array of material items', () => {
    const result = fence.calculate(dims);
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0);
  });

  test('each item has required fields', () => {
    const result = fence.calculate(dims);
    for (const item of result) {
      assertMaterialItem(item, item.name);
    }
  });

  test('includes posts, rails, pickets, and concrete', () => {
    const result = fence.calculate(dims);
    assertMaterialItem(findItem(result, 'post'), 'post');
    assertMaterialItem(findItem(result, 'rail'), 'rail');
    assertMaterialItem(findItem(result, 'picket'), 'picket');
    assertMaterialItem(findItem(result, 'concrete'), 'concrete');
  });

  test('longer fence needs more posts', () => {
    const short = fence.calculate({ length: 50, height: 6 });
    const long = fence.calculate({ length: 200, height: 6 });
    const shortPosts = findItem(short, 'post').quantity;
    const longPosts = findItem(long, 'post').quantity;
    assert.ok(longPosts > shortPosts);
  });

  test('longer fence needs more pickets', () => {
    const short = fence.calculate({ length: 50, height: 6 });
    const long = fence.calculate({ length: 200, height: 6 });
    const shortPickets = findItem(short, 'picket').quantity;
    const longPickets = findItem(long, 'picket').quantity;
    assert.ok(longPickets > shortPickets);
  });

  test('6ft fence uses 3 rails per section', () => {
    const result6 = fence.calculate({ length: 8, height: 6 });
    const result4 = fence.calculate({ length: 8, height: 4 });
    const rails6 = findItem(result6, 'rail').quantity;
    const rails4 = findItem(result4, 'rail').quantity;
    assert.ok(rails6 > rails4, `6ft fence (${rails6} rails) should use more rails than 4ft fence (${rails4} rails)`);
  });

  test('concrete bags equal 2x post count', () => {
    const result = fence.calculate({ length: 80, height: 6 });
    const posts = findItem(result, 'post').quantity;
    const concrete = findItem(result, 'concrete').quantity;
    assert.equal(concrete, posts * 2);
  });

  test('4ft fence uses 4ft pickets in search query', () => {
    const result = fence.calculate({ length: 50, height: 4 });
    const pickets = findItem(result, 'picket');
    assert.ok(pickets.searchQuery.includes('4ft'));
  });
});

// ─── Shed Framing ──────────────────────────────────────────────────────────

describe('shedFraming calculator', () => {
  const dims = { length: 12, width: 10, height: 8 };

  test('returns an array of material items', () => {
    const result = shedFraming.calculate(dims);
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0);
  });

  test('each item has required fields', () => {
    const result = shedFraming.calculate(dims);
    for (const item of result) {
      assertMaterialItem(item, item.name);
    }
  });

  test('includes studs, OSB, rafters, and shingles', () => {
    const result = shedFraming.calculate(dims);
    assertMaterialItem(findItem(result, 'stud'), 'stud');
    assertMaterialItem(findItem(result, 'osb'), 'osb');
    assertMaterialItem(findItem(result, 'rafter'), 'rafter');
    assertMaterialItem(findItem(result, 'shingle'), 'shingle');
  });

  test('larger shed needs more studs', () => {
    const small = shedFraming.calculate({ length: 8, width: 8, height: 7 });
    const large = shedFraming.calculate({ length: 16, width: 12, height: 8 });
    const smallStuds = findItem(small, 'stud').quantity;
    const largeStuds = findItem(large, 'stud').quantity;
    assert.ok(largeStuds > smallStuds, `Large shed (${largeStuds}) should need more studs than small (${smallStuds})`);
  });

  test('larger shed needs more shingles', () => {
    const small = shedFraming.calculate({ length: 8, width: 8, height: 7 });
    const large = shedFraming.calculate({ length: 20, width: 16, height: 8 });
    const smallShingles = findItem(small, 'shingle').quantity;
    const largeShingles = findItem(large, 'shingle').quantity;
    assert.ok(largeShingles > smallShingles);
  });

  test('steeper roof pitch produces longer rafters', () => {
    const low = shedFraming.calculate(dims, { roofPitch: '4:12' });
    const high = shedFraming.calculate(dims, { roofPitch: '6:12' });
    const lowRafter = findItem(low, 'rafter');
    const highRafter = findItem(high, 'rafter');
    // steeper pitch = longer run = equal or longer rafter length in search query
    assert.ok(
      parseInt(highRafter.searchQuery) >= parseInt(lowRafter.searchQuery),
      'Steeper pitch should not produce shorter rafter length'
    );
  });
});
