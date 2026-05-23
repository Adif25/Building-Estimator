'use strict';

const https = require('https');
const priceCache = require('./priceCache');

const REQUEST_TIMEOUT_MS = 10000;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
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

async function lookupPrice(materialId, searchQuery) {
  const cached = priceCache.get(searchQuery);
  if (cached !== null) {
    return { price: cached, source: 'cached' };
  }

  try {
    const price = await fetchBingPrice(searchQuery);
    if (price !== null && price > 0) {
      priceCache.set(searchQuery, price);
      return { price, source: 'live' };
    }
  } catch (_err) {
    // fall through to fallback
  }

  const fallback = priceCache.getFallback(materialId);
  if (fallback !== null) {
    return { price: fallback, source: 'fallback' };
  }

  return { price: null, source: 'unavailable' };
}

module.exports = { lookupPrice };
