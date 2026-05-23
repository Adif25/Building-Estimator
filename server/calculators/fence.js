'use strict';

function calculate(dimensions, options = {}) {
  const { length, height } = dimensions;
  const style = options.fenceStyle || 'privacy';

  const postSpacing = 8; // feet between posts
  const postCount = Math.ceil(length / postSpacing) + 1;
  const concreteBags = postCount * 2;

  // Rails: 2 for <=4ft fence, 3 for 6ft
  const railsPerSection = height <= 4 ? 2 : 3;
  const sections = Math.ceil(length / postSpacing);
  const railCount = sections * railsPerSection;

  // Pickets
  const picketHeightFt = height <= 4 ? 4 : 6;
  const picketSpacingIn = style === 'privacy' ? 5.5 : 4.5; // tight vs open
  const picketsNeeded = Math.ceil((length * 12) / picketSpacingIn);

  // Nails (1lb box covers ~50 pickets)
  const nailBoxes = Math.ceil(picketsNeeded / 50);

  return [
    {
      id: '4x4_8ft_pt',
      name: '4×4 ×8ft Ground Contact Posts',
      searchQuery: '4x4 8ft ground contact pressure treated post',
      quantity: postCount,
      unit: 'post',
      fallbackPrice: 10.28,
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
      id: '2x4_8ft',
      name: '2×4 ×8ft Rails',
      searchQuery: '2x4 8ft framing stud lumber',
      quantity: railCount,
      unit: 'board',
      fallbackPrice: 4.38,
    },
    {
      id: picketHeightFt === 6 ? 'cedar_picket_6ft' : 'cedar_picket_4ft',
      name: `Cedar Dog-Ear Fence Pickets ${picketHeightFt}ft`,
      searchQuery: `cedar fence picket ${picketHeightFt}ft dog ear`,
      quantity: picketsNeeded,
      unit: 'picket',
      fallbackPrice: picketHeightFt === 6 ? 2.08 : 1.50,
    },
    {
      id: 'fence_nails_1lb',
      name: 'Galvanized Fence Nails 8d (1lb box)',
      searchQuery: 'fence nails 8d galvanized 1lb box',
      quantity: nailBoxes,
      unit: 'box',
      fallbackPrice: 3.50,
    },
  ];
}

module.exports = { calculate };
