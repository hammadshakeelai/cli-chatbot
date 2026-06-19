import { AGENT_DEFS } from './defs';
import type { AgentDef } from './types';

export const AGENTS: AgentDef[] = AGENT_DEFS;

const byCommand = new Map<string, AgentDef>(AGENTS.map((a) => [a.command.toLowerCase(), a]));
const byId = new Map<string, AgentDef>(AGENTS.map((a) => [a.id, a]));

export function agentByCommand(cmd: string): AgentDef | undefined {
  return byCommand.get(cmd.toLowerCase());
}

export function agentById(id: string): AgentDef | undefined {
  return byId.get(id);
}
