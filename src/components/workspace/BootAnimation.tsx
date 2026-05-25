'use client';

import { useEffect, useState } from 'react';

const BOOT_LINES = [
  '\x1b[32mStarting Mirage...\x1b[0m',
  '\x1b[2m  [OK] Mounting virtual filesystem\x1b[0m',
  '\x1b[2m  [OK] Initializing shell kernel\x1b[0m',
  '\x1b[2m  [OK] Loading command registry\x1b[0m',
  '\x1b[2m  [OK] Starting AI bridge\x1b[0m',
  '\x1b[2m  [OK] Applying theme\x1b[0m',
  '',
  '\x1b[1;32mWelcome to Mirage v0.1.0\x1b[0m',
  '\x1b[2mA terminal that isn\'t there.\x1b[0m',
  '',
];

const MAX_LINES = BOOT_LINES.length;

export function BootAnimation({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (visible < MAX_LINES) {
      const delay = visible < 2 ? 100 : 60;
      const timer = setTimeout(() => setVisible((v) => v + 1), delay);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setFadeOut(true), 500);
      const done = setTimeout(onDone, 1000);
      return () => { clearTimeout(timer); clearTimeout(done); };
    }
  }, [visible, onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg)',
        color: 'var(--fg)',
        fontFamily: 'var(--font-mono)',
        fontSize: '14px',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
      }}
    >
      <pre style={{ margin: 0, lineHeight: 1.6 }}>{/* xterm won't render here, use plain text */}
        {BOOT_LINES.slice(0, visible).map((line, i) => (
          <div key={i}>
            {line.replace(/\x1b\[[0-9;]*m/g, '')}
          </div>
        ))}
      </pre>
    </div>
  );
}
