/**
 * Interactive navigation test: clicks around like a real user, scrolls, checks for errors.
 * Run: REACT_SCAN=1 node tests/scripts/interactive-nav-test.mjs
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:1337';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'Er8vKxWxq19mXaGQMKG5en6UkTAgRY33';

let globalErrors = [];
let globalWarnings = 0;
let apiCounts = {};

function resetCounters() {
  globalErrors = [];
  globalWarnings = 0;
  apiCounts = {};
}

function setupListeners(page) {
  page.on('pageerror', (err) => {
    const msg = err.message.substring(0, 150);
    if (!msg.includes('TenantFeatures') && !msg.includes('postMessage') && !msg.includes('wander.app') && !msg.includes('AudioContext')) {
      globalErrors.push(msg);
    }
  });
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('Unhandled notification_rule') || text.includes('input selector returned')) {
      globalWarnings++;
    }
  });
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/v1/proxy') || url.includes('comments.odysee.tv')) {
      try {
        const body = JSON.parse(req.postData());
        apiCounts[body.method] = (apiCounts[body.method] || 0) + 1;
      } catch {}
    }
  });
}

function report(stepName, elapsed) {
  const errs = globalErrors.length;
  const warns = globalWarnings;
  const cs = apiCounts['claim_search'] || 0;
  const status = errs > 0 ? '✗' : cs > 15 ? '⚠' : '✓';
  const apiSummary = Object.entries(apiCounts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}:${v}`)
    .join(' ');

  console.log(
    `  ${status} ${stepName.padEnd(45)} ${(elapsed + 'ms').padEnd(8)} ${errs ? 'ERR:' + errs : ''} ${warns ? 'w:' + warns : ''} ${apiSummary}`
  );
  if (errs > 0) {
    globalErrors.slice(0, 2).forEach(e => console.log(`      ✗ ${e}`));
  }
  resetCounters();
}

async function scrollDown(page, times = 3) {
  for (let i = 0; i < times; i++) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(500);
  }
}

async function scrollToTop(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

async function timedStep(name, fn) {
  resetCounters();
  const start = Date.now();
  try {
    await fn();
  } catch (e) {
    globalErrors.push(`STEP_ERROR: ${e.message.substring(0, 100)}`);
  }
  report(name, Date.now() - start);
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await context.addCookies([{ name: 'auth_token', value: AUTH_TOKEN, domain: 'localhost', path: '/' }]);
  const page = await context.newPage();
  setupListeners(page);

  console.log('\n' + '='.repeat(80));
  console.log('  INTERACTIVE NAVIGATION TEST (signed in, 1920x1080)');
  console.log('='.repeat(80) + '\n');

  // 1. Fresh homepage load
  await timedStep('1. Homepage (fresh load)', async () => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(6000);
  });

  // 2. Scroll homepage
  await timedStep('2. Homepage scroll down', async () => {
    await scrollDown(page, 5);
    await page.waitForTimeout(2000);
  });

  // 3. Click first video tile on homepage
  await timedStep('3. Click video from homepage (SPA nav)', async () => {
    await scrollToTop(page);
    await page.waitForTimeout(500);
    const videoLink = await page.$('a.claim-preview__wrapper, a.claim-tile__info, .claim-preview-tile a[href^="/@"]');
    if (videoLink) {
      await videoLink.click();
      await page.waitForTimeout(6000);
    } else {
      // Try any claim link
      const anyLink = await page.$('.claim-grid a[href^="/@"], .claim-list a[href^="/@"]');
      if (anyLink) {
        await anyLink.click();
        await page.waitForTimeout(6000);
      } else {
        globalErrors.push('No video link found on homepage');
      }
    }
  });

  // 4. Scroll on video page
  await timedStep('4. Video page scroll (comments)', async () => {
    await scrollDown(page, 4);
    await page.waitForTimeout(3000);
  });

  // 5. Navigate back to homepage via logo
  await timedStep('5. Navigate back via logo (SPA)', async () => {
    const logo = await page.$('.header__navigation-item--logo, .button--logo, a[href="/"]');
    if (logo) {
      await logo.click();
      await page.waitForTimeout(4000);
    } else {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);
    }
  });

  // 6. Navigate to @ComeAndReason channel
  await timedStep('6. Channel page @ComeAndReason', async () => {
    await page.goto(BASE_URL + '/@ComeAndReason:4', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);
  });

  // 7. Click channel tabs
  await timedStep('7. Channel tabs (Playlists)', async () => {
    const playlistTab = await page.$('button:has-text("Playlists"), a:has-text("Playlists"), [role="tab"]:has-text("Playlists")');
    if (playlistTab) {
      await playlistTab.click();
      await page.waitForTimeout(4000);
    } else {
      // Try any tab that might be playlists
      const tabs = await page.$$('.channel-page__tab, .tab__link, button[role="tab"]');
      for (const tab of tabs) {
        const text = await tab.textContent();
        if (text && text.toLowerCase().includes('playlist')) {
          await tab.click();
          await page.waitForTimeout(4000);
          break;
        }
      }
    }
  });

  // 8. Click into a playlist from the channel
  await timedStep('8. Click into a playlist', async () => {
    const playlistLink = await page.$('.claim-preview__wrapper[href*="playlist"], a[href*="/$/playlist/"], .collection-preview a, .claim-preview a');
    if (playlistLink) {
      await playlistLink.click();
      await page.waitForTimeout(5000);
    } else {
      // Try navigating to playlists page and finding one
      const anyLink = await page.$('a[href*="list"]');
      if (anyLink) {
        await anyLink.click();
        await page.waitForTimeout(5000);
      }
    }
    await scrollDown(page, 3);
    await page.waitForTimeout(2000);
  });

  // 9. Navigate to Playlists page
  await timedStep('9. Playlists page (SPA nav)', async () => {
    await page.goto(BASE_URL + '/$/playlists', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);
  });

  // 10. Click into first playlist
  await timedStep('10. Click first playlist', async () => {
    const playlist = await page.$('.claim-preview a, .collection-preview a, a[href*="list"]');
    if (playlist) {
      await playlist.click();
      await page.waitForTimeout(5000);
    }
  });

  // 11. Click play button on playlist
  await timedStep('11. Click play on playlist', async () => {
    const playBtn = await page.$('button:has-text("Play"), button:has-text("Shuffle"), .playlist-play-button, button[aria-label*="Play"]');
    if (playBtn) {
      await playBtn.click();
      await page.waitForTimeout(5000);
    } else {
      // Try first item in playlist
      const firstItem = await page.$('.claim-list a[href^="/@"], .collection-items a[href^="/@"]');
      if (firstItem) {
        await firstItem.click();
        await page.waitForTimeout(5000);
      }
    }
  });

  // 12. Search via SPA
  await timedStep('12. Search "bitcoin" (SPA nav)', async () => {
    const searchInput = await page.$('input[type="search"], .wunderbar__input, input[name="q"]');
    if (searchInput) {
      await searchInput.click();
      await searchInput.fill('bitcoin');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
    } else {
      await page.goto(BASE_URL + '/$/search?q=bitcoin', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);
    }
  });

  // 13. Scroll search results
  await timedStep('13. Scroll search results', async () => {
    await scrollDown(page, 4);
    await page.waitForTimeout(2000);
  });

  // 14. Click a search result
  await timedStep('14. Click search result (SPA nav)', async () => {
    const result = await page.$('.claim-preview a[href^="/@"], .search__results a[href^="/@"]');
    if (result) {
      await result.click();
      await page.waitForTimeout(5000);
    }
  });

  // 15. Watch History
  await timedStep('15. Watch History page', async () => {
    await page.goto(BASE_URL + '/$/library/watch', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(4000);
    await scrollDown(page, 3);
    await page.waitForTimeout(2000);
  });

  // 16. Settings (SPA)
  await timedStep('16. Settings page', async () => {
    await page.goto(BASE_URL + '/$/settings', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(4000);
    await scrollDown(page, 3);
    await page.waitForTimeout(1000);
  });

  // 17. Final heap check
  const finalPerf = await page.evaluate(() => ({
    domNodes: document.querySelectorAll('*').length,
    heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 'n/a',
  }));
  console.log(`\n  Final state: DOM ${finalPerf.domNodes} nodes, Heap ${finalPerf.heapMB}MB`);

  console.log('\n' + '='.repeat(80));
  console.log('  DONE — browser stays open for manual inspection');
  console.log('='.repeat(80) + '\n');

  await new Promise(() => {});
}

main().catch(console.error);
