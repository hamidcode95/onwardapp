import { useEffect, useRef, useCallback } from 'react';

interface ScrollPickerProps {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  label?: string;
  pad?: boolean;
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 3;

export function ScrollPicker({ values, value, onChange, label, pad = true }: ScrollPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProgrammaticScroll = useRef(false);

  const scrollToValue = useCallback((v: number, smooth = false) => {
    const container = containerRef.current;
    if (!container) return;
    const index = values.indexOf(v);
    if (index === -1) return;
    isProgrammaticScroll.current = true;
    container.scrollTo({ top: index * ITEM_HEIGHT, behavior: smooth ? 'smooth' : 'auto' });
    setTimeout(() => { isProgrammaticScroll.current = false; }, smooth ? 300 : 50);
  }, [values]);

  useEffect(() => {
    scrollToValue(value, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current) return;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const index = Math.round(container.scrollTop / ITEM_HEIGHT);
      const clamped = Math.min(Math.max(index, 0), values.length - 1);
      const newValue = values[clamped];
      scrollToValue(newValue, true);
      if (newValue !== value) onChange(newValue);
    }, 120);
  }, [values, value, onChange, scrollToValue]);

  const paddingHeight = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

  return (
    <div className="flex flex-col items-center">
      {label && <span className="mb-1 text-xs text-muted-foreground">{label}</span>}
      <div className="relative">
        <div
          className="pointer-events-none absolute left-0 right-0 top-1/2 z-10 -translate-y-1/2 rounded-md border-y border-primary/40 bg-primary/5"
          style={{ height: ITEM_HEIGHT }}
        />
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="no-scrollbar snap-y snap-mandatory overflow-y-auto"
          style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS, width: 64, scrollbarWidth: 'none' }}
        >
          <div style={{ height: paddingHeight }} />
          {values.map((v) => (
            <div
              key={v}
              className="flex snap-center items-center justify-center text-lg font-mono text-foreground"
              style={{ height: ITEM_HEIGHT }}
            >
              {pad ? v.toString().padStart(2, '0') : v}
            </div>
          ))}
          <div style={{ height: paddingHeight }} />
        </div>
      </div>
    </div>
  );
}
