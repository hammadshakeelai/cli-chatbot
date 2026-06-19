'use client';

import { useEffect, useState } from 'react';
import { manager } from '@/term/manager';

const KEYS: { label: string; data: string }[] = [
  { label: 'Tab', data: '\t' },
  { label: 'Esc', data: '\x1b' },
  { label: '^C', data: '\x03' },
  { label: '↑', data: '\x1b[A' },
  { label: '↓', data: '\x1b[B' },
  { label: '←', data: '\x1b[D' },
  { label: '→', data: '\x1b[C' },
  { label: '|', data: '|' },
  { label: '\\', data: '\\' },
  { label: '~', data: '~' },
  { label: '-', data: '-' },
  { label: '"', data: '"' },
];

/** On-screen keys for touch devices. */
export function MobileKeyBar() {
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    setTouch(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setTouch(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!touch) return null;

  return (
    <div className="keybar">
      {KEYS.map((k) => (
        <button
          key={k.label}
          onClick={() => { manager.feedActive(k.data); manager.focusActive(); }}
          aria-label={`Send ${k.label}`}
        >
          {k.label}
        </button>
      ))}
    </div>
  );
}
