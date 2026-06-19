'use client';

import { useEffect } from 'react';
import { useUI, DEFAULT_SETTINGS } from '@/store/ui';
import { SCHEMES } from '@/themes/schemes';
import { manager } from '@/term/manager';

const MODEL_OPTIONS: { value: string; label: string }[] = [
  { value: 'auto', label: 'Auto — each agent picks its provider' },
  { value: 'gemini:gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini:gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'groq:llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Groq)' },
  { value: 'groq:llama-3.1-8b-instant', label: 'Llama 3.1 8B (Groq)' },
  { value: 'openrouter:auto:free', label: 'OpenRouter Auto (free)' },
];

export function SettingsDialog() {
  const open = useUI((s) => s.settingsOpen);
  const setOpen = useUI((s) => s.setSettingsOpen);
  const settings = useUI((s) => s.settings);
  const updateSettings = useUI((s) => s.updateSettings);
  const toast = useUI((s) => s.toast);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (!open) return null;

  const close = () => { setOpen(false); manager.focusActive(); };

  return (
    <div className="overlay" onMouseDown={close}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Settings">
        <div className="dialog-header">
          Settings
          <button className="dialog-close" onClick={close} aria-label="Close settings">✕</button>
        </div>
        <div className="dialog-body">

          <div className="field">
            <label className="field-label">Color scheme</label>
            <div className="scheme-grid">
              {SCHEMES.map((sc) => {
                const v = settings.mode === 'dark' ? sc.dark : sc.light;
                return (
                  <button
                    key={sc.id}
                    className={`scheme-card${settings.schemeId === sc.id ? ' selected' : ''}`}
                    onClick={() => updateSettings({ schemeId: sc.id })}
                    style={{ background: v.bg }}
                    title={sc.description}
                  >
                    <span className="scheme-dots">
                      <span className="scheme-dot" style={{ background: v.accent }} />
                      <span className="scheme-dot" style={{ background: v.xterm.green }} />
                      <span className="scheme-dot" style={{ background: v.xterm.yellow }} />
                      <span className="scheme-dot" style={{ background: v.xterm.magenta }} />
                    </span>
                    <div className="scheme-name" style={{ color: v.fg }}>{sc.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="field" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label className="field-label">Mode</label>
              <div className="seg">
                <button className={settings.mode === 'dark' ? 'on' : ''} onClick={() => updateSettings({ mode: 'dark' })}>Dark</button>
                <button className={settings.mode === 'light' ? 'on' : ''} onClick={() => updateSettings({ mode: 'light' })}>Light</button>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label className="field-label">Font size — {settings.fontSize}px</label>
              <input
                type="range" min={11} max={20} step={1}
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>
          </div>

          <div className="field">
            <label className="check">
              <input type="checkbox" checked={settings.cursorBlink}
                onChange={(e) => updateSettings({ cursorBlink: e.target.checked })} />
              Blinking cursor
            </label>
            <label className="check">
              <input type="checkbox" checked={settings.crtFx}
                onChange={(e) => updateSettings({ crtFx: e.target.checked })} />
              CRT effects (scanlines + vignette)
            </label>
            <label className="check">
              <input type="checkbox" checked={settings.sound}
                onChange={(e) => updateSettings({ sound: e.target.checked })} />
              Key-click sound
            </label>
          </div>

          <div className="field">
            <label className="field-label">AI model</label>
            <select
              className="input"
              value={settings.model}
              onChange={(e) => updateSettings({ model: e.target.value })}
            >
              {MODEL_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <div className="field-hint">
              &ldquo;Auto&rdquo; lets each agent use its preferred provider. Requests go through a
              server-side proxy; provider keys never reach the browser.
            </div>
          </div>

          <div className="field">
            <label className="field-label">Bring your own API key (optional)</label>
            <input
              className="input"
              type="password"
              placeholder="Gemini / Groq / OpenRouter key"
              value={settings.byokKey}
              onChange={(e) => updateSettings({ byokKey: e.target.value })}
              autoComplete="off"
            />
            <div className="field-hint">
              Stored only in this browser&rsquo;s localStorage and forwarded per-request. Clears the
              shared rate limit. Leave empty to use the built-in keys.
            </div>
          </div>

        </div>
        <div className="dialog-footer">
          <button
            className="btn danger"
            onClick={() => { updateSettings({ ...DEFAULT_SETTINGS }); toast('Settings reset to defaults'); }}
          >
            Reset all
          </button>
          <button className="btn primary" onClick={close}>Done</button>
        </div>
      </div>
    </div>
  );
}
