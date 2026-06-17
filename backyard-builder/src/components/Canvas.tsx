import { useRef } from 'react';
import type { Element } from '../types';
import { ELEMENT_TYPES } from '../data/elementTypes';
import { PX_PER_FT, YARD_W_FT, YARD_H_FT, px, ft, clamp, snapFt } from '../canvas';

interface Props {
  elements: Element[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<Element>) => void;
}

type DragState =
  | { mode: 'move'; id: string; startX: number; startY: number; origX: number; origY: number }
  | { mode: 'resize'; id: string; startX: number; startY: number; origL: number; origW: number };

export default function Canvas({ elements, selectedId, onSelect, onChange }: Props) {
  const drag = useRef<DragState | null>(null);

  function beginMove(e: React.PointerEvent, el: Element) {
    e.stopPropagation();
    onSelect(el.id);
    drag.current = {
      mode: 'move',
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function beginResize(e: React.PointerEvent, el: Element) {
    e.stopPropagation();
    onSelect(el.id);
    drag.current = {
      mode: 'resize',
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origL: el.lengthFt,
      origW: el.widthFt,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dxFt = ft(e.clientX - d.startX);
    const dyFt = ft(e.clientY - d.startY);
    const el = elements.find((x) => x.id === d.id);
    if (!el) return;

    if (d.mode === 'move') {
      const x = clamp(snapFt(d.origX + dxFt), 0, YARD_W_FT - el.lengthFt);
      const y = clamp(snapFt(d.origY + dyFt), 0, YARD_H_FT - el.widthFt);
      onChange(d.id, { x, y });
    } else {
      const lengthFt = clamp(snapFt(d.origL + dxFt), 1, YARD_W_FT - el.x);
      const widthFt = clamp(snapFt(d.origW + dyFt), 0.5, YARD_H_FT - el.y);
      onChange(d.id, { lengthFt, widthFt });
    }
  }

  function endDrag() {
    drag.current = null;
  }

  return (
    <div
      onPointerDown={() => onSelect(null)}
      className="flex h-full items-center justify-center overflow-auto bg-charcoal p-8"
    >
      <div
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        className="relative shrink-0 shadow-xl ring-1 ring-edge"
        style={{
          width: px(YARD_W_FT),
          height: px(YARD_H_FT),
          backgroundColor: '#eef6e9',
          backgroundImage:
            'linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),' +
            'linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px),' +
            'linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px),' +
            'linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)',
          backgroundSize:
            `${PX_PER_FT}px ${PX_PER_FT}px, ${PX_PER_FT}px ${PX_PER_FT}px,` +
            `${PX_PER_FT * 5}px ${PX_PER_FT * 5}px, ${PX_PER_FT * 5}px ${PX_PER_FT * 5}px`,
        }}
      >
        {elements.map((el) => {
          const cfg = ELEMENT_TYPES[el.type];
          const selected = el.id === selectedId;
          return (
            <div
              key={el.id}
              onPointerDown={(e) => beginMove(e, el)}
              className="group absolute flex cursor-move items-center justify-center select-none"
              style={{
                left: px(el.x),
                top: px(el.y),
                width: px(el.lengthFt),
                height: px(el.widthFt),
                backgroundColor: cfg.fill,
                border: `2px solid ${cfg.border}`,
                outline: selected ? '2px solid #e87722' : 'none',
                outlineOffset: 2,
                zIndex: selected ? 10 : 1,
              }}
            >
              <span className="pointer-events-none truncate px-1 text-xs font-medium text-slate-800">
                {cfg.emoji} {cfg.label}
                <span className="ml-1 text-slate-600">
                  {el.lengthFt}×{el.widthFt}ft
                </span>
              </span>

              {selected && (
                <div
                  onPointerDown={(e) => beginResize(e, el)}
                  className="absolute -right-1.5 -bottom-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-sm border border-white bg-brand"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
