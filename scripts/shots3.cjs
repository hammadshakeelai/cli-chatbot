// Banner check for the remaining agents: mythos, opencode, codex, copilot.
const { chromium } = require('@playwright/test');
const path = require('path');

const OUT = path.join(__dirname, '..', 'shots');

async function buffer(page) {
  return page.evaluate(() => window.__mirage ? window.__mirage.activeBuffer() : '');
}
async function feed(page, text) {
  await page.evaluate((t) => window.__mirage.feed(t), text);
}
async function waitBuffer(page, needle, timeout = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if ((await buffer(page)).includes(needle)) return true;
    await page.waitForTimeout(200);
  }
  return false;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
  await page.goto('http://localhost:3000');
  await waitBuffer(page, 'PS C:\\Users\\user>');

  await feed(page, 'mythos\r');
  await waitBuffer(page, 'PHASE CRAB');
  await feed(page, '/exit\r');
  await waitBuffer(page, 'severed');
  await feed(page, 'opencode\r');
  await waitBuffer(page, 'open-source terminal agent');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '16-mythos-opencode.png') });

  await feed(page, '/exit\r');
  await page.waitForTimeout(300);
  await feed(page, 'cls\r');
  await page.waitForTimeout(300);
  await feed(page, 'codex\r');
  await waitBuffer(page, 'OpenAI Codex');
  await feed(page, '/exit\r');
  await page.waitForTimeout(300);
  await feed(page, 'copilot\r');
  await waitBuffer(page, 'GitHub Copilot CLI');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '17-codex-copilot.png') });

  // also: help screen + winget theater quickly
  await feed(page, '/exit\r');
  await page.waitForTimeout(300);
  await feed(page, 'cls\r');
  await feed(page, 'help\r');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '18-help.png') });

  await browser.close();
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
