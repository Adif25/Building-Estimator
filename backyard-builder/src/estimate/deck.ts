import type { Element, LineItem } from '../types';
import { lineItem } from './lineItem';

/**
 * Deck bill-of-materials. Ported from the prior Express estimator (deck.js):
 * 5/4×6 decking @ 10% waste, 2×8 joists at 16" OC + rim, doubled 2×10 beam,
 * 4×4 posts every 8ft (two rows), 2 concrete bags/post, hangers + screws.
 */
export function estimateDeck(el: Element): LineItem[] {
  const length = el.lengthFt;
  const width = el.widthFt;
  const material = String(el.options.deckingMaterial ?? 'pressure-treated');

  const boardLength = 16;
  const boardWidthIn = 5.5; // actual width of 5/4×6

  // Decking boards (5/4×6 ×16ft) with 10% waste
  const rowsNeeded = Math.ceil((width * 12) / boardWidthIn);
  const deckingBoards = Math.ceil(rowsNeeded * Math.ceil(length / boardLength) * 1.1);

  // Joists (2×8) at 16" OC + 2 rim joists
  const joistCount = Math.ceil(length / (16 / 12)) + 2;
  const joistMaterial = width <= 8 ? 'joist_2x8_8' : 'joist_2x8_16';

  // Ledger board (2×8 spanning the width)
  const ledgerCount = Math.ceil(width / 16);

  // Beam (doubled 2×10)
  const beamCount = Math.ceil(length / 16) * 2;

  // Posts (4×4 PT) — every 8ft along length, front and back rows
  const postCount = (Math.ceil(length / 8) + 1) * 2;

  const concreteBags = postCount * 2;
  const joistHangers = joistCount * 2;
  const screwBoxes = Math.ceil((deckingBoards * boardLength) / 250);

  const deckingName =
    material === 'composite'
      ? 'Composite Decking Board ×16ft'
      : material === 'cedar'
        ? 'Cedar Decking Board 5/4×6 ×16ft'
        : undefined;

  return [
    lineItem('deck_board_5_4x6_16', deckingBoards, deckingName),
    lineItem(joistMaterial, joistCount, 'Floor Joists 2×8'),
    lineItem(joistMaterial, ledgerCount, 'Ledger Board 2×8'),
    lineItem('beam_2x10_16', beamCount),
    lineItem('post_4x4_8_pt', postCount),
    lineItem('post_base_4x4', postCount),
    lineItem('concrete_80lb', concreteBags),
    lineItem('joist_hanger_2x8', joistHangers),
    lineItem('deck_screws_5lb', screwBoxes),
  ];
}
