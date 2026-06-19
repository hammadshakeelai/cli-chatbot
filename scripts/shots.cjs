// Visual verification: drives the app headlessly and saves screenshots.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'shots');
const BASE = 'http://localhost:3000';

async function buffer(page) {
  return page.evaluate(() => window.__mirage ? window.__mirage.activeBuffer() : '');
}
async function feed(page, text) {
  await page.evaluate((t) => window.__mirage.feed(t), text);
}
async function waitBuffer(page, needle, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const b = await buffer(page);
    if (b.includes(needle)) return true;
    await page.waitForTimeout(250);
  }
  return false;
}
async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name) });
  console.log('shot:', name);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(BASE);
  await waitBuffer(page, 'PS C:\\Users\\user>');
  await page.waitForTimeout(400);
  await shot(page, '01-powershell-boot.png');

  await feed(page, 'dir\r');
  await page.waitForTimeout(500);
  await feed(page, 'winfetch\r');
  await page.waitForTimeout(600);
  await shot(page, '02-dir-winfetch.png');

  await feed(page, 'claude\r');
  await waitBuffer(page, 'Welcome to Claude Code');
  await page.waitForTimeout(300);
  await shot(page, '03-claude-banner.png');

  // Real AI roundtrip (verifies spinner → theater → streaming)
  await feed(page, 'explain what this demo-app project does, briefly\r');
  await page.waitForTimeout(2500);
  await shot(page, '04-claude-thinking.png');
  const ok = await waitBuffer(page, 'PS C', 1) ? false : await waitBuffer(page, '⏺', 25000);
  await page.waitForTimeout(9000);
  await shot(page, '05-claude-reply.png');
  console.log('claude replied glyph found:', ok);

  await feed(page, '/exit\r');
  await page.waitForTimeout(600);

  // Profile dropdown
  await page.locator('.titlebar-btn[aria-label="Profile menu"]').click();
  await page.waitForTimeout(300);
  await shot(page, '06-profile-menu.png');

  // Antigravity tab
  await page.getByText('Antigravity', { exact: false }).first().click();
  await waitBuffer(page, 'agent-first', 12000);
  await page.waitForTimeout(800);
  await shot(page, '07-antigravity.png');

  // Gemini tab via menu
  await page.locator('.titlebar-btn[aria-label="Profile menu"]').click();
  await page.getByText('Gemini CLI', { exact: false }).first().click();
  await waitBuffer(page, 'Tips for getting started', 12000);
  await page.waitForTimeout(500);
  await shot(page, '08-gemini.png');

  // Settings dialog
  await page.locator('.status-btn[title="Settings (Ctrl+,)"]').click();
  await page.waitForTimeout(350);
  await shot(page, '09-settings.png');

  // Dracula scheme
  await page.locator('.scheme-card', { hasText: 'Dracula' }).click();
  await page.waitForTimeout(350);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await shot(page, '10-dracula.png');

  // Command palette
  await page.keyboard.press('Control+Shift+P');
  await page.waitForTimeout(350);
  await shot(page, '11-palette.png');
  await page.keyboard.press('Escape');

  // Mobile viewport
  await page.setViewportSize({ width: 390, height: 760 });
  await page.waitForTimeout(700);
  await shot(page, '12-mobile.png');

  await browser.close();
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
