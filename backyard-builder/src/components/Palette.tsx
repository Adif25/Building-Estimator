import { ELEMENT_TYPES, PALETTE_ORDER } from '../data/elementTypes';
import type { ElementType } from '../types';

interface Props {
  onAdd: (type: ElementType) => void;
}

export default function Palette({ onAdd }: Props) {
  return (
    <div className="border-b border-edge p-4">
      <h2 className="mb-3 text-xs font-semibold tracking-wider text-brand uppercase">
        Elements
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {PALETTE_ORDER.map((type) => {
          const cfg = ELEMENT_TYPES[type];
          return (
            <button
              key={type}
              onClick={() => onAdd(type)}
              className="flex items-center gap-2 rounded-lg border border-edge bg-charcoal px-2.5 py-2 text-left text-sm font-medium text-ink transition hover:border-brand hover:bg-brand/10"
            >
              <span className="text-base">{cfg.emoji}</span>
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
