import type { ElementType, Geometry } from '../types';

export interface ElementTypeConfig {
  type: ElementType;
  label: string;
  geometry: Geometry;
  /** Tailwind-ish fill + border for the canvas rectangle. */
  fill: string;
  border: string;
  emoji: string;
  /** Default footprint in feet when first dropped. */
  defaultLengthFt: number;
  defaultWidthFt: number;
  /** Default per-type options. */
  defaultOptions: Record<string, string | number>;
}

export const ELEMENT_TYPES: Record<ElementType, ElementTypeConfig> = {
  deck: {
    type: 'deck',
    label: 'Deck',
    geometry: 'area',
    fill: 'rgba(180, 120, 70, 0.55)',
    border: '#8a5a2b',
    emoji: '🪵',
    defaultLengthFt: 16,
    defaultWidthFt: 12,
    defaultOptions: { deckingMaterial: 'pressure-treated' },
  },
  patio: {
    type: 'patio',
    label: 'Patio',
    geometry: 'area',
    fill: 'rgba(150, 150, 150, 0.55)',
    border: '#6b6b6b',
    emoji: '🧱',
    defaultLengthFt: 14,
    defaultWidthFt: 12,
    defaultOptions: {},
  },
  pavers: {
    type: 'pavers',
    label: 'Paver Path',
    geometry: 'area',
    fill: 'rgba(190, 160, 130, 0.55)',
    border: '#9c7b54',
    emoji: '🟫',
    defaultLengthFt: 12,
    defaultWidthFt: 4,
    defaultOptions: {},
  },
  grass: {
    type: 'grass',
    label: 'Grass / Sod',
    geometry: 'area',
    fill: 'rgba(90, 170, 80, 0.5)',
    border: '#4c8c40',
    emoji: '🌿',
    defaultLengthFt: 20,
    defaultWidthFt: 15,
    defaultOptions: {},
  },
  fence: {
    type: 'fence',
    label: 'Fence',
    geometry: 'linear',
    fill: 'rgba(120, 90, 60, 0.7)',
    border: '#6b4f33',
    emoji: '🚧',
    defaultLengthFt: 20,
    defaultWidthFt: 0.5, // visual thickness only
    defaultOptions: { fenceStyle: 'privacy', fenceHeightFt: 6 },
  },
  plant: {
    type: 'plant',
    label: 'Plant Bed',
    geometry: 'area',
    fill: 'rgba(110, 150, 80, 0.5)',
    border: '#5e7a3a',
    emoji: '🌳',
    defaultLengthFt: 8,
    defaultWidthFt: 4,
    defaultOptions: { plantsPer100Sqft: 6 },
  },
};

export const PALETTE_ORDER: ElementType[] = [
  'deck',
  'patio',
  'pavers',
  'grass',
  'fence',
  'plant',
];
