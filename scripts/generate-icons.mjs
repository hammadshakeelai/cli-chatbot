/**
 * Generate PWA icons for Mirage Terminal.
 * Creates 192x192 and 512x512 PNG icons from a terminal-themed SVG.
 *
 * Usage: node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Terminal-themed SVG icon — a glowing terminal window with a prompt
function createIconSvg(size) {
  // Scale everything proportionally
  const pad = Math.round(size * 0.08);
  const inner = size - pad * 2;
  const cornerRadius = Math.round(inner * 0.12);
  const fontSize = Math.round(size * 0.14);
  const chevronSize = Math.round(size * 0.08);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#0f0f1a"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00ff88" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#00ff88" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <!-- Background circle -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#bg)"/>
  <!-- Glow effect -->
  <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${cornerRadius}" fill="url(#glow)"/>
  <!-- Terminal window frame -->
  <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${cornerRadius}" fill="none" stroke="#00ff88" stroke-width="${Math.max(1.5, Math.round(size * 0.015))}" stroke-opacity="0.6"/>
  <!-- Title bar dots -->
  <circle cx="${pad + inner * 0.08}" cy="${pad + inner * 0.08}" r="${Math.round(size * 0.018)}" fill="#ff5f57"/>
  <circle cx="${pad + inner * 0.14}" cy="${pad + inner * 0.08}" r="${Math.round(size * 0.018)}" fill="#febc2e"/>
  <circle cx="${pad + inner * 0.20}" cy="${pad + inner * 0.08}" r="${Math.round(size * 0.018)}" fill="#28c840"/>
  <!-- Prompt line -->
  <text x="${pad + inner * 0.12}" y="${pad + inner * 0.52}" font-family="monospace, Courier, sans-serif" font-size="${fontSize}" fill="#00ff88" font-weight="bold">$</text>
  <text x="${pad + inner * 0.22}" y="${pad + inner * 0.52}" font-family="monospace, Courier, sans-serif" font-size="${fontSize}" fill="#cccccc">mirage</text>
  <!-- Cursor blink -->
  <rect x="${pad + inner * 0.62}" y="${pad + inner * 0.38}" width="${Math.round(size * 0.025)}" height="${Math.round(size * 0.06)}" rx="1" fill="#00ff88" opacity="0.8">
    <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.2s" repeatCount="indefinite"/>
  </rect>
  <!-- Second line: command output -->
  <text x="${pad + inner * 0.12}" y="${pad + inner * 0.7}" font-family="monospace, Courier, sans-serif" font-size="${Math.round(fontSize * 0.85)}" fill="#888888">ready</text>
  <text x="${pad + inner * 0.55}" y="${pad + inner * 0.7}" font-family="monospace, Courier, sans-serif" font-size="${Math.round(fontSize * 0.85)}" fill="#00ff88" opacity="0.7">✦</text>
</svg>`;
}

async function generateIcons() {
  const sizes = [192, 512];

  for (const size of sizes) {
    const svg = createIconSvg(size);
    const svgBuffer = Buffer.from(svg);

    const pngPath = join(publicDir, `icon-${size}.png`);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(pngPath);

    console.log(`✓ Generated ${pngPath} (${size}x${size})`);
  }
}

// Also generate a pure SVG version for modern browsers
function generateSvgIcon() {
  const svg = createIconSvg(512).replace('<animate ', '<!-- <animate ').replace('</animate>', '</animate> -->');
  const svgPath = join(publicDir, 'icon.svg');
  writeFileSync(svgPath, svg);
  console.log(`✓ Generated ${svgPath}`);
}

async function main() {
  console.log('Generating PWA icons for Mirage Terminal...\n');
  await generateIcons();
  generateSvgIcon();
  console.log('\nDone! All icons generated.');
}

main().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
