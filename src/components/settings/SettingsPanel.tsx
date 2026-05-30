'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMirageStore } from '@/store';
import { ALL_SKIN_META } from '@/themes/skin-meta';

interface ModelInfo {
  id: string;
  models: string[];
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  const skin        = useMirageStore((s) => s.skin);
  const mode        = useMirageStore((s) => s.mode);
  const fxEnabled   = useMirageStore((s) => s.fxEnabled);
  const soundFx     = useMirageStore((s) => s.soundFx);
  const setSkin     = useMirageStore((s) => s.setSkin);
  const toggleMode  = useMirageStore((s) => s.toggleMode);
  const setFxEnabled  = useMirageStore((s) => s.setFxEnabled);
  const setSoundFx    = useMirageStore((s) => s.setSoundFx);
  const getActiveSession = useMirageStore((s) => s.getActiveSession);
  const setChatMessages  = useMirageStore((s) => s.setChatMessages);

  const [models, setModels]         = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [byokKey, setByokKey]       = useState('');
  const [persona, setPersona]       = useState('');
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [toast, setToast]           = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  // Focus trap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Load models from /api/models
  useEffect(() => {
    fetch('/api/models')
      .then((r) => r.json())
      .then((d: { models: ModelInfo[] }) => { setModels(d.models ?? []); setIsLoadingModels(false); })
      .catch(() => setIsLoadingModels(false));
  }, []);

