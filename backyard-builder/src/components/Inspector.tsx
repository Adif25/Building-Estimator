import type { Element } from '../types';
import { ELEMENT_TYPES } from '../data/elementTypes';

interface Props {
  element: Element;
  onChange: (id: string, patch: Partial<Element>) => void;
  onRemove: (id: string) => void;
}

function NumberField({
  label,
  value,
  step = 1,
  min = 0,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm text-muted">
      {label}
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 rounded border border-edge bg-charcoal px-2 py-1 text-right text-ink outline-none focus:border-brand"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm text-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer rounded border border-edge bg-charcoal px-2 py-1 text-ink outline-none focus:border-brand"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Inspector({ element, onChange, onRemove }: Props) {
  const cfg = ELEMENT_TYPES[element.type];
  const setOption = (key: string, value: string | number) =>
    onChange(element.id, { options: { ...element.options, [key]: value } });

  return (
    <div className="border-b border-edge bg-charcoal-light p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">
          {cfg.emoji} {cfg.label}
        </h2>
        <button
          onClick={() => onRemove(element.id)}
          className="text-xs font-medium text-red-400 hover:text-red-300"
        >
          Delete
        </button>
      </div>

      <div className="space-y-2">
        <NumberField
          label={cfg.geometry === 'linear' ? 'Length (ft)' : 'Length (ft)'}
          value={element.lengthFt}
          step={0.5}
          min={1}
          onChange={(v) => onChange(element.id, { lengthFt: v })}
        />
        {cfg.geometry === 'area' && (
          <NumberField
            label="Width (ft)"
            value={element.widthFt}
            step={0.5}
            min={1}
            onChange={(v) => onChange(element.id, { widthFt: v })}
          />
        )}

        {element.type === 'deck' && (
          <SelectField
            label="Decking"
            value={String(element.options.deckingMaterial ?? 'pressure-treated')}
            options={[
              { value: 'pressure-treated', label: 'Pressure-treated' },
              { value: 'cedar', label: 'Cedar' },
              { value: 'composite', label: 'Composite' },
            ]}
            onChange={(v) => setOption('deckingMaterial', v)}
          />
        )}

        {element.type === 'fence' && (
          <>
            <SelectField
              label="Style"
              value={String(element.options.fenceStyle ?? 'privacy')}
              options={[
                { value: 'privacy', label: 'Privacy (tight)' },
                { value: 'spaced', label: 'Spaced (open)' },
              ]}
              onChange={(v) => setOption('fenceStyle', v)}
            />
            <SelectField
              label="Height"
              value={String(element.options.fenceHeightFt ?? 6)}
              options={[
                { value: '4', label: "4 ft" },
                { value: '6', label: "6 ft" },
              ]}
              onChange={(v) => setOption('fenceHeightFt', Number(v))}
            />
          </>
        )}
      </div>
    </div>
  );
}
