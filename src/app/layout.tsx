import type { Metadata } from 'next';
import './globals.css';
import { CrtOverlay } from '@/themes/fx/CrtOverlay';

export const metadata: Metadata = {
  title: 'Mirage — virtual terminal',
  description: 'A browser-based virtual Linux terminal + AI companion',
};

const INLINE_THEME_SCRIPT = `
(function(){
  try {
    var skin = localStorage.getItem('mirage-skin') || 'claude-code';
    var mode = localStorage.getItem('mirage-mode') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-skin', skin);
    document.documentElement.setAttribute('data-mode', mode);
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INLINE_THEME_SCRIPT }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
      </head>
      <body className="antialiased">
        {children}
        <CrtOverlay />
      </body>
    </html>
  );
}
