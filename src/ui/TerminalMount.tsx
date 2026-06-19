'use client';

import { useEffect, useRef } from 'react';
import { useUI } from '@/store/ui';
import { manager } from '@/term/manager';
import { applyChrome } from '@/themes/apply';

/** Hosts the live xterm containers (created/owned by the session manager). */
export function TerminalMount() {
  const hostRef = useRef<HTMLDivElement>(null);
  const tabs = useUI((s) => s.tabs);
  const activeTabId = useUI((s) => s.activeTabId);
  const settings = useUI((s) => s.settings);

  // Attach host element once (+ dev hook for e2e tests)
  useEffect(() => {
    manager.setHost(hostRef.current);
    if (process.env.NODE_ENV !== 'production') {
      (window as unknown as Record<string, unknown>).__mirage = {
        feed: (data: string) => manager.feedActive(data),
        activeBuffer: () => manager.activeBufferText(),
      };
    }
    return () => {
      if (process.env.NODE_ENV !== 'production') {
        delete (window as unknown as Record<string, unknown>).__mirage;
      }
      manager.disposeAll();
      manager.setHost(null);
    };
  }, []);

  // Create sessions for new tabs, dispose removed ones
  useEffect(() => {
    for (const t of tabs) manager.ensure(t.id, t.profileId);
    manager.prune(new Set(tabs.map((t) => t.id)));
  }, [tabs]);

  // Show the active session
  useEffect(() => {
    if (activeTabId) manager.activate(activeTabId);
  }, [activeTabId]);

  // Live theme / font updates (no terminal rebuilds)
  useEffect(() => {
    applyChrome(settings.schemeId, settings.mode);
    manager.applySettings();
  }, [settings]);

  return <div ref={hostRef} className="term-host" />;
}
