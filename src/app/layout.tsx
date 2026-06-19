import type { Metadata, Viewport } from 'next';
import './globals.css';
import '@xterm/xterm/css/xterm.css';

export const metadata: Metadata = {
  title: 'Mirage Terminal — a PowerShell that isn\'t there',
  description:
    'A simulated Windows PowerShell in the browser with convincing AI agent CLIs — Claude Code, Antigravity, Gemini CLI and more.',
};

export const viewport: Viewport = {
  themeColor: '#1c1c1c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

const INLINE_THEME = `
(function(){
  try {
    var raw = localStorage.getItem('mirage2:settings');
    var s = raw ? JSON.parse(raw) : {};
    document.documentElement.setAttribute('data-scheme', s.schemeId || 'campbell');
    document.documentElement.setAttribute('data-mode', s.mode || 'dark');
    if ((s.mode || 'dark') === 'light') {
      document.documentElement.style.setProperty('--bg', '#fafafa');
      document.documentElement.style.setProperty('--titlebar', '#e8e8e8');
      document.documentElement.style.setProperty('--fg', '#383a42');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INLINE_THEME }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
