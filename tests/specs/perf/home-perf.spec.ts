import { test, expect, type PerfCollector } from '../../fixtures/perf';

test.describe('Performance baselines', () => {
  test.describe.configure({ mode: 'serial' });

  test('home page load — render counts', async ({ page, perf, homePage }) => {
    await perf.install();
    await perf.reset();

    await homePage.open();
    // Let the page settle (lazy images, intersection observers, etc.)
    await page.waitForTimeout(2000);

    const snapshot = await perf.captureRenderSnapshot();
    const total = Object.values(snapshot.components).reduce((sum, c) => sum + c.renderCount, 0);

    // Record baselines — these are soft assertions to capture data, not hard gates.
    // The actual counts are logged so they can be compared across runs.
    test
      .info()
      .annotations.push(
        { type: 'perf:total_renders', description: String(total) },
        { type: 'perf:component_count', description: String(Object.keys(snapshot.components).length) }
      );

    // Log the top 20 heaviest components for analysis
    const top20 = Object.entries(snapshot.components)
      .toSorted(([, a], [, b]) => b.renderCount - a.renderCount)
      .slice(0, 20);

    console.log('\n── Home Page Load: Top 20 Components by Render Count ──');
    for (const [name, data] of top20) {
      console.log(`  ${data.renderCount.toString().padStart(5)}  ${name}`);
    }

    // Soft upper bound — flag if total renders exceed a generous threshold
    const slow = await perf.getSlowComponents(50);
    if (slow.length > 0) {
      console.log('\n── Components with >50 renders (potential optimization targets) ──');
      for (const c of slow) {
        console.log(`  ${c.renderCount.toString().padStart(5)}  ${c.name}`);
      }
    }

    expect(total).toBeGreaterThan(0);
  });

  test('home → watch navigation — render counts', async ({ page, perf, homePage }) => {
    await perf.install();

    // Load home page first
    await homePage.open();
    await page.waitForTimeout(1000);

    // Reset counters before navigation
    await perf.reset();

    // Click the first content tile to navigate to a watch page
    await homePage.clickTile(0);
    await page.waitForTimeout(2000);

    const snapshot = await perf.captureRenderSnapshot();
    const total = Object.values(snapshot.components).reduce((sum, c) => sum + c.renderCount, 0);

    test
      .info()
      .annotations.push(
        { type: 'perf:nav_renders', description: String(total) },
        { type: 'perf:nav_component_count', description: String(Object.keys(snapshot.components).length) }
      );

    const top20 = Object.entries(snapshot.components)
      .toSorted(([, a], [, b]) => b.renderCount - a.renderCount)
      .slice(0, 20);

    console.log('\n── Home→Watch Navigation: Top 20 Components by Render Count ──');
    for (const [name, data] of top20) {
      console.log(`  ${data.renderCount.toString().padStart(5)}  ${name}`);
    }

    expect(total).toBeGreaterThan(0);
  });

  test('search flow — render counts', async ({ page, perf, searchPage }) => {
    await perf.install();
    await perf.reset();

    await searchPage.searchFor('bitcoin');
    await page.waitForTimeout(2000);

    const snapshot = await perf.captureRenderSnapshot();
    const total = Object.values(snapshot.components).reduce((sum, c) => sum + c.renderCount, 0);

    test
      .info()
      .annotations.push(
        { type: 'perf:search_renders', description: String(total) },
        { type: 'perf:search_component_count', description: String(Object.keys(snapshot.components).length) }
      );

    const top20 = Object.entries(snapshot.components)
      .toSorted(([, a], [, b]) => b.renderCount - a.renderCount)
      .slice(0, 20);

    console.log('\n── Search Flow: Top 20 Components by Render Count ──');
    for (const [name, data] of top20) {
      console.log(`  ${data.renderCount.toString().padStart(5)}  ${name}`);
    }

    expect(total).toBeGreaterThan(0);
  });

  test('infinite scroll — render counts', async ({ page, perf, homePage }) => {
    await perf.install();

    // Load and settle
    await homePage.open();
    await page.waitForTimeout(1500);

    const beforeTiles = await homePage.getTileCount();

    // Reset before scroll
    await perf.reset();

    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);

    const afterTiles = await homePage.getTileCount();

    const snapshot = await perf.captureRenderSnapshot();
    const total = Object.values(snapshot.components).reduce((sum, c) => sum + c.renderCount, 0);

    test
      .info()
      .annotations.push(
        { type: 'perf:scroll_renders', description: String(total) },
        { type: 'perf:tiles_before', description: String(beforeTiles) },
        { type: 'perf:tiles_after', description: String(afterTiles) }
      );

    const top20 = Object.entries(snapshot.components)
      .toSorted(([, a], [, b]) => b.renderCount - a.renderCount)
      .slice(0, 20);

    console.log('\n── Infinite Scroll: Top 20 Components by Render Count ──');
    for (const [name, data] of top20) {
      console.log(`  ${data.renderCount.toString().padStart(5)}  ${name}`);
    }

    console.log(`\n  Tiles: ${beforeTiles} → ${afterTiles} (+${afterTiles - beforeTiles})`);

    expect(total).toBeGreaterThan(0);
  });
});
