// ── Core data model ──────────────────────────────────────────────────────────

/** What kind of thing a user can place on the yard. */
export type ElementType =
  | 'deck'
  | 'patio'
  | 'pavers'
  | 'grass'
  | 'fence'
  | 'plant';

/**
 * How an element is shaped/measured on the canvas:
 *  - area:   a rectangle measured by length × width (deck, patio, pavers, grass)
 *  - linear: a run measured by length only, with a separate height option (fence)
 *  - point:  a fixed-footprint object placed by count (plant/shrub/tree)
 */
export type Geometry = 'area' | 'linear' | 'point';

/** A material in the seed price catalog. Prices are editable, USD per `unit`. */
export interface Material {
  id: string;
  name: string;
  category: string;
  unit: string; // 'board' | 'bag' | 'sqft' | 'each' | ...
  unitPrice: number;
}

/**
 * A single placed element on the canvas.
 * All spatial values are in FEET (the canvas converts feet ↔ pixels for display).
 */
export interface Element {
  id: string;
  type: ElementType;
  x: number; // feet from left edge of yard
  y: number; // feet from top edge of yard
  lengthFt: number; // primary dimension (run for linear, longer side for area)
  widthFt: number; // secondary dimension (ignored for linear/point)
  /** Free-form per-type options (deckingMaterial, fenceStyle, fenceHeightFt, …). */
  options: Record<string, string | number>;
}

/** One row in the itemized estimate, produced by an estimator. */
export interface LineItem {
  materialId: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

/** Estimate for a single placed element. */
export interface ElementEstimate {
  elementId: string;
  type: ElementType;
  items: LineItem[];
  subtotal: number;
}
