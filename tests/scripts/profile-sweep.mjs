import { chromium } from 'playwright';

const HOOK_SCRIPT = `
  window.__PR = {}; window.__PC = 0;
  var h = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (h) {
  var o = h.onCommitFiberRoot;
  h.onCommitFiberRoot = function(r, root) {
    window.__PC++;
    try { (function w(f){if(!f)return;if(f.type&&typeof f.type==='function'){var n=f.type.displayName||f.type.name||'A';window.__PR[n]=(window.__PR[n]||0)+1;}w(f.child);w(f.sibling);})(root.current); } catch(e){}
    if(o) return o.apply(this,arguments);
  };
  }
`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:1337', { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.evaluate(HOOK_SCRIPT);

  const routes = {
    home: '/',
    'channel (@Odysee)': '/@Odysee',
    'channel content': '/@Odysee?tab=content',
    'channel playlists': '/@Odysee?tab=playlists',
    'channel community': '/@Odysee?tab=discussion',
    'channel about': '/@Odysee?tab=about',
    gaming: '/$/gaming',
    music: '/$/music',
    news: '/$/news',
    'search (bitcoin)': '/$/search?q=bitcoin',
    'search (odysee)': '/$/search?q=odysee',
    settings: '/$/settings',
    notifications: '/$/notifications',
    playlists: '/$/playlists',
    library: '/$/library',
    'watch history': '/$/watchhistory',
    shorts: '/$/shorts',
    following: '/$/following',
    'following manage': '/$/following/manage',
    'following discover': '/$/following/discover',
    wallet: '/$/wallet',
    'live now': '/$/livenow',
    discover: '/$/discover',
    top: '/$/top',
    uploads: '/$/uploads',
    channels: '/$/channels',
  };

  console.log('Page'.padEnd(24) + '| commits | renders  | top 3');
  console.log('-'.repeat(110));

  for (const [name, route] of Object.entries(routes)) {
    await page.evaluate(() => {
      window.__PR = {};
      window.__PC = 0;
    });
    await page.evaluate((r) => {
      window.history.pushState({}, '', r);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, route);
    await page.waitForTimeout(4000);
    const data = await page.evaluate(() => ({ r: window.__PR || {}, c: window.__PC || 0 }));
    const total = Object.values(data.r).reduce((s, c) => s + c, 0);
    const top3 = Object.entries(data.r)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    console.log(
      name.padEnd(24) +
        '| ' +
        String(data.c).padStart(7) +
        ' | ' +
        String(total).padStart(8) +
        ' | ' +
        top3.map(([n, c]) => n + '=' + c).join(', ')
    );
  }

  // -- Watch page via click --
  await page.evaluate(() => {
    window.__PR = {};
    window.__PC = 0;
  });
  await page.evaluate(() => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    window.__PR = {};
    window.__PC = 0;
  });
  await page.evaluate(() => {
    const link = document.querySelector('.claim-tile__header a');
    if (link) link.click();
  });
  await page.waitForTimeout(6000);
  let data = await page.evaluate(() => ({ r: window.__PR || {}, c: window.__PC || 0 }));
  let total = Object.values(data.r).reduce((s, c) => s + c, 0);
  let top = Object.entries(data.r)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  console.log(
    'watch (click)'.padEnd(24) +
      '| ' +
      String(data.c).padStart(7) +
      ' | ' +
      String(total).padStart(8) +
      ' | ' +
      top.map(([n, c]) => n + '=' + c).join(', ')
  );

  // -- Comments scroll --
  await page.evaluate(() => {
    window.__PR = {};
    window.__PC = 0;
  });
  await page.evaluate(() => window.scrollTo(0, 2000));
  await page.waitForTimeout(5000);
  data = await page.evaluate(() => ({ r: window.__PR || {}, c: window.__PC || 0 }));
  total = Object.values(data.r).reduce((s, c) => s + c, 0);
  top = Object.entries(data.r)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  console.log(
    'watch+comments scroll'.padEnd(24) +
      '| ' +
      String(data.c).padStart(7) +
      ' | ' +
      String(total).padStart(8) +
      ' | ' +
      top.map(([n, c]) => n + '=' + c).join(', ')
  );

  // -- Sidebar expand --
  await page.evaluate(() => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    window.__PR = {};
    window.__PC = 0;
  });
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Menu"], .header__navigation-item--menu');
    if (btn) btn.click();
  });
  await page.waitForTimeout(2000);
  data = await page.evaluate(() => ({ r: window.__PR || {}, c: window.__PC || 0 }));
  total = Object.values(data.r).reduce((s, c) => s + c, 0);
  top = Object.entries(data.r)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  console.log(
    'sidebar expand'.padEnd(24) +
      '| ' +
      String(data.c).padStart(7) +
      ' | ' +
      String(total).padStart(8) +
      ' | ' +
      top.map(([n, c]) => n + '=' + c).join(', ')
  );

  // -- Chrome Performance Metrics --
  console.log('\n' + '='.repeat(90));
  console.log('Chrome Performance Metrics (fresh page load, 6s settle)');
  console.log('='.repeat(90));
  console.log('Page'.padEnd(22) + 'layouts  styles  script    layout    heap');

  const perfPages = {
    home: 'http://localhost:1337/',
    'search (odysee)': 'http://localhost:1337/$/search?q=odysee',
    channel: 'http://localhost:1337/@Odysee',
    music: 'http://localhost:1337/$/music',
    notifications: 'http://localhost:1337/$/notifications',
    settings: 'http://localhost:1337/$/settings',
  };

  for (const [name, url] of Object.entries(perfPages)) {
    const p = await browser.newPage();
    const client = await p.context().newCDPSession(p);
    await client.send('Performance.enable');
    await p.goto(url, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(6000);
    const metrics = await client.send('Performance.getMetrics');
    const m = {};
    metrics.metrics.forEach((x) => (m[x.name] = x.value));
    console.log(
      name.padEnd(22) +
        String(m.LayoutCount).padStart(5) +
        '   ' +
        String(m.RecalcStyleCount).padStart(5) +
        '   ' +
        m.ScriptDuration.toFixed(2) +
        's   ' +
        m.LayoutDuration.toFixed(3) +
        's   ' +
        (m.JSHeapUsedSize / 1024 / 1024).toFixed(0) +
        'MB'
    );
    await p.close();
  }

  await page.close();
  await browser.close();
}

main().catch(console.error);
