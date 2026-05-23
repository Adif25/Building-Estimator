'use strict';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Start the Express app on a random port for isolation
let server;
let baseUrl;

before(async () => {
  // Patch priceLookup to return instant fallback prices so tests don't hit Bing
  const priceLookup = require('../server/services/priceLookup');
  const priceCache = require('../server/services/priceCache');
  priceLookup.lookupPrice = async (materialId) => {
    const price = priceCache.getFallback(materialId) ?? 5.00;
    return { price, source: 'fallback' };
  };

  const app = require('../server/index');
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;
});

after(() => {
  server?.close();
});

// ─── Helpers ───────────────────────────────────────────────────────────────

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(path, baseUrl);
    const req = http.request(
      { hostname: url.hostname, port: url.port, path: url.pathname, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString()) }); }
          catch { resolve({ status: res.statusCode, body: {} }); }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ─── Successful estimates ───────────────────────────────────────────────────

describe('POST /api/estimate — success cases', () => {
  test('deck estimate returns valid structure', async () => {
    const { status, body } = await post('/api/estimate', {
      projectType: 'deck',
      dimensions: { length: 16, width: 12 },
      options: { deckingMaterial: 'pressure-treated' },
    });
    assert.equal(status, 200);
    assert.equal(body.projectType, 'deck');
    assert.ok(Array.isArray(body.materials));
    assert.ok(body.materials.length > 0);
    assert.ok(typeof body.subtotal === 'number');
    assert.ok(typeof body.contingency === 'number');
    assert.ok(typeof body.total === 'number');
    assert.ok(body.total > 0);
    assert.ok(body.timestamp);
  });

  test('fence estimate returns valid structure', async () => {
    const { status, body } = await post('/api/estimate', {
      projectType: 'fence',
      dimensions: { length: 100, height: 6 },
      options: { fenceStyle: 'privacy' },
    });
    assert.equal(status, 200);
    assert.equal(body.projectType, 'fence');
    assert.ok(body.materials.length > 0);
    assert.ok(body.total > 0);
  });

  test('shedFraming estimate returns valid structure', async () => {
    const { status, body } = await post('/api/estimate', {
      projectType: 'shedFraming',
      dimensions: { length: 12, width: 10, height: 8 },
      options: { roofPitch: '4:12' },
    });
    assert.equal(status, 200);
    assert.equal(body.projectType, 'shedFraming');
    assert.ok(body.materials.length > 0);
    assert.ok(body.total > 0);
  });

  test('each material item has required fields', async () => {
    const { body } = await post('/api/estimate', {
      projectType: 'deck',
      dimensions: { length: 12, width: 10 },
    });
    for (const item of body.materials) {
      assert.ok(typeof item.name === 'string', 'name must be a string');
      assert.ok(typeof item.quantity === 'number', 'quantity must be a number');
      assert.ok(typeof item.unit === 'string', 'unit must be a string');
      assert.ok(['live', 'cached', 'fallback', 'unavailable'].includes(item.priceSource), `unexpected source: ${item.priceSource}`);
    }
  });

  test('contingency is 10% of subtotal', async () => {
    const { body } = await post('/api/estimate', {
      projectType: 'fence',
      dimensions: { length: 50, height: 6 },
    });
    const expected = Math.round(body.subtotal * 0.10 * 100) / 100;
    assert.equal(body.contingency, expected);
  });

  test('total equals subtotal + contingency', async () => {
    const { body } = await post('/api/estimate', {
      projectType: 'deck',
      dimensions: { length: 16, width: 12 },
    });
    const expected = Math.round((body.subtotal + body.contingency) * 100) / 100;
    assert.equal(body.total, expected);
  });

  test('options defaults work when options is omitted', async () => {
    const { status, body } = await post('/api/estimate', {
      projectType: 'deck',
      dimensions: { length: 10, width: 10 },
    });
    assert.equal(status, 200);
    assert.ok(body.total > 0);
  });
});

// ─── Validation errors ──────────────────────────────────────────────────────

describe('POST /api/estimate — validation', () => {
  test('missing projectType returns 400', async () => {
    const { status, body } = await post('/api/estimate', {
      dimensions: { length: 16, width: 12 },
    });
    assert.equal(status, 400);
    assert.ok(body.error);
  });

  test('invalid projectType returns 400', async () => {
    const { status, body } = await post('/api/estimate', {
      projectType: 'treehouse',
      dimensions: { length: 10, width: 10 },
    });
    assert.equal(status, 400);
    assert.ok(body.error);
  });

  test('missing dimensions returns 400', async () => {
    const { status } = await post('/api/estimate', { projectType: 'deck' });
    assert.equal(status, 400);
  });

  test('zero length returns 400', async () => {
    const { status } = await post('/api/estimate', {
      projectType: 'deck',
      dimensions: { length: 0, width: 12 },
    });
    assert.equal(status, 400);
  });

  test('negative length returns 400', async () => {
    const { status } = await post('/api/estimate', {
      projectType: 'deck',
      dimensions: { length: -5, width: 12 },
    });
    assert.equal(status, 400);
  });

  test('length over 500 returns 400', async () => {
    const { status } = await post('/api/estimate', {
      projectType: 'deck',
      dimensions: { length: 999, width: 12 },
    });
    assert.equal(status, 400);
  });

  test('missing width for deck returns 400', async () => {
    const { status } = await post('/api/estimate', {
      projectType: 'deck',
      dimensions: { length: 16 },
    });
    assert.equal(status, 400);
  });

  test('missing height for fence returns 400', async () => {
    const { status } = await post('/api/estimate', {
      projectType: 'fence',
      dimensions: { length: 100 },
    });
    assert.equal(status, 400);
  });
});
