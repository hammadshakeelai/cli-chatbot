// Focused re-test: agent failure guidance + /help + interrupt behavior.
const { chromium } = require('@playwright/test');
const path = require('path');

const OUT = path.join(__dirname, '..', 'shots');

async function buffer(page) {
  return page.evaluate(() => window.__mirage ? window.__mirage.activeBuffer() : '');
}
async function feed(page, text) {
  await page.evaluate((t) => window.__mirage.feed(t), text);
}
async function waitBuffer(page, needle, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if ((await buffer(page)).includes(needle)) return true;
    await page.waitForTimeout(250);
  }
  return false;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:3000');
  await waitBuffer(page, 'PS C:\\Users\\user>');

  await feed(page, 'claude\r');
  await waitBuffer(page, 'Welcome to Claude Code');
  await feed(page, 'review the utils file in my project\r');
  const gotHelp = await waitBuffer(page, 'free keys:', 30000);
  console.log('graceful key guidance shown:', gotHelp);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '13-key-guidance.png') });

  await feed(page, '/help\r');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '14-agent-help.png') });

  // /status then exit back to PowerShell
  await feed(page, '/status\r');
  await page.waitForTimeout(400);
  await feed(page, '/exit\r');
  const backToPs = await waitBuffer(page, 'Goodbye', 5000);
  await page.waitForTimeout(400);
  const buf = await buffer(page);
  console.log('back to PS prompt:', /PS C:\\Users\\user>\s*$/.test(buf.trimEnd()) || buf.includes('PS C:\\Users\\user>'));
  console.log('farewell shown:', backToPs);
  await page.screenshot({ path: path.join(OUT, '15-exit-flow.png') });

  await browser.close();
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
