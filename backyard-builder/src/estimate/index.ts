import type { Element, ElementEstimate, LineItem } from '../types';
import { estimateDeck } from './deck';
import { estimateFence } from './fence';
import { estimatePatio, estimatePavers, estimateGrass, estimatePlantBed } from './area';

type Estimator = (el: Element) => LineItem[];

/**
 * Registry mapping element type → estimator. Adding a new buildable element is
 * just: a catalog entry + an element-type config + one estimator registered here.
 */
const ESTIMATORS: Record<Element['type'], Estimator> = {
  deck: estimateDeck,
  fence: estimateFence,
  patio: estimatePatio,
  pavers: estimatePavers,
  grass: estimateGrass,
  plant: estimatePlantBed,
};

/** Estimate one element. */
export function estimateElement(el: Element): ElementEstimate {
  const items = ESTIMATORS[el.type](el).filter((i) => i.quantity > 0);
  const subtotal = +items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2);
  return { elementId: el.id, type: el.type, items, subtotal };
}

/** Estimate every element on the canvas. */
export function estimateAll(elements: Element[]): {
  perElement: ElementEstimate[];
  total: number;
} {
  const perElement = elements.map(estimateElement);
  const total = +perElement.reduce((sum, e) => sum + e.subtotal, 0).toFixed(2);
  return { perElement, total };
}
