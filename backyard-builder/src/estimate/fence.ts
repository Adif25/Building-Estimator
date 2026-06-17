import type { Element, LineItem } from '../types';
import { lineItem } from './lineItem';

/**
 * Fence bill-of-materials. Ported from the prior Express estimator (fence.js):
 * posts every 8ft + 2 concrete bags/post, 2–3 rails/section, cedar pickets at
 * privacy (tight) or open spacing, plus nails.
 */
export function estimateFence(el: Element): LineItem[] {
  const length = el.lengthFt;
  const height = Number(el.options.fenceHeightFt ?? 6);
  const style = String(el.options.fenceStyle ?? 'privacy');

  const postSpacing = 8;
  const sections = Math.ceil(length / postSpacing);
  const postCount = sections + 1;
  const concreteBags = postCount * 2;

  const railsPerSection = height <= 4 ? 2 : 3;
  const railCount = sections * railsPerSection;

  const picketHeightFt = height <= 4 ? 4 : 6;
  const picketSpacingIn = style === 'privacy' ? 5.5 : 4.5; // tight vs open
  const picketsNeeded = Math.ceil((length * 12) / picketSpacingIn);

  const nailBoxes = Math.ceil(picketsNeeded / 50);

  return [
    lineItem('post_4x4_8_pt', postCount),
    lineItem('concrete_80lb', concreteBags),
    lineItem('rail_2x4_8', railCount, '2×4 ×8ft Rails'),
    lineItem(picketHeightFt === 6 ? 'cedar_picket_6' : 'cedar_picket_4', picketsNeeded),
    lineItem('fence_nails_1lb', nailBoxes),
  ];
}
