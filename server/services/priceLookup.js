'use strict';

const https = require('https');
const priceCache = require('./priceCache');

const REQUEST_TIMEOUT_MS = 3000; // 3s per request — fall back fast if slow
const RETRY_DELAY_MS = 400;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: HEADERS }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) return fetchHtml(redirectUrl).then(resolve).catch(reject);
        return reject(new Error('Redirect with no location'));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    });
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.on('error', reject);
  });
}

// ── Bing Shopping ──────────────────────────────────────────────────────────

function parseBingShoppingPrices(html) {
  const prices = [];
  let searchFrom = 0;
  while (prices.length < 5) {
    const idx = html.indexOf('br-price">', searchFrom);
    if (idx === -1) break;
    const priceSnippet = html.substring(idx + 10, idx + 30);
    const priceMatch = priceSnippet.match(/\$([0-9]+(?:\.[0-9]{1,2})?)/);
    if (priceMatch) {
      prices.push(parseFloat(priceMatch[1]));
    }
    searchFrom = idx + 1;
  }
  return prices;
}

async function fetchBingPrice(searchQuery) {
  const url = `https://www.bing.com/shop/search?q=${encodeURIComponent(searchQuery)}&traffictype=1`;
  const html = await fetchHtml(url);
  const prices = parseBingShoppingPrices(html);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

// ── Home Depot ─────────────────────────────────────────────────────────────

function parseHomeDepotPrices(html) {
  // Try JSON-LD structured data first (most reliable)
  const ldMatches = html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
  for (const match of ldMatches) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type'] === 'ItemList' && Array.isArray(data.itemListElement)) {
        const prices = data.itemListElement
          .map((el) => el.item?.offers?.price ?? el.item?.offers?.lowPrice)
          .filter((p) => p != null && !isNaN(parseFloat(p)))
          .map((p) => parseFloat(p));
        if (prices.length > 0) return Math.min(...prices);
      }
      if (data['@type'] === 'Product' && data.offers?.price) {
        return parseFloat(data.offers.price);
      }
    } catch (_) {}
  }
  // Fallback: inline JSON price pattern
  const inlineMatch = html.match(/"price"\s*:\s*"?(\d+\.\d{2})"?/);
  if (inlineMatch) return parseFloat(inlineMatch[1]);
  return null;
}

async function fetchHomeDepotPrice(searchQuery) {
  const url = `https://www.homedepot.com/s/${encodeURIComponent(searchQuery)}`;
  const html = await fetchHtml(url);
  return parseHomeDepotPrices(html);
}

// ── Scrapling microservice (Python, port 5001) ─────────────────────────────

async function fetchScraplingPrice(searchQuery) {
  const url = `http://localhost:5001/price?q=${encodeURIComponent(searchQuery)}`;
  return new Promise((resolve, reject) => {
    const req = require('http').get(url, { timeout: 30000 }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          resolve(body.price != null && body.price > 0 ? body.price : null);
        } catch (_) { resolve(null); }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Scrapling timeout')); });
  });
}

// ── Live fetch: try both sources, take first valid price ───────────────────

async function fetchLivePrice(searchQuery) {
  // Race Bing and Home Depot — first valid price wins
  const trySource = async (fn) => {
    try {
      const price = await fn(searchQuery);
      return price !== null && price > 0 ? price : null;
    } catch (_) {
      return null;
    }
  };

  const price = await Promise.race([
    trySource(fetchBingPrice),
    trySource(fetchHomeDepotPrice),
  ]).catch(() => null);

  if (price !== null && price > 0) return price;

  // Single retry after a short pause (catches transient failures)
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  const retryPrice = await trySource(fetchBingPrice);
  if (retryPrice !== null) return retryPrice;

  // Last resort: Scrapling microservice (stealth browser via Python)
  return trySource(fetchScraplingPrice);
}

// ── Public API ──────────────────────────────────────────────────────────────

async function lookupPrice(materialId, searchQuery) {
  // Return immediately if cached
  const cached = priceCache.get(searchQuery);
  if (cached !== null) {
    return { price: cached, source: 'cached' };
  }

  // Race the entire live-fetch chain against a hard timeout
  const timeoutFallback = new Promise((resolve) =>
    setTimeout(() => resolve(null), REQUEST_TIMEOUT_MS)
  );

  const price = await Promise.race([fetchLivePrice(searchQuery), timeoutFallback]);

  if (price !== null && price > 0) {
    priceCache.set(searchQuery, price);
    return { price, source: 'live' };
  }

  const fallback = priceCache.getFallback(materialId);
  if (fallback !== null) {
    return { price: fallback, source: 'fallback' };
  }

  return { price: null, source: 'unavailable' };
}

module.exports = { lookupPrice };
