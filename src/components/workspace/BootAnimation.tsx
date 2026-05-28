'use client';

import { useEffect, useState } from 'react';
import { APP_VERSION } from '@/lib/constants';

interface BootLine {
  raw: string;
  color?: string;
  dim?: boolean;
  bold?: boolean;
}

const BOOT_LINES: BootLine[] = [
  { raw: '▶ Mirage starting…', color: 'var(--accent)', bold: true },
  { raw: '  ✓ virtual filesystem mounted', color: 'var(--fg)', dim: true },
  { raw: '  ✓ shell kernel ready', color: 'var(--fg)', dim: true },
  { raw: '  ✓ command registry loaded', color: 'var(--fg)', dim: true },
  { raw: '  ✓ AI bridge connected', color: 'var(--fg)', dim: true },
  { raw: '  ✓ themes applied', color: 'var(--fg)', dim: true },
  { raw: '' },
  { raw: `Mirage v${APP_VERSION}`, color: 'var(--fg)', bold: true },
  { raw: "A terminal that isn't there.", color: 'var(--fg-dim)', dim: true },
  { raw: '' },
];

export function BootAnimation({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (visible < BOOT_LINES.length) {
      const delay = visible === 0 ? 80 : visible < 6 ? 70 : 120;
      const t = setTimeout(() => setVisible((v) => v + 1), delay);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setFadeOut(true), 400);
    const t2 = setTimeout(onDone, 850);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [visible, onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.45s ease-out',
      }}
    >
      <pre
        style={{
          margin: 0,
          lineHeight: 1.7,
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(12px, 2vw, 14px)',
          minWidth: '240px',
        }}
      >
        {BOOT_LINES.slice(0, visible).map((line, i) => (
          <div
            key={i}
            style={{
              color: line.color ?? 'var(--fg)',
              opacity: line.dim ? 0.55 : 1,
              fontWeight: line.bold ? 600 : 400,
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {line.raw}
          </div>
        ))}
      </pre>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
