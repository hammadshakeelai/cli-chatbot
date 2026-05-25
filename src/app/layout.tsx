import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mirage — virtual terminal',
  description: 'A browser-based virtual Linux terminal + AI companion',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
