import { useCallback, useState } from 'react';
import type { Element, ElementType } from './types';
import { ELEMENT_TYPES } from './data/elementTypes';
import { YARD_W_FT, YARD_H_FT, clamp } from './canvas';
import Canvas from './components/Canvas';
import Palette from './components/Palette';
import Inspector from './components/Inspector';
import EstimatePanel from './components/EstimatePanel';

let counter = 0;
const newId = () => `el_${counter++}`;

export default function App() {
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addElement = useCallback((type: ElementType) => {
    const cfg = ELEMENT_TYPES[type];
    const id = newId();
    setElements((prev) => {
      // Stagger new drops so they don't stack exactly on top of each other.
      const offset = (prev.length % 5) * 2;
      const el: Element = {
        id,
        type,
        x: clamp(2 + offset, 0, YARD_W_FT - cfg.defaultLengthFt),
        y: clamp(2 + offset, 0, YARD_H_FT - cfg.defaultWidthFt),
        lengthFt: cfg.defaultLengthFt,
        widthFt: cfg.defaultWidthFt,
        options: { ...cfg.defaultOptions },
      };
      return [...prev, el];
    });
    setSelectedId(id);
  }, []);

  const updateElement = useCallback((id: string, patch: Partial<Element>) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...patch } : el)));
  }, []);

  const removeElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  const selected = elements.find((el) => el.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col bg-charcoal text-ink">
      <header className="flex items-center justify-between border-b-2 border-brand bg-charcoal-light px-6 py-3">
        <div className="flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#e87722" />
            <path d="M6 24L16 8L26 24H6Z" fill="white" opacity="0.9" />
            <rect x="13" y="18" width="6" height="6" fill="#e87722" />
          </svg>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold whitespace-nowrap">Build Estimator</span>
            <span className="text-sm text-muted">Backyard Designer</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted">
            {YARD_W_FT}×{YARD_H_FT}ft yard
          </span>
          <button
            onClick={() => {
              setElements([]);
              setSelectedId(null);
            }}
            className="rounded-md border border-edge px-3 py-1.5 text-sm font-medium text-muted transition hover:border-brand hover:text-brand"
          >
            Clear
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left: palette + inspector */}
        <aside className="flex w-64 shrink-0 flex-col border-r border-edge bg-panel">
          <Palette onAdd={addElement} />
          {selected && (
            <Inspector
              element={selected}
              onChange={updateElement}
              onRemove={removeElement}
            />
          )}
        </aside>

        {/* Center: canvas */}
        <main className="min-w-0 flex-1">
          <Canvas
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChange={updateElement}
          />
        </main>

        {/* Right: estimate */}
        <aside className="w-80 shrink-0 border-l border-edge bg-panel">
          <EstimatePanel
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>
      </div>
    </div>
  );
}
