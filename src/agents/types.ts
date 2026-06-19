export interface BannerCtx {
  cwd: string;
  cols: number;
}

export type TheaterTool = 'read' | 'grep' | 'bash' | 'edit' | 'web' | 'browse';

export interface AgentDef {
  id: string;
  /** Binary name typed in the shell to launch it. */
  command: string;
  label: string;
  sublabel: string;
  /** Glyph used in tabs / menus. */
  icon: string;
  accent: string;
  /** Optional gradient end for banners. */
  accent2?: string;
  /** Fictional model name shown in the UI. */
  displayModel: string;
  /** Actual provider:model used for the API call. */
  realModel: string;
  persona: string;
  spinnerVerbs: string[];
  spinnerFrames: string[];
  /** Prompt prefix shown at the input line (ANSI allowed). */
  promptGlyph: string;
  /** Glyph before the streamed reply. */
  replyGlyph: string;
  /** Glyph before simulated tool calls. */
  toolGlyph: string;
  ghost?: string;
  /** Antigravity-style: print an animated plan checklist instead of tool calls. */
  planning?: boolean;
  /** Names used for simulated tools, per category. */
  toolNames?: Partial<Record<TheaterTool, string>>;
  banner(ctx: BannerCtx): string[];
  farewell: string;
  /** Optional dim footer after a reply. */
  footer?(ms: number, chars: number): string | undefined;
}
