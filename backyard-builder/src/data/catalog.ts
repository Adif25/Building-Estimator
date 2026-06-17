import type { Material } from '../types';

/**
 * Seed price catalog — v1 MVP source of truth for pricing.
 *
 * Prices are "real-ish" USD values lifted from the prior estimator's fallback
 * prices (deck/fence) plus common retail rates for hardscape/softscape. They are
 * meant to be edited periodically by hand.
 *
 * SEAM: this is the single place pricing comes from. A future live-pricing
 * service can hydrate `unitPrice` here without any other code changing.
 */
export const CATALOG: Material[] = [
  // ── Lumber & deck framing (ported from deck.js / fence.js fallbacks) ──────
  { id: 'deck_board_5_4x6_16', name: 'Decking Board 5/4×6 ×16ft (PT)', category: 'Lumber', unit: 'board', unitPrice: 10.70 },
  { id: 'joist_2x8_8', name: 'Joist 2×8 ×8ft', category: 'Lumber', unit: 'board', unitPrice: 13.58 },
  { id: 'joist_2x8_16', name: 'Joist 2×8 ×16ft', category: 'Lumber', unit: 'board', unitPrice: 17.98 },
  { id: 'beam_2x10_16', name: 'Beam 2×10 ×16ft', category: 'Lumber', unit: 'board', unitPrice: 28.00 },
  { id: 'post_4x4_8_pt', name: '4×4 ×8ft Ground-Contact Post', category: 'Lumber', unit: 'post', unitPrice: 10.28 },
  { id: 'rail_2x4_8', name: '2×4 ×8ft Rail', category: 'Lumber', unit: 'board', unitPrice: 4.38 },
  { id: 'cedar_picket_4', name: 'Cedar Dog-Ear Picket 4ft', category: 'Lumber', unit: 'picket', unitPrice: 1.50 },
  { id: 'cedar_picket_6', name: 'Cedar Dog-Ear Picket 6ft', category: 'Lumber', unit: 'picket', unitPrice: 2.08 },

  // ── Hardware & fasteners ─────────────────────────────────────────────────
  { id: 'post_base_4x4', name: '4×4 Post Base Anchor', category: 'Hardware', unit: 'each', unitPrice: 6.50 },
  { id: 'joist_hanger_2x8', name: '2×8 Joist Hanger', category: 'Hardware', unit: 'each', unitPrice: 1.30 },
  { id: 'deck_screws_5lb', name: 'Deck Screws 3" (5lb box)', category: 'Hardware', unit: 'box', unitPrice: 29.45 },
  { id: 'fence_nails_1lb', name: 'Galvanized Fence Nails 8d (1lb box)', category: 'Hardware', unit: 'box', unitPrice: 3.50 },

  // ── Concrete & base ──────────────────────────────────────────────────────
  { id: 'concrete_80lb', name: 'Concrete Mix 80lb Bag', category: 'Concrete', unit: 'bag', unitPrice: 5.98 },
  { id: 'paver_base_50lb', name: 'Paver Base Gravel 50lb Bag', category: 'Concrete', unit: 'bag', unitPrice: 5.45 },
  { id: 'paver_sand_0_5cf', name: 'Paver Leveling Sand 0.5cu ft Bag', category: 'Concrete', unit: 'bag', unitPrice: 6.98 },

  // ── Hardscape (sold per sq ft of coverage) ───────────────────────────────
  { id: 'concrete_patio_sqft', name: 'Poured Concrete Patio', category: 'Hardscape', unit: 'sqft', unitPrice: 6.50 },
  { id: 'paver_sqft', name: 'Concrete Paver', category: 'Hardscape', unit: 'sqft', unitPrice: 4.25 },

  // ── Softscape ────────────────────────────────────────────────────────────
  { id: 'sod_sqft', name: 'Sod / Turf', category: 'Softscape', unit: 'sqft', unitPrice: 0.55 },
  { id: 'mulch_2cf', name: 'Mulch 2cu ft Bag', category: 'Softscape', unit: 'bag', unitPrice: 4.25 },
  { id: 'shrub_3gal', name: 'Shrub / Plant (3gal)', category: 'Softscape', unit: 'each', unitPrice: 24.00 },
];

const BY_ID = new Map(CATALOG.map((m) => [m.id, m]));

/** Look up a material by id. Throws on unknown id so estimator bugs surface loudly. */
export function material(id: string): Material {
  const m = BY_ID.get(id);
  if (!m) throw new Error(`Unknown material id: ${id}`);
  return m;
}
