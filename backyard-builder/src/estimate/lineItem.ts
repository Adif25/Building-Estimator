import { material } from '../data/catalog';
import type { LineItem } from '../types';

/** Build a priced line item from a catalog material id + quantity. */
export function lineItem(materialId: string, quantity: number, nameOverride?: string): LineItem {
  const m = material(materialId);
  const qty = Math.max(0, Math.ceil(quantity));
  return {
    materialId,
    name: nameOverride ?? m.name,
    unit: m.unit,
    quantity: qty,
    unitPrice: m.unitPrice,
    lineTotal: +(qty * m.unitPrice).toFixed(2),
  };
}
