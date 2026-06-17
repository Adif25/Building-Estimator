import type { Element, LineItem } from '../types';
import { lineItem } from './lineItem';

const sqft = (el: Element) => el.lengthFt * el.widthFt;

/** Poured concrete patio: per-sqft slab + gravel base (1 bag covers ~4 sqft). */
export function estimatePatio(el: Element): LineItem[] {
  const area = sqft(el);
  return [
    lineItem('concrete_patio_sqft', area),
    lineItem('paver_base_50lb', area / 4),
  ];
}

/** Paver path/area: pavers per sqft + base gravel + leveling sand. */
export function estimatePavers(el: Element): LineItem[] {
  const area = sqft(el);
  return [
    lineItem('paver_sqft', area),
    lineItem('paver_base_50lb', area / 4), // ~4 sqft per 50lb bag at 2" depth
    lineItem('paver_sand_0_5cf', area / 12), // ~12 sqft per bag at 1" depth
  ];
}

/** Sod/turf: priced straight per sqft. */
export function estimateGrass(el: Element): LineItem[] {
  return [lineItem('sod_sqft', sqft(el))];
}

/** Plant bed: mulch coverage + shrubs by configured density. */
export function estimatePlantBed(el: Element): LineItem[] {
  const area = sqft(el);
  const per100 = Number(el.options.plantsPer100Sqft ?? 6);
  const shrubs = (area / 100) * per100;
  return [
    lineItem('mulch_2cf', area / 12), // 2cu ft bag covers ~12 sqft at 2" depth
    lineItem('shrub_3gal', shrubs),
  ];
}