  // Sync from active session
  useEffect(() => {
    const s = getActiveSession();
    setSelectedModel(s.chat.model);
    setByokKey(s.chat.byokKey);
    setPersona(s.chat.persona);
  }, [getActiveSession]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }, []);

  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    getActiveSession().chat.model = model;
    showToast('Model updated');
  }, [getActiveSession, showToast]);

  const handleByokChange = useCallback((key: string) => {
    setByokKey(key);
    getActiveSession().chat.byokKey = key;
    showToast('BYOK key saved (client-side only)');
  }, [getActiveSession, showToast]);

  const handlePersonaChange = useCallback((text: string) => {
    setPersona(text);
    getActiveSession().chat.persona = text;
  }, [getActiveSession]);

  // ── Export helpers ─────────────────────────────────────────────────────────
  const exportSession = useCallback((format: 'json' | 'md' | 'txt') => {
    try {
      const session = getActiveSession();
      const msgs = session.chat.chatMessages as Array<{ role: string; content: string }>;
      const ts = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');

      let content = '';
      let mime = 'text/plain';

      if (format === 'json') {
        content = JSON.stringify({ cwd: session.cwd, messages: msgs }, null, 2);
        mime = 'application/json';
      } else if (format === 'md') {
        content = `# Mirage Session — ${ts}\n\n`;
        for (const m of msgs) {
          const label = m.role === 'user' ? '**You**' : '**Mirage**';
          content += `${label}\n\n${m.content}\n\n---\n\n`;
        }
      } else {
        for (const m of msgs) {
          const label = m.role === 'user' ? 'YOU' : 'MIRAGE';
          content += `[${label}]\n${m.content}\n\n`;
        }
      }

      const blob = new Blob([content], { type: mime });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), {
        href: url,
        download: `mirage-session-${ts}.${format}`,
      });
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported as .${format}`);
    } catch {
      showToast('Export failed');
    }
  }, [getActiveSession, showToast]);

  const skins = ALL_SKIN_META;

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-label="Settings"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-y-auto rounded-2xl p-6 shadow-2xl"
        style={{
          backgroundColor: 'var(--bg-elev)',
          color: 'var(--fg)',
          border: '1px solid var(--border)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">Settings</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--fg-dim)', border: '1px solid var(--border)' }}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className="mb-4 rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: 'var(--accent)', color: '#fff', opacity: 0.92 }}
          >
            {toast}
          </div>
        )}

        {/* ── Appearance ─────────────────────────────────────────── */}
        <Section title="Appearance">
          <div className="flex flex-wrap gap-2">
            <Btn onClick={toggleMode}>
              {mode === 'dark' ? '☀ Light mode' : '🌙 Dark mode'}
            </Btn>
            <Btn onClick={() => setFxEnabled(!fxEnabled)} active={fxEnabled}>
              CRT FX {fxEnabled ? 'ON' : 'OFF'}
            </Btn>
            <Btn onClick={() => setSoundFx(!soundFx)} active={soundFx}>
              Sound {soundFx ? 'ON' : 'OFF'}
            </Btn>
          </div>
        </Section>

        {/* ── Theme ──────────────────────────────────────────────── */}
        <Section title="Theme">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {skins.map((s) => {
              const active = skin.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => { setSkin(s.id); showToast(`Theme: ${s.label}`); }}
                  className="rounded-lg px-2 py-2 text-left text-xs transition-all"
                  style={{
                    backgroundColor: active ? s.accent : 'var(--bg)',
                    color: active ? '#fff' : 'var(--fg)',
                    border: `1px solid ${active ? s.accent : 'var(--border)'}`,
                    outline: active ? `2px solid ${s.accent}` : 'none',
                    outlineOffset: '1px',
                  }}
                  aria-pressed={active}
                >
                  <div className="font-semibold">{s.label}</div>
                  <div className="mt-0.5 opacity-60 leading-tight">{s.description}</div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── AI Model ───────────────────────────────────────────── */}
        <Section title="AI Model">
          {isLoadingModels ? (
            <div className="text-sm opacity-50 animate-pulse">Loading…</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {models.map((provider) =>
                provider.models.map((model) => {
                  const fullId = `${provider.id}:${model}`;
                  const active = selectedModel === fullId;
                  return (
                    <button
                      key={fullId}
                      onClick={() => handleModelChange(fullId)}
                      className="rounded-md px-2.5 py-1 text-xs transition-all"
                      style={{
                        backgroundColor: active ? 'var(--accent)' : 'var(--bg)',
                        color: active ? '#fff' : 'var(--fg)',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      }}
                      aria-pressed={active}
                    >
                      {fullId}
                    </button>
                  );
                }),
              )}
            </div>
          )}
        </Section>

        {/* ── BYOK ───────────────────────────────────────────────── */}
        <Section title="Bring Your Own Key">
          <p className="mb-2 text-xs opacity-55">
            Stored in your browser only. Never sent to our servers.
          </p>
          <input
            type="password"
            value={byokKey}
            onChange={(e) => handleByokChange(e.target.value)}
            placeholder="Paste your API key…"
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--fg)',
              border: '1px solid var(--border)',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
            }}
            aria-label="BYOK API key"
          />
        </Section>

        {/* ── AI Persona ─────────────────────────────────────────── */}
        <Section title="AI Persona">
          <textarea
            value={persona}
            onChange={(e) => handlePersonaChange(e.target.value)}
            onBlur={() => showToast('Persona saved')}
            rows={3}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--fg)',
              border: '1px solid var(--border)',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.55,
            }}
            aria-label="AI system prompt / persona"
          />
        </Section>

        {/* ── Session ────────────────────────────────────────────── */}
        <Section title="Session">
          <div className="mb-2 text-xs opacity-55">Export chat history as:</div>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => exportSession('json')}>Export .json</Btn>
            <Btn onClick={() => exportSession('md')}  >Export .md</Btn>
            <Btn onClick={() => exportSession('txt')} >Export .txt</Btn>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#e05555' }}>Sure?</span>
                <Btn
                  onClick={() => {
                    setChatMessages([]);
                    setConfirmClear(false);
                    showToast('Chat cleared');
                  }}
                  danger
                >
                  Yes, clear
                </Btn>
                <Btn onClick={() => setConfirmClear(false)}>Cancel</Btn>
              </div>
            ) : (
              <Btn onClick={() => setConfirmClear(true)} danger>
                Clear chat
              </Btn>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

// ── Tiny helpers ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3
        className="mb-2 text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--fg-dim)' }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function Btn({
  onClick,
  children,
  active,
  danger,
}: {
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg px-3 py-1.5 text-sm transition-all hover:opacity-80"
      style={{
        backgroundColor: active
          ? 'var(--accent)'
          : danger
            ? 'transparent'
            : 'var(--bg)',
        color: active ? '#fff' : danger ? '#e05555' : 'var(--fg)',
        border: `1px solid ${active ? 'var(--accent)' : danger ? '#e05555' : 'var(--border)'}`,
      }}
    >
      {children}
    </button>
  );
}
