import { AGENTS } from './registry';

export interface Profile {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  accent: string;
  kind: 'shell' | 'agent';
  /** Command auto-typed into the shell when the tab opens. */
  command?: string;
}

export const SHELL_PROFILE: Profile = {
  id: 'powershell',
  label: 'Windows PowerShell',
  sublabel: 'C:\\Users\\user',
  icon: '>_',
  accent: '#4cc2ff',
  kind: 'shell',
};

export const AGENT_PROFILES: Profile[] = AGENTS.map((a) => ({
  id: a.id,
  label: a.label,
  sublabel: a.sublabel,
  icon: a.icon,
  accent: a.accent,
  kind: 'agent' as const,
  command: a.command,
}));

export const PROFILES: Profile[] = [SHELL_PROFILE, ...AGENT_PROFILES];

export function profileById(id: string): Profile {
  return PROFILES.find((p) => p.id === id) ?? SHELL_PROFILE;
}
