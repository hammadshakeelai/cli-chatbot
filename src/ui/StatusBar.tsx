'use client';

import { useUI } from '@/store/ui';
import { APP_VERSION } from '@/lib/constants';

export function StatusBar() {
  const tabs = useUI((s) => s.tabs);
  const activeTabId = useUI((s) => s.activeTabId);
  const settings = useUI((s) => s.settings);
  const updateSettings = useUI((s) => s.updateSettings);
  const setSettingsOpen = useUI((s) => s.setSettingsOpen);
  const setPaletteOpen = useUI((s) => s.setPaletteOpen);

  const active = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="statusbar">
      {active && (
        <span className="status-chip" title={active.cwd}>
          {active.busy
            ? <span className="busy-spin" />
            : <span style={{ color: active.accent, fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{active.icon}</span>}
          <span>{active.title}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span style={{ opacity: 0.7 }}>{active.cwd.replace('C:\\Users\\user', '~')}</span>
        </span>
      )}
      <span className="grow" />
      <button
        className="status-btn"
        onClick={() => setPaletteOpen(true)}
        title="Change the AI model (command palette)"
      >
        {settings.model === 'auto' ? 'model: auto' : settings.model}
      </button>
      <button
        className="status-btn"
        onClick={() => updateSettings({ mode: settings.mode === 'dark' ? 'light' : 'dark' })}
        title={settings.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {settings.mode === 'dark' ? '☾' : '☀'}
      </button>
      <button
        className="status-btn"
        onClick={() => updateSettings({ crtFx: !settings.crtFx })}
        title="Toggle CRT effects"
        style={settings.crtFx ? { color: 'var(--accent)' } : undefined}
      >
        fx
      </button>
      <button className="status-btn" onClick={() => setSettingsOpen(true)} title="Settings (Ctrl+,)">
        ⚙
      </button>
      <span style={{ opacity: 0.45 }}>v{APP_VERSION}</span>
    </div>
  );
}
