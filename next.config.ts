import type { NextConfig } from 'next';

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://generativelanguage.googleapis.com https://api.groq.com https://openrouter.ai https://api.x.ai",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  devIndicators: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp.join('; ') },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

// @next/bundle-analyzer — enabled via ANALYZE=true env var (e.g. `npm run analyze`)
const config: NextConfig = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })(nextConfig)
  : nextConfig;

export default config;
