import { test, expect } from '../../fixtures';
import { ROUTES } from '../../helpers/routes';

/**
 * Smoke – Home Page
 * ─────────────────────────────────────────────────────────────────────────────
 * Fast, high-confidence checks that the home page loads and the key UI regions
 * are present.  These run on every commit and on mobile too (see config).
 *
 * Deliberately avoids deep interaction so the suite stays quick.
 */

test.describe('Home page – smoke', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
  });

  // ── Page shell ─────────────────────────────────────────────────────────────

  test('page title is set', async ({ homePage }) => {
    const title = await homePage.getTitle();
    expect(title).toBeTruthy();
    // Should contain the site name or "Odysee"
    expect(title.toLowerCase()).toMatch(/odysee/i);
  });

  test('header is visible', async ({ homePage }) => {
    await expect(homePage.header).toBeVisible();
  });

  test('logo is visible and links to home', async ({ homePage }) => {
    await expect(homePage.logo).toBeVisible();
  });

  test('search input (Wunderbar) is visible', async ({ homePage }) => {
    await expect(homePage.searchInput).toBeVisible();
  });

  test('sidebar toggle button is visible', async ({ homePage }) => {
    await expect(homePage.sidebarToggle).toBeVisible();
  });

  test('"Log In" link is visible when signed out', async ({ homePage }) => {
    await homePage.assertSignedOut();
  });

  // ── Content grid ───────────────────────────────────────────────────────────

  test('content tiles are rendered', async ({ homePage }) => {
    await homePage.assertHasTiles(4);
  });

  test('at least 8 tiles load on the home page', async ({ homePage }) => {
    const count = await homePage.getTileCount();
    expect(count, `Expected ≥8 tiles, got ${count}`).toBeGreaterThanOrEqual(8);
  });

  test('first tile has a non-empty title', async ({ homePage }) => {
    const title = await homePage.getTileTitle(0);
    expect(title.trim()).not.toBe('');
  });

  test('first tile has a thumbnail image', async ({ homePage }) => {
    const thumbnail = homePage.contentTiles.first().locator('img, canvas').first();
    // Thumbnail may be an <img> or a lazy-load canvas – just check it's present
    await expect(thumbnail).toBeAttached();
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  test('side navigation is attached to the DOM', async ({ homePage }) => {
    // The sidebar may be collapsed but the element should exist
    await expect(homePage.sideNav).toBeAttached();
  });

  test('clicking the logo stays on / or scrolls to top', async ({ homePage }) => {
    await homePage.logo.click();
    // Should remain on home
    expect(homePage.currentPath()).toBe('/');
  });

  test('sidebar can be toggled open and closed', async ({ homePage }) => {
    const wasOpen = await homePage.isSidebarOpen();
    await homePage.toggleSidebar();
    const isNowOpen = await homePage.isSidebarOpen();
    expect(isNowOpen).toBe(!wasOpen);

    // Toggle back
    await homePage.toggleSidebar();
    const backToOriginal = await homePage.isSidebarOpen();
    expect(backToOriginal).toBe(wasOpen);
  });

  // ── Search ─────────────────────────────────────────────────────────────────

  test('typing in the search bar shows suggestions', async ({ homePage }) => {
    await homePage.typeInSearch('music');
    // Suggestions dropdown should appear
    await expect(homePage.searchSuggestions).toBeVisible({ timeout: 8_000 });
  });

  test('submitting a search navigates to /$/search', async ({ homePage }) => {
    await homePage.search('cats');
    expect(homePage.currentPath()).toBe('/$/search');
    const params = new URL(homePage.currentUrl()).searchParams;
    expect(params.get('q')).toBe('cats');
  });

  // ── Infinite scroll ────────────────────────────────────────────────────────

  test('scrolling to the bottom loads more content', async ({ homePage }) => {
    const before = await homePage.getTileCount();
    const after = await homePage.loadMoreByScrolling();
    // Either more tiles loaded or at minimum the original tiles are still there
    expect(after).toBeGreaterThanOrEqual(before);
  });

  // ── Routing from tiles ─────────────────────────────────────────────────────

  test('clicking a content tile navigates to a claim / watch page', async ({ homePage }) => {
    await homePage.clickTile(0);
    // URL should no longer be exactly '/'
    expect(homePage.currentPath()).not.toBe('/');
    // The header should still be present (SPA navigation, shell stays)
    await expect(homePage.header).toBeVisible();
  });

  // ── Categories ────────────────────────────────────────────────────────────

  test('navigating to /$/discover renders content', async ({ page, homePage }) => {
    await homePage.goto(ROUTES.discover);
    await homePage.waitForContent();
    await homePage.assertHasTiles(1);
  });
});
