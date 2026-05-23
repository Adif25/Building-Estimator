'use strict';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const FALLBACK_PRICES = {
  '2x4_8ft':            4.38,
  '2x6_16ft':          20.38,
  '2x8_8ft':           13.58,
  '2x8_12ft':          17.98,
  '2x10_16ft':         28.00,
  '4x4_8ft_pt':        10.28,
  '5_4x6_16ft':        10.70,
  'concrete_80lb':      5.98,
  'concrete_60lb':      4.48,
  'osb_4x8':            8.48,
  'joist_hanger_2x8':   1.30,
  'post_base_4x4':      6.50,
  'deck_screws_5lb':   29.45,
  'cedar_picket_6ft':   2.08,
  'cedar_picket_4ft':   1.50,
  'fence_nails_1lb':    3.50,
  'shingles_bundle':   39.48,
  'roofing_nails_1lb':  4.00,
  '2x6_10ft':          10.00,
  'ridge_board_2x8':   15.00,
};

const cache = new Map();

function get(searchQuery) {
  const entry = cache.get(searchQuery);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    cache.delete(searchQuery);
    return null;
  }
  return entry.price;
}

function set(searchQuery, price) {
  cache.set(searchQuery, { price, fetchedAt: Date.now() });
}

function getFallback(materialId) {
  return FALLBACK_PRICES[materialId] ?? null;
}

module.exports = { get, set, getFallback, FALLBACK_PRICES };
