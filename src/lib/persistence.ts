import { get, set, del } from 'idb-keyval';
import type { VFS } from '@/kernel/vfs';

const VFS_KEY = 'mirage-vfs';
const SESSIONS_KEY = 'mirage-sessions';
const SETTINGS_KEY = 'mirage-settings';

export interface PersistedData {
  vfs: ReturnType<VFS['toJSON']>;
  sessions: Array<{
    id: string;
    label: string;
    type: 'terminal' | 'chat' | 'mythos';
    tabSkin: string | null;
    cwd: string;
    history: string[];
    chatMessages: unknown[];
    chatModel: string;
    chatPersona: string;
    byokKey: string;
  }>;
  settings: {
    skin: string;
    mode: string;
  };
}

export async function saveToIndexedDB(data: PersistedData): Promise<void> {
  try {
    await Promise.all([
      set(VFS_KEY, data.vfs),
      set(SESSIONS_KEY, data.sessions),
      set(SETTINGS_KEY, data.settings),
    ]);
  } catch {
    // IndexedDB unavailable (private browsing, etc.)
  }
}

export async function loadFromIndexedDB(): Promise<Partial<PersistedData>> {
  try {
    const [vfs, sessions, settings] = await Promise.all([
      get<unknown>(VFS_KEY),
      get<unknown>(SESSIONS_KEY),
      get<unknown>(SETTINGS_KEY),
    ]);
    return {
      vfs: vfs as PersistedData['vfs'] | undefined,
      sessions: sessions as PersistedData['sessions'] | undefined,
      settings: settings as PersistedData['settings'] | undefined,
    };
  } catch {
    return {};
  }
}

export async function clearIndexedDB(): Promise<void> {
  try {
    await Promise.all([del(VFS_KEY), del(SESSIONS_KEY), del(SETTINGS_KEY)]);
  } catch {
    // ignore
  }
}
