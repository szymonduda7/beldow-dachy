import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const width = Number(process.argv[4]) || 1440;
const height = Number(process.argv[5]) || 900;

const dir = './temporary screenshots';
fs.mkdirSync(dir, { recursive: true });

let n = 1;
while (fs.existsSync(path.join(dir, `screenshot-${n}${label ? '-' + label : ''}.png`))) n++;
const outPath = path.join(dir, `screenshot-${n}${label ? '-' + label : ''}.png`);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width, height });
await page.goto(url, { waitUntil: 'networkidle0' });

// Scroll through the full page first so scroll-triggered IntersectionObserver
// reveals actually fire (a beyond-viewport fullPage screenshot never scrolls
// the real viewport, so .reveal elements would otherwise stay opacity:0).
await page.evaluate(async (viewportHeight) => {
  const prevBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  const step = Math.round(viewportHeight * 0.8);
  const scrollHeight = document.body.scrollHeight;
  for (let y = 0; y < scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 150));
  }
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 500));
  document.documentElement.style.scrollBehavior = prevBehavior;
}, height);

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved ${outPath}`);
