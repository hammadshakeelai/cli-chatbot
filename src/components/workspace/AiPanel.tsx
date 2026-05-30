'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMirageStore } from '@/store';
import type { ChatMsg } from '@/providers/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DisplayMsg {
  role: 'user' | 'assistant' | 'system';
  content: string;
  streaming?: boolean;
  provider?: string;
}

// ── ANSI strip for display in HTML (basic) ────────────────────────────────────

function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

// ── Single message bubble ─────────────────────────────────────────────────────

function MessageBubble({ msg, accent }: { msg: DisplayMsg; accent: string }) {
  const isUser = msg.role === 'user';
  const text   = stripAnsi(msg.content);

  return (
    <div
      style={{
        display:    'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap:        '8px',
        padding:    '2px 0',
        alignItems: 'flex-start',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width:           '24px',
          height:          '24px',
          borderRadius:    '50%',
          flexShrink:      0,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          fontSize:        '11px',
          fontWeight:      700,
          backgroundColor: isUser ? 'rgba(255,255,255,0.08)' : accent + '22',
          color:           isUser ? 'var(--fg-dim)' : accent,
          border:          isUser ? '1px solid rgba(255,255,255,0.1)' : `1px solid ${accent}44`,
          marginTop:       '2px',
        }}
      >
        {isUser ? 'U' : 'A'}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth:     '85%',
          padding:      '8px 12px',
          borderRadius: isUser ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
          backgroundColor: isUser
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.03)',
          border:       isUser
            ? '1px solid rgba(255,255,255,0.1)'
            : `1px solid ${accent}22`,
          fontSize:     '13px',
          lineHeight:   1.6,
          color:        'var(--fg)',
          fontFamily:   'var(--font-ui, system-ui)',
          whiteSpace:   'pre-wrap',
          wordBreak:    'break-word',
        }}
      >
        {text}
        {msg.streaming && (
          <span
            style={{
              display:         'inline-block',
              width:           '7px',
              height:          '13px',
              backgroundColor: accent,
              marginLeft:      '2px',
              verticalAlign:   'text-bottom',
              animation:       'blink 0.8s step-end infinite',
            }}
          />
        )}
        {msg.provider && !msg.streaming && (
          <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--fg-dim)', opacity: 0.5 }}>
            via {msg.provider}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main AiPanel ─────────────────────────────────────────────────────────────

export function AiPanel() {
  const aiPanelVisible    = useMirageStore((s) => s.aiPanelVisible);
  const setAiPanelVisible = useMirageStore((s) => s.setAiPanelVisible);
  const getActiveSession  = useMirageStore((s) => s.getActiveSession);
  const skin              = useMirageStore((s) => s.skin);

  const [messages,   setMessages]   = useState<DisplayMsg[]>([]);
  const [input,      setInput]      = useState('');
  const [sending,    setSending]    = useState(false);
  const [height,     setHeight]     = useState(360);
  const [minimized,  setMinimized]  = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const abortRef       = useRef<AbortController | null>(null);
  const dragStartY     = useRef<number | null>(null);
  const dragStartH     = useRef<number>(360);

  // Get accent from current skin
  const accent = skin?.palette?.dark?.['accent'] as string ?? '#e5484d';

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (aiPanelVisible && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [aiPanelVisible, minimized]);

  // Listen for external "ai:start" events from the terminal
  useEffect(() => {
    const handler = (e: Event) => {
      const { message, role } = (e as CustomEvent<{ message: string; role: string }>).detail;
      if (role === 'user') {
        setMessages((prev) => [...prev, { role: 'user', content: message }]);
        setAiPanelVisible(true);
        setMinimized(false);
      } else if (role === 'assistant_start') {
        setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }]);
      } else if (role === 'assistant_delta') {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: last.content + message, streaming: true };
          }
          return copy;
        });
      } else if (role === 'assistant_done') {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = { ...last, streaming: false, provider: message };
          }
          return copy;
        });
      }
    };
    window.addEventListener('mirage:ai-message', handler);
    return () => window.removeEventListener('mirage:ai-message', handler);
  }, [setAiPanelVisible]);

  // Send a message directly from the panel input
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);

    const session = getActiveSession();
    const userMsg: ChatMsg = { role: 'user', content: text };

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }]);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const history: ChatMsg[] = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: stripAnsi(m.content) }));

      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, userMsg],
          model:    session.chat.model,
          persona:  session.chat.persona,
          key:      session.chat.byokKey || undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: `Error: ${errData.message ?? 'Request failed'}`, streaming: false };
          }
          return copy;
        });
        return;
      }

      const reader  = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let   buffer  = '';
      let   full    = '';
      let   provider = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const delta = JSON.parse(line.slice(6));
            if (delta.type === 'delta') {
              full += delta.text;
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') {
                  copy[copy.length - 1] = { ...last, content: full, streaming: true };
                }
                return copy;
              });
            } else if (delta.type === 'meta' && (delta.key === 'provider' || delta.key === 'switchedTo')) {
              provider = delta.value as string;
            } else if (delta.type === 'error') {
              full = `Error: ${delta.message}`;
            }
          } catch { /* skip */ }
        }
      }

      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === 'assistant') {
          copy[copy.length - 1] = { ...last, content: full, streaming: false, provider };
        }
        return copy;
      });

    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: 'Request failed. Check your connection.', streaming: false };
          }
          return copy;
        });
      }
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, getActiveSession]);

  // Resize drag handle
  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartY.current = e.clientY;
    dragStartH.current = height;

    const onMove = (me: MouseEvent) => {
      if (dragStartY.current === null) return;
      const delta = dragStartY.current - me.clientY;
      setHeight(Math.max(200, Math.min(window.innerHeight - 80, dragStartH.current + delta)));
    };
    const onUp = () => {
      dragStartY.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [height]);

  if (!aiPanelVisible) return null;

  return (
    <>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .ai-panel-messages::-webkit-scrollbar { width: 4px; }
        .ai-panel-messages::-webkit-scrollbar-track { background: transparent; }
        .ai-panel-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      <div
        style={{
          position:        'fixed',
          bottom:          0,
          right:           0,
          left:            0,
          zIndex:          500,
          display:         'flex',
          flexDirection:   'column',
          height:          minimized ? '42px' : `${height}px`,
          backgroundColor: 'var(--bg)',
          borderTop:       `2px solid ${accent}`,
          boxShadow:       `0 -8px 40px rgba(0,0,0,0.5)`,
          animation:       'slideUp 0.2s ease-out',
          transition:      'height 0.15s ease',
          fontFamily:      'var(--font-ui, system-ui)',
        }}
      >
        {/* ── Resize handle ──────────────────────────────────────── */}
        {!minimized && (
          <div
            onMouseDown={onDragStart}
            style={{
              height:      '4px',
              cursor:      'ns-resize',
              flexShrink:  0,
              background:  `linear-gradient(90deg, transparent, ${accent}44, transparent)`,
            }}
          />
        )}

        {/* ── Panel title bar ────────────────────────────────────── */}
        <div
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             '8px',
            padding:         '0 14px',
            height:          '38px',
            flexShrink:      0,
            borderBottom:    minimized ? 'none' : '1px solid var(--border)',
            backgroundColor: 'var(--bg-elev)',
          }}
        >
          {/* AI indicator dot */}
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: accent, flexShrink: 0 }} />

          {/* Title */}
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--fg)', flex: 1 }}>
            AI Agent
            {sending && <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--fg-dim)', fontWeight: 400 }}>generating…</span>}
          </span>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {/* Clear */}
            <button
              onClick={() => setMessages([])}
              title="Clear conversation"
              style={{ background: 'none', border: 'none', color: 'var(--fg-dim)', cursor: 'pointer', fontSize: '12px', padding: '3px 6px', borderRadius: '4px', lineHeight: 1 }}
            >
              ⊘
            </button>
            {/* Minimize / Restore */}
            <button
              onClick={() => setMinimized((v) => !v)}
              title={minimized ? 'Restore' : 'Minimize'}
              style={{ background: 'none', border: 'none', color: 'var(--fg-dim)', cursor: 'pointer', fontSize: '14px', padding: '3px 6px', borderRadius: '4px', lineHeight: 1 }}
            >
              {minimized ? '▲' : '▼'}
            </button>
            {/* Close */}
            <button
              onClick={() => { setAiPanelVisible(false); abortRef.current?.abort(); }}
              title="Close"
              style={{ background: 'none', border: 'none', color: 'var(--fg-dim)', cursor: 'pointer', fontSize: '16px', padding: '3px 6px', borderRadius: '4px', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* ── Messages ─────────────────────────────────────── */}
            <div
              className="ai-panel-messages"
              style={{
                flex:       1,
                overflowY:  'auto',
                padding:    '12px 14px',
                display:    'flex',
                flexDirection: 'column',
                gap:        '8px',
              }}
            >
              {messages.length === 0 && (
                <div style={{ color: 'var(--fg-dim)', fontSize: '13px', textAlign: 'center', marginTop: '20px', opacity: 0.5 }}>
                  AI responses will appear here.<br />
                  You can also type a message below.
                </div>
              )}
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} accent={accent} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input bar ──────────────────────────────────────── */}
            <div
              style={{
                display:         'flex',
                gap:             '8px',
                padding:         '10px 14px',
                borderTop:       '1px solid var(--border)',
                backgroundColor: 'var(--bg-elev)',
                flexShrink:      0,
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                placeholder="Ask the AI agent…"
                disabled={sending}
                style={{
                  flex:            1,
                  background:      'var(--bg)',
                  color:           'var(--fg)',
                  border:          `1px solid ${input ? accent + '66' : 'var(--border)'}`,
                  borderRadius:    '8px',
                  padding:         '8px 12px',
                  fontSize:        '13px',
                  fontFamily:      'var(--font-mono)',
                  outline:         'none',
                  transition:      'border-color 0.15s',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                style={{
                  padding:         '8px 16px',
                  borderRadius:    '8px',
                  border:          'none',
                  background:      (!input.trim() || sending) ? 'rgba(255,255,255,0.05)' : accent,
                  color:           (!input.trim() || sending) ? 'var(--fg-dim)' : '#fff',
                  fontSize:        '13px',
                  fontWeight:      600,
                  cursor:          (!input.trim() || sending) ? 'default' : 'pointer',
                  transition:      'background 0.15s',
                  flexShrink:      0,
                }}
              >
                {sending ? '…' : '↵'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
