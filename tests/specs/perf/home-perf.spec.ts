import { test, expect } from '../../fixtures/perf';

test.describe('Performance baselines', () => {
  test.describe.configure({ mode: 'serial' });

  test('home page load — render counts', async ({ page, perf, homePage }) => {
    await homePage.open();
    await perf.installViaEvaluate();
    await page.waitForTimeout(5000);

    const snapshot = await perf.captureRenderSnapshot();
    const commits = await perf.getCommitCount();
    const total = Object.values(snapshot.components).reduce((sum, c) => sum + c.renderCount, 0);

    test
      .info()
      .annotations.push(
        { type: 'perf:total_renders', description: String(total) },
        { type: 'perf:commits', description: String(commits) },
        { type: 'perf:component_count', description: String(Object.keys(snapshot.components).length) }
      );

    console.log(`\n── Home Page Load: ${commits} commits, ${total} total renders ──`);
    const top30 = Object.entries(snapshot.components)
      .toSorted(([, a], [, b]) => b.renderCount - a.renderCount)
      .slice(0, 30);

    for (const [name, data] of top30) {
      console.log(`  ${data.renderCount.toString().padStart(5)}  ${name}`);
    }

    const slow = await perf.getSlowComponents(20);
    if (slow.length > 0) {
      console.log(`\n── ${slow.length} components with >20 renders ──`);
      for (const c of slow.slice(0, 40)) {
        console.log(`  ${c.renderCount.toString().padStart(5)}  ${c.name}`);
      }
    }

    expect(total).toBeGreaterThan(0);
  });

  test('home → watch navigation — render counts', async ({ page, perf, homePage }) => {
    await homePage.open();
    await perf.installViaEvaluate();
    await page.waitForTimeout(2000);

    await perf.reset();

    const claimLink = page.locator('.claim-tile__header a, .claim-preview__title').first();
    await claimLink.waitFor({ state: 'visible', timeout: 15_000 });
    await claimLink.click();
    await page.waitForTimeout(3000);

    const snapshot = await perf.captureRenderSnapshot();
    const commits = await perf.getCommitCount();
    const total = Object.values(snapshot.components).reduce((sum, c) => sum + c.renderCount, 0);

    test
      .info()
      .annotations.push(
        { type: 'perf:nav_renders', description: String(total) },
        { type: 'perf:nav_commits', description: String(commits) }
      );

    console.log(`\n── Home→Watch Navigation: ${commits} commits, ${total} renders ──`);
    const top20 = Object.entries(snapshot.components)
      .toSorted(([, a], [, b]) => b.renderCount - a.renderCount)
      .slice(0, 20);

    for (const [name, data] of top20) {
      console.log(`  ${data.renderCount.toString().padStart(5)}  ${name}`);
    }

    expect(total).toBeGreaterThan(0);
  });

  test('search flow — render counts', async ({ page, perf, searchPage }) => {
    await searchPage.searchFor('bitcoin');
    await perf.installViaEvaluate();
    await page.waitForTimeout(3000);

    const snapshot = await perf.captureRenderSnapshot();
    const commits = await perf.getCommitCount();
    const total = Object.values(snapshot.components).reduce((sum, c) => sum + c.renderCount, 0);

    test
      .info()
      .annotations.push(
        { type: 'perf:search_renders', description: String(total) },
        { type: 'perf:search_commits', description: String(commits) }
      );

    console.log(`\n── Search Flow: ${commits} commits, ${total} renders ──`);
    const top20 = Object.entries(snapshot.components)
      .toSorted(([, a], [, b]) => b.renderCount - a.renderCount)
      .slice(0, 20);

    for (const [name, data] of top20) {
      console.log(`  ${data.renderCount.toString().padStart(5)}  ${name}`);
    }

    expect(total).toBeGreaterThan(0);
  });

  test('infinite scroll — render counts', async ({ page, perf, homePage }) => {
    await homePage.open();
    await perf.installViaEvaluate();
    await page.waitForTimeout(2000);

    const beforeTiles = await homePage.getTileCount();
    await perf.reset();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);

    const afterTiles = await homePage.getTileCount();
    const snapshot = await perf.captureRenderSnapshot();
    const commits = await perf.getCommitCount();
    const total = Object.values(snapshot.components).reduce((sum, c) => sum + c.renderCount, 0);

    test
      .info()
      .annotations.push(
        { type: 'perf:scroll_renders', description: String(total) },
        { type: 'perf:scroll_commits', description: String(commits) },
        { type: 'perf:tiles_before', description: String(beforeTiles) },
        { type: 'perf:tiles_after', description: String(afterTiles) }
      );

    console.log(`\n── Infinite Scroll: ${commits} commits, ${total} renders ──`);
    const top20 = Object.entries(snapshot.components)
      .toSorted(([, a], [, b]) => b.renderCount - a.renderCount)
      .slice(0, 20);

    for (const [name, data] of top20) {
      console.log(`  ${data.renderCount.toString().padStart(5)}  ${name}`);
    }
    console.log(`\n  Tiles: ${beforeTiles} → ${afterTiles} (+${afterTiles - beforeTiles})`);

    expect(total).toBeGreaterThan(0);
  });
});
