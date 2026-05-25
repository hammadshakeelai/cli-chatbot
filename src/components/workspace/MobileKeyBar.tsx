'use client';

const KEYS = ['Tab', 'Ctrl+C', 'Esc', '↑', '↓', '←', '→'];

interface Props {
  onKey: (key: string) => void;
}

export function MobileKeyBar({ onKey }: Props) {
  return (
    <div
      className="flex items-center justify-center gap-1 px-2 py-1.5 md:hidden"
      style={{
        backgroundColor: 'var(--bg-elev)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {KEYS.map((key) => (
        <button
          key={key}
          onTouchStart={(e) => { e.preventDefault(); onKey(key); }}
          onClick={() => onKey(key)}
          style={{
            background: 'var(--bg)',
            color: 'var(--fg)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '6px 10px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            minWidth: '40px',
            textAlign: 'center',
            touchAction: 'manipulation',
          }}
        >
          {key}
        </button>
      ))}
    </div>
  );
}
