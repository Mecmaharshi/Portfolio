// Prints the /resume page to public/<resume>.pdf so the download always matches the site.
// Usage: npm run build && npm run resume:pdf   (needs Microsoft Edge installed locally)
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const HOST = '127.0.0.1';
const PORT = 4322;
const URL_ = `http://${HOST}:${PORT}/resume`;
const OUT = 'public/maharshi-ishu-jasraj-resume.pdf';

// Run the Astro CLI with this Node directly (no shell), so the server can be stopped cleanly
const server = spawn(
  process.execPath,
  ['node_modules/astro/bin/astro.mjs', 'preview', '--host', HOST, '--port', String(PORT)],
  {
    stdio: 'ignore',
  },
);

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(URL_)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(
    'preview server did not start. Run `npm run build` first, and stop any running preview (`npx astro preview stop`): Astro allows one per project.',
  );
}

try {
  await waitForServer();
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();
  await page.emulateMedia({ media: 'print', colorScheme: 'light' });
  await page.goto(URL_, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: OUT, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  console.log(`wrote ${OUT}`);
} finally {
  server.kill();
}
