// Shared canvas geometry. The yard is a fixed-size plot; elements are measured
// in feet and converted to pixels for display via PX_PER_FT.

export const YARD_W_FT = 40;
export const YARD_H_FT = 30;
export const PX_PER_FT = 16;

export const ft = (px: number) => px / PX_PER_FT;
export const px = (feet: number) => feet * PX_PER_FT;

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Round a foot value to the nearest 0.5ft for tidy snapping. */
export const snapFt = (v: number) => Math.round(v * 2) / 2;
