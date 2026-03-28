/**
 * React render profiler: patches React DevTools hook post-mount to count renders.
 * Run: node tests/scripts/react-scan-profile.mjs
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:1337';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'Er8vKxWxq19mXaGQMKG5en6UkTAgRY33';
const SETTLE_MS = 5000;

async function installProfiler(page) {
  return page.evaluate(() => {
    window.__rc = {};
    window.__rt = 0;
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook || hook.__profiled) return 'already_patched_or_no_hook';
    hook.__profiled = true;
    const origCommit = hook.onCommitFiberRoot;

    // Must live inside page.evaluate so it exists in the browser context.
    // eslint-disable-next-line unicorn/consistent-function-scoping
    function walkFiberTree(fiber) {
      if (!fiber) return;

      if (fiber.alternate) {
        const name = fiber.type?.displayName || fiber.type?.name;
        if (name && typeof name === 'string' && /^[A-Z]/.test(name)) {
          window.__rc[name] = (window.__rc[name] || 0) + 1;
          window.__rt++;
        }
      }

      walkFiberTree(fiber.child);
      walkFiberTree(fiber.sibling);
    }

    hook.onCommitFiberRoot = function (id, root, ...rest) {
      try {
        walkFiberTree(root?.current);
      } catch {}

      return origCommit.call(this, id, root, ...rest);
    };

    return 'patched';
  });
}

function resetCounts(page) {
  return page.evaluate(() => {
    window.__rc = {};
    window.__rt = 0;
  });
}

function getCounts(page) {
  return page.evaluate(() => {
    const counts = window.__rc || {};
    const total = window.__rt || 0;
    const top = Object.entries(counts)
      .toSorted((a, b) => b[1] - a[1])
      .slice(0, 20);

    return { total, top, nComps: Object.keys(counts).length };
  });
}

async function scroll(page, n = 3) {
  for (let i = 0; i < n; i++) {
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(400);
  }
}

function printPage(name, ms, data, perf, errors) {
  const status = errors.length ? 'x' : data.total > 5000 ? '!' : 'OK';

  console.log(
    `\n  ${status} ${name}  (${ms}ms, ${data.total} renders, ${data.nComps} components, DOM:${perf.dom} Heap:${perf.heap}MB)`
  );

  if (errors.length) {
    errors.slice(0, 2).forEach((error) => console.log(`      x ${error}`));
  }

  if (data.top.length) {
    console.log('    Top renderers:');
    data.top.forEach(([component, count]) => {
      const pct = data.total ? Math.round((count / data.total) * 100) : 0;
      const bar = '#'.repeat(Math.min(30, Math.round(pct * 0.3)));
      console.log(`      ${String(count).padStart(5)}  ${(pct + '%').padStart(4)}  ${component.padEnd(35)} ${bar}`);
    });
  } else {
    console.log('    (no renders captured)');
  }
}

async function profilePage(page, name, navFn, opts = {}) {
  const errors = [];
  const handlePageError = (err) => {
    const message = err.message;
    if (!/TenantFeatures|postMessage|wander\.app|AudioContext/.test(message)) {
      errors.push(message.substring(0, 120));
    }
  };

  page.on('pageerror', handlePageError);

  const startedAt = Date.now();
  await navFn();
  await page.waitForTimeout(2000);
  await installProfiler(page);
  await resetCounts(page);

  // Measure steady-state renders after initial load.
  await page.waitForTimeout(SETTLE_MS);
  await scroll(page, opts.scroll || 3);
  await page.waitForTimeout(2000);

  const data = await getCounts(page);
  const perf = await page.evaluate(() => ({
    dom: document.querySelectorAll('*').length,
    heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 'n/a',
  }));
  const elapsed = Date.now() - startedAt;

  page.off('pageerror', handlePageError);

  printPage(name, elapsed, data, perf, errors);
  return { name, data, errors };
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await ctx.addCookies([{ name: 'auth_token', value: AUTH_TOKEN, domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();

  console.log('\n' + '='.repeat(80));
  console.log('  REACT RENDER PROFILER - signed in, 1920x1080');
  console.log('  Measures renders AFTER initial load (steady-state + scroll)');
  console.log('='.repeat(80));

  // 1. Homepage
  await profilePage(page, 'Homepage', () =>
    page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 15000 })
  );

  // 2. Click a video from homepage (SPA)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await installProfiler(page);
  await resetCounts(page);
  const homepageVideoStartedAt = Date.now();
  const videoLink = await page.$('.claim-grid a[href^="/@"], .claim-preview a[href^="/@"]');
  if (videoLink) {
    await videoLink.click();
    await page.waitForTimeout(SETTLE_MS);
    await scroll(page, 3);
    await page.waitForTimeout(2000);
  }
  const homepageVideoData = await getCounts(page);
  const homepageVideoPerf = await page.evaluate(() => ({
    dom: document.querySelectorAll('*').length,
    heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 'n/a',
  }));
  printPage(
    'Homepage -> Video (SPA click)',
    Date.now() - homepageVideoStartedAt,
    homepageVideoData,
    homepageVideoPerf,
    []
  );

  // 3. Channel @ComeAndReason
  await profilePage(
    page,
    'Channel @ComeAndReason',
    () => page.goto(BASE_URL + '/@ComeAndReason:4', { waitUntil: 'domcontentloaded', timeout: 15000 }),
    { scroll: 5 }
  );

  // 4. Playlists tab (SPA click)
  await installProfiler(page);
  await resetCounts(page);
  const playlistsTabStartedAt = Date.now();
  const playlistsTab = await page.$('button:has-text("Playlists"), a:has-text("Playlists")');
  if (playlistsTab) {
    await playlistsTab.click();
    await page.waitForTimeout(SETTLE_MS);
    await scroll(page, 2);
    await page.waitForTimeout(1500);
  }
  const playlistsTabData = await getCounts(page);
  const playlistsTabPerf = await page.evaluate(() => ({
    dom: document.querySelectorAll('*').length,
    heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 'n/a',
  }));
  printPage(
    'Channel -> Playlists tab (SPA)',
    Date.now() - playlistsTabStartedAt,
    playlistsTabData,
    playlistsTabPerf,
    []
  );

  // 5. Click into a playlist
  await profilePage(page, 'Click playlist from channel', async () => {
    const playlist = await page.$('.claim-preview a[href^="/@"], a.collection-preview');
    if (playlist) {
      await playlist.click();
    } else {
      await page.goto(BASE_URL + '/$/playlist/fave', { waitUntil: 'domcontentloaded', timeout: 15000 });
    }
  });

  // 6. Playlists page
  await profilePage(page, 'My Playlists page', () =>
    page.goto(BASE_URL + '/$/playlists', { waitUntil: 'domcontentloaded', timeout: 15000 })
  );

  // 7. Search
  await profilePage(page, 'Search "bitcoin"', () =>
    page.goto(BASE_URL + '/$/search?q=bitcoin', { waitUntil: 'domcontentloaded', timeout: 15000 })
  );

  // 8. Notifications
  await profilePage(page, 'Notifications', () =>
    page.goto(BASE_URL + '/$/notifications', { waitUntil: 'domcontentloaded', timeout: 15000 })
  );

  // 9. Settings
  await profilePage(page, 'Settings', () =>
    page.goto(BASE_URL + '/$/settings', { waitUntil: 'domcontentloaded', timeout: 15000 })
  );

  console.log('\n' + '='.repeat(80));
  console.log('  Browser open for manual React Scan inspection. Kill when done.');
  console.log('='.repeat(80) + '\n');
  await new Promise(() => {});
}

main().catch(console.error);
