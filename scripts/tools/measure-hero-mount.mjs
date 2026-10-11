import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const runs = [];

  for (let i = 0; i < 5; i++) {
    const page = await browser.newPage();
    await page.goto('http://localhost:5173/test/dashboard');
    await page.waitForFunction(() => typeof window.__heroMountTime === 'number');
    const time = await page.evaluate(() => window.__heroMountTime);
    runs.push(time);
    await page.close();
  }

  await browser.close();

  runs.sort((a, b) => a - b);
  const median = runs[Math.floor(runs.length / 2)];
  console.log('Hero mount times (ms):', runs.map(r => r.toFixed(2)));
  console.log('Median hero mount time (ms):', median.toFixed(2));
})();
