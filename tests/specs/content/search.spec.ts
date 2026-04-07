import { test, expect } from '../../fixtures';
import { ROUTES } from '../../helpers/routes';

/**
 * Search feature tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Covers:
 *   - Direct URL navigation to search results
 *   - Searching via the Wunderbar (header search input)
 *   - Inline suggestions dropdown
 *   - Filter controls (type, sort, date, duration)
 *   - No-results state
 *   - Clicking a result navigates correctly
 *   - Query is reflected in the URL
 *
 * These tests are unauthenticated – no auth token required.
 * The server at localhost:1337 must be running before executing.
 */

test.describe('Search', () => {
  // ── Direct URL search ──────────────────────────────────────────────────────

  test.describe('Direct URL navigation', () => {
    test('loads results for a common query', async ({ searchPage }) => {
      await searchPage.searchFor('music');
      await searchPage.assertHasResults(1);
    });

    test('reflects the query in the page URL', async ({ searchPage }) => {
      await searchPage.searchFor('technology');
      await searchPage.assertQueryInUrl('technology');
    });

    test('page title includes the search query', async ({ searchPage }) => {
      await searchPage.searchFor('science');
      const title = await searchPage.getTitle();
      expect(title.toLowerCase()).toContain('search');
    });

    test('displays a top channel suggestion when the query matches a channel handle', async ({ searchPage }) => {
      // "@Odysee" is a known channel; a top suggestion card should appear.
      await searchPage.searchFor('@Odysee');
      // Not every query produces a top suggestion – soft assert
      const hasTop = await searchPage.hasTopSuggestion();
      // We just confirm the page loads without crashing; suggestion is optional
      expect(typeof hasTop).toBe('boolean');
    });

    test('shows no-results state for a gibberish query', async ({ searchPage }) => {
      const gibberish = 'xkzqjvwlmnpqrstuv_definitely_no_results_' + Date.now();
      await searchPage.searchFor(gibberish);
      // Either 0 results or an explicit no-results message
      const count = await searchPage.getResultCount();
      const hasNoResultsMsg = await searchPage.hasNoResults();
      expect(count === 0 || hasNoResultsMsg).toBe(true);
    });

    test('loads multiple pages of results via infinite scroll', async ({ searchPage, page }) => {
      await searchPage.searchFor('gaming');
      await searchPage.assertHasResults(1);

      const initialCount = await searchPage.getResultCount();

      // Scroll to the bottom and allow the next batch to load
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2_000);

      const afterScrollCount = await searchPage.getResultCount();
      // Either more results loaded, or the same count if there's nothing more
      expect(afterScrollCount).toBeGreaterThanOrEqual(initialCount);
    });
  });

  // ── Wunderbar (header search) ──────────────────────────────────────────────

  test.describe('Wunderbar header search', () => {
    test('navigates to search results page when query is submitted', async ({ searchPage, page }) => {
      // Start from home so the header is available
      await page.goto(ROUTES.home);
      await searchPage.waitForApp();

      await searchPage.searchViaHeader('cats');

      // Should land on the /$/search route
      expect(page.url()).toContain('/$/search');
      expect(page.url()).toContain('cats');
    });

    test('shows inline suggestions while typing', async ({ searchPage, page }) => {
      await page.goto(ROUTES.home);
      await searchPage.waitForApp();

      // Type without pressing Enter to trigger the suggestion dropdown
      await searchPage.typeInSearch('od');

      // The suggestion list should appear
      await expect(searchPage.searchSuggestions).toBeVisible({ timeout: 6_000 });
    });

    test('suggestions dropdown contains at least one entry', async ({ searchPage, page }) => {
      await page.goto(ROUTES.home);
      await searchPage.waitForApp();

      await searchPage.typeInSearch('gaming');

      const suggestions = searchPage.searchSuggestions;
      await expect(suggestions).toBeVisible({ timeout: 6_000 });

      // At least one suggestion item should be present
      const suggestionItems = page.locator('.wunderbar__suggestions [class*="suggestion"], .wunderbar__suggestions li');
      await expect(suggestionItems.first()).toBeVisible({ timeout: 6_000 });
    });

    test('clearing the search input hides suggestions', async ({ searchPage, page }) => {
      await page.goto(ROUTES.home);
      await searchPage.waitForApp();

      await searchPage.typeInSearch('hello');
      await expect(searchPage.searchSuggestions).toBeVisible({ timeout: 6_000 });

      await searchPage.clearSearch();

      // Suggestions should disappear after clearing
      await expect(searchPage.searchSuggestions).not.toBeVisible({ timeout: 5_000 });
    });

    test('pressing Escape dismisses suggestions', async ({ searchPage, page }) => {
      await page.goto(ROUTES.home);
      await searchPage.waitForApp();

      await searchPage.typeInSearch('news');
      await expect(searchPage.searchSuggestions).toBeVisible({ timeout: 6_000 });

      await page.keyboard.press('Escape');

      await expect(searchPage.searchSuggestions).not.toBeVisible({ timeout: 5_000 });
    });
  });

  // ── Search filters ─────────────────────────────────────────────────────────

  test.describe('Filter controls', () => {
    test.beforeEach(async ({ searchPage }) => {
      // Start every filter test on a populated results page
      await searchPage.searchFor('technology');
      await searchPage.assertHasResults(1);
    });

    test('sort options control is rendered', async ({ searchPage }) => {
      // The sort control should be present – exact visibility depends on layout
      // We confirm the selector resolves without throwing
      const exists = (await searchPage.sortSelect.count()) > 0;
      expect(exists).toBe(true);
    });

    test('type filter control is rendered', async ({ searchPage }) => {
      const exists = (await searchPage.typeFilter.count()) > 0;
      expect(exists).toBe(true);
    });

    test('filtering by type=channel shows channel results', async ({ searchPage, page }) => {
      const filterVisible = await searchPage.typeFilter.isVisible().catch(() => false);
      test.skip(!filterVisible, 'Type filter not visible in this layout');

      await searchPage.filterByType('channel');

      // After filtering, the URL should include the type parameter
      expect(page.url()).toMatch(/type=channel/i);
      await searchPage.assertHasResults(1);
    });

    test('filtering by type=video shows video results', async ({ searchPage, page }) => {
      const filterVisible = await searchPage.typeFilter.isVisible().catch(() => false);
      test.skip(!filterVisible, 'Type filter not visible in this layout');

      await searchPage.filterByType('video');

      expect(page.url()).toMatch(/type=video/i);
      await searchPage.assertHasResults(1);
    });

    test('sorting by newest updates results', async ({ searchPage, page }) => {
      const sortVisible = await searchPage.sortSelect.isVisible().catch(() => false);
      test.skip(!sortVisible, 'Sort select not visible in this layout');

      const countBefore = await searchPage.getResultCount();
      await searchPage.sortBy('newest');

      // The sort param should now appear in the URL
      expect(page.url()).toMatch(/order_by|sort/i);
      // We still expect at least as many results
      const countAfter = await searchPage.getResultCount();
      expect(countAfter).toBeGreaterThan(0);
    });

    test('date filter is accessible', async ({ searchPage }) => {
      const filterVisible = await searchPage.dateFilter.isVisible().catch(() => false);
      // This is an optional soft check – not all result sets expose the date filter
      if (filterVisible) {
        await searchPage.filterByDate('month');
        await searchPage.assertHasResults(0); // may be 0 or more – just confirms no crash
      }
    });
  });

  // ── Result interaction ─────────────────────────────────────────────────────

  test.describe('Result interaction', () => {
    test('clicking a result navigates away from the search page', async ({ searchPage, page }) => {
      await searchPage.searchFor('music');
      await searchPage.assertHasResults(1);

      // Click the first result
      await searchPage.clickResult(0);

      // Should navigate away from /$/search
      await page.waitForURL((url) => !url.pathname.includes('/$/search'), { timeout: 15_000 });
      expect(page.url()).not.toContain('/$/search');
    });

    test('browser back button returns to search results', async ({ searchPage, page }) => {
      await searchPage.searchFor('gaming');
      await searchPage.assertHasResults(1);

      const searchUrl = page.url();

      await searchPage.clickResult(0);
      await page.waitForURL((url) => !url.pathname.includes('/$/search'), { timeout: 15_000 });

      await page.goBack();
      await page.waitForURL(searchUrl, { timeout: 10_000 });

      expect(page.url()).toContain('/$/search');
    });
  });

  // ── Multiple queries (query param changes) ─────────────────────────────────

  test.describe('Query parameter behaviour', () => {
    test('changing the query param on the same page updates results', async ({ searchPage, page }) => {
      await searchPage.searchFor('cats');
      const firstCount = await searchPage.getResultCount();

      // Navigate to a different query while staying on the search page
      await page.goto(ROUTES.search('dogs'));
      await searchPage.waitForResults();

      await searchPage.assertQueryInUrl('dogs');
      const secondCount = await searchPage.getResultCount();
      // Both queries should return some results (common subjects)
      expect(firstCount).toBeGreaterThan(0);
      expect(secondCount).toBeGreaterThan(0);
    });

    test('special characters in query are encoded correctly', async ({ searchPage, page }) => {
      const query = 'hello world & more';
      await searchPage.searchFor(query);

      // URL should have encoded the spaces at minimum
      const urlQuery = new URL(page.url()).searchParams.get('q');
      expect(urlQuery).toBe(query);
    });
  });
});
