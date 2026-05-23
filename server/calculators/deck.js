'use strict';

function calculate(dimensions, options = {}) {
  const { length, width } = dimensions;
  const material = options.deckingMaterial || 'pressure-treated';

  const boardLength = 16;
  const boardWidthIn = 5.5; // actual width of 5/4x6 in inches

  // Decking boards (5/4x6 x 16ft)
  const rowsNeeded = Math.ceil((width * 12) / boardWidthIn);
  const deckingBoards = Math.ceil(rowsNeeded * Math.ceil(length / boardLength) * 1.1); // 10% waste
  const deckingQuery = material === 'composite'
    ? 'composite deck board 16ft'
    : material === 'cedar'
      ? 'cedar deck board 5/4x6 16ft'
      : '5/4 x 6 pressure treated deck board 16ft';

  // Joists (2x8) at 16" OC + 2 rim joists
  const joistCount = Math.ceil((length / (16 / 12))) + 2;
  const joistLen = width <= 8 ? 8 : width <= 12 ? 12 : 16;

  // Ledger board (1 x 2x8 the width of deck)
  const ledgerCount = Math.ceil(width / 16);

  // Beam (doubled 2x10)
  const beamCount = Math.ceil(length / 16) * 2;

  // Posts (4x4 PT) — every 8ft along length, front and back rows
  const postCount = (Math.ceil(length / 8) + 1) * 2;

  // Concrete bags (2 per post)
  const concreteBags = postCount * 2;

  // Joist hangers (each end of each joist)
  const joistHangers = joistCount * 2;

  // Post base hardware
  const postBases = postCount;

  // Deck screws (5lb box covers ~250 linear ft of decking)
  const totalDeckinLF = deckingBoards * boardLength;
  const screwBoxes = Math.ceil(totalDeckinLF / 250);

  return [
    {
      id: '5_4x6_16ft',
      name: `Decking Boards 5/4×6 ×16ft (${material})`,
      searchQuery: deckingQuery,
      quantity: deckingBoards,
      unit: 'board',
      fallbackPrice: 10.70,
    },
    {
      id: '2x8_8ft',
      name: `Floor Joists 2×8 ×${joistLen}ft`,
      searchQuery: `2x8 ${joistLen}ft lumber joist`,
      quantity: joistCount,
      unit: 'board',
      fallbackPrice: joistLen <= 8 ? 13.58 : 17.98,
    },
    {
      id: '2x8_8ft',
      name: 'Ledger Board 2×8',
      searchQuery: `2x8 ${joistLen}ft lumber`,
      quantity: ledgerCount,
      unit: 'board',
      fallbackPrice: 13.58,
    },
    {
      id: '2x10_16ft',
      name: 'Beam Boards 2×10 ×16ft (doubled)',
      searchQuery: '2x10 16ft lumber beam',
      quantity: beamCount,
      unit: 'board',
      fallbackPrice: 28.00,
    },
    {
      id: '4x4_8ft_pt',
      name: '4×4 ×8ft Ground Contact Posts',
      searchQuery: '4x4 8ft ground contact pressure treated post',
      quantity: postCount,
      unit: 'post',
      fallbackPrice: 10.28,
    },
    {
      id: 'post_base_4x4',
      name: '4×4 Post Base Anchors',
      searchQuery: '4x4 post base anchor galvanized',
      quantity: postBases,
      unit: 'each',
      fallbackPrice: 6.50,
    },
    {
      id: 'concrete_80lb',
      name: 'Concrete Mix 80lb Bags',
      searchQuery: 'quikrete 80lb concrete mix bag',
      quantity: concreteBags,
      unit: 'bag',
      fallbackPrice: 5.98,
    },
    {
      id: 'joist_hanger_2x8',
      name: '2×8 Joist Hangers',
      searchQuery: 'joist hanger 2x8 galvanized',
      quantity: joistHangers,
      unit: 'each',
      fallbackPrice: 1.30,
    },
    {
      id: 'deck_screws_5lb',
      name: 'Deck Screws 3" (5lb box)',
      searchQuery: 'deck screws 3 inch 5lb box',
      quantity: screwBoxes,
      unit: 'box',
      fallbackPrice: 29.45,
    },
  ];
}

module.exports = { calculate };
