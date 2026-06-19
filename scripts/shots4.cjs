// Final check: fixed Mythos banner + light mode.
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
  const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
  await page.goto('http://localhost:3000');
  await waitBuffer(page, 'PS C:\\Users\\user>', 30000);
  await feed(page, 'mythos\r');
  await waitBuffer(page, 'PHASE CRAB');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '19-mythos-fixed.png') });

  // Light mode sanity
  await page.locator('.status-btn[title="Switch to light mode"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '20-light-mode.png') });

  await browser.close();
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
