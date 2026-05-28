'use client';

import { useState } from 'react';

const KEYS = [
  { label: 'Tab',  value: 'Tab' },
  { label: '⎈ C',  value: 'Ctrl+C' },
  { label: 'Esc',  value: 'Esc' },
  { label: '↑',    value: '↑' },
  { label: '↓',    value: '↓' },
  { label: '←',    value: '←' },
  { label: '→',    value: '→' },
  { label: '/',    value: '/' },
  { label: '|',    value: '|' },
  { label: '~',    value: '~' },
];

interface Props {
  onKey: (key: string) => void;
  onCommand?: (cmd: string) => void;
}

export function MobileKeyBar({ onKey, onCommand }: Props) {
  const [cmd, setCmd] = useState('');

  return (
    <div
      className="flex flex-col md:hidden w-full"
      style={{ backgroundColor: 'var(--bg-elev)', borderTop: '1px solid var(--border)' }}
    >
      {/* Command input row */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (onCommand && cmd.trim()) {
            onCommand(cmd.trim());
            setCmd('');
          }
        }}
        className="flex items-center p-2 gap-2 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <span style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', userSelect: 'none' }}>$</span>
        <input
          type="text"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder="Type command…"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          className="flex-1 bg-transparent outline-none"
          style={{ color: 'var(--fg)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}
        />
        <button
          type="submit"
          style={{
            background: 'var(--accent)',
            color: '#fff',
            padding: '5px 14px',
            borderRadius: '6px',
            fontFamily: 'var(--font-ui)',
            fontSize: '12px',
            fontWeight: 600,
            border: 'none',
            opacity: cmd.trim() ? 1 : 0.5,
            transition: 'opacity 0.15s',
          }}
        >
          Run
        </button>
      </form>

      {/* Special-key row */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {KEYS.map((k) => (
          <button
            key={k.value}
            onTouchStart={(e) => { e.preventDefault(); onKey(k.value); }}
            onClick={() => onKey(k.value)}
            style={{
              background: 'var(--bg)',
              color: 'var(--fg)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '7px 10px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              minWidth: '38px',
              minHeight: '34px',
              textAlign: 'center',
              touchAction: 'manipulation',
              lineHeight: 1,
              boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
              transition: 'background 0.1s, transform 0.1s',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0,
            }}
          >
            {k.label}
          </button>
        ))}
      </div>
    </div>
  );
}
