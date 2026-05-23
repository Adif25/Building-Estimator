'use strict';

function calculate(dimensions, options = {}) {
  const { length, width, height } = dimensions;
  const pitchStr = options.roofPitch || '4:12';
  const [rise] = pitchStr.split(':').map(Number);
  const pitchAngle = Math.atan(rise / 12);

  // Wall studs (2x4 at 16" OC)
  const perimeter = 2 * (length + width);
  const studCount = Math.ceil((perimeter / (16 / 12)) * 1.15) + 8; // 15% waste + corners

  // Top/bottom plates: double top plate + single bottom plate = 3 plates
  const plateCount = Math.ceil((perimeter / 8)) * 3;

  // OSB wall sheathing (4×8 = 32 sq ft each)
  const wallArea = perimeter * height;
  const wallSheets = Math.ceil((wallArea / 32) * 1.1);

  // OSB floor (4×8 sheets)
  const floorArea = length * width;
  const floorSheets = Math.ceil((floorArea / 32) * 1.1);

  // Roof rafters (2x6): run = half the span / cos(angle)
  const rafterRun = (width / 2) / Math.cos(pitchAngle);
  const rafterLengthFt = Math.ceil(rafterRun + 1); // +1 for overhang, round up
  const rafterCount = (Math.ceil(length / (24 / 12)) + 1) * 2; // pairs at 24" OC

  // Ridge board (2x8, length of shed)
  const ridgeBoardCount = Math.ceil(length / 16);

  // Roof sheathing OSB
  const roofArea = length * rafterRun * 2 * 1.15; // both sides + 15% overhang/waste
  const roofSheets = Math.ceil(roofArea / 32);

  // Shingles: 1 bundle covers ~33 sq ft
  const shingleBundles = Math.ceil(roofArea / 33);

  // Roofing nails (1lb per bundle approx)
  const roofingNailBoxes = Math.ceil(shingleBundles / 3);

  return [
    {
      id: '2x4_8ft',
      name: '2×4 ×8ft Wall Studs',
      searchQuery: '2x4 8ft framing stud lumber',
      quantity: studCount,
      unit: 'stud',
      fallbackPrice: 4.38,
    },
    {
      id: '2x4_8ft',
      name: '2×4 ×8ft Top & Bottom Plates',
      searchQuery: '2x4 8ft framing stud lumber',
      quantity: plateCount,
      unit: 'board',
      fallbackPrice: 4.38,
    },
    {
      id: 'osb_4x8',
      name: 'OSB Wall Sheathing 7/16" 4×8',
      searchQuery: 'OSB sheathing 7/16 4x8',
      quantity: wallSheets,
      unit: 'sheet',
      fallbackPrice: 8.48,
    },
    {
      id: 'osb_4x8',
      name: 'OSB Floor Decking 7/16" 4×8',
      searchQuery: 'OSB sheathing 7/16 4x8',
      quantity: floorSheets,
      unit: 'sheet',
      fallbackPrice: 8.48,
    },
    {
      id: '2x6_10ft',
      name: `2×6 ×${rafterLengthFt}ft Roof Rafters`,
      searchQuery: `2x6 ${rafterLengthFt}ft lumber rafter`,
      quantity: rafterCount,
      unit: 'board',
      fallbackPrice: 10.00,
    },
    {
      id: 'ridge_board_2x8',
      name: '2×8 Ridge Board',
      searchQuery: '2x8 16ft lumber',
      quantity: ridgeBoardCount,
      unit: 'board',
      fallbackPrice: 15.00,
    },
    {
      id: 'osb_4x8',
      name: 'OSB Roof Sheathing 7/16" 4×8',
      searchQuery: 'OSB sheathing 7/16 4x8',
      quantity: roofSheets,
      unit: 'sheet',
      fallbackPrice: 8.48,
    },
    {
      id: 'shingles_bundle',
      name: 'Architectural Shingles (bundle)',
      searchQuery: 'architectural shingles bundle 30yr',
      quantity: shingleBundles,
      unit: 'bundle',
      fallbackPrice: 39.48,
    },
    {
      id: 'roofing_nails_1lb',
      name: 'Roofing Nails 1¾" (1lb box)',
      searchQuery: 'roofing nails 1-3/4 inch coil box',
      quantity: roofingNailBoxes,
      unit: 'box',
      fallbackPrice: 4.00,
    },
  ];
}

module.exports = { calculate };
