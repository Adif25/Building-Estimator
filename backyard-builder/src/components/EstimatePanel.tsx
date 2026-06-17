import type { Element } from '../types';
import { ELEMENT_TYPES } from '../data/elementTypes';
import { estimateAll } from '../estimate';

interface Props {
  elements: Element[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default function EstimatePanel({ elements, selectedId, onSelect }: Props) {
  const { perElement, total } = estimateAll(elements);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-edge p-4">
        <h2 className="text-xs font-semibold tracking-wider text-brand uppercase">
          Estimate
        </h2>
      </div>

      <div className="flex-1 overflow-auto">
        {perElement.length === 0 && (
          <p className="p-4 text-sm text-muted">
            Add elements to see an itemized estimate.
          </p>
        )}

        {perElement.map((est) => {
          const cfg = ELEMENT_TYPES[est.type];
          return (
            <div
              key={est.elementId}
              onClick={() => onSelect(est.elementId)}
              className={`cursor-pointer border-b border-edge/60 px-4 py-2.5 transition hover:bg-charcoal-light ${
                est.elementId === selectedId ? 'bg-brand/10' : ''
              }`}
            >
              <div className="flex items-center justify-between text-sm font-semibold text-ink">
                <span>
                  {cfg.emoji} {cfg.label}
                </span>
                <span className="tabular-nums">{usd(est.subtotal)}</span>
              </div>
              <ul className="mt-1 space-y-0.5">
                {est.items.map((it, i) => (
                  <li
                    key={`${it.materialId}-${i}`}
                    className="flex justify-between text-xs text-muted"
                  >
                    <span className="truncate pr-2">
                      {it.quantity} × {it.name}
                    </span>
                    <span className="shrink-0 tabular-nums">{usd(it.lineTotal)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="border-t border-edge p-4">
        <div className="flex items-center justify-between text-base font-bold text-brand">
          <span>Total</span>
          <span className="tabular-nums">{usd(total)}</span>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          Materials only · prices from local catalog
        </p>
      </div>
    </div>
  );
}
