import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './base.page';
import { ROUTES } from '../helpers/routes';

/**
 * SearchPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object Model for the search results page (/$/search?q=...).
 *
 * Covers:
 *   - Navigating to search with a query
 *   - Reading result tiles / rows
 *   - Filter / sort controls
 *   - No-results state
 *   - Tag searches
 */
export class SearchPage extends BasePage {
  // ── Results container ──────────────────────────────────────────────────────
  readonly resultsContainer: Locator;
  readonly resultTiles: Locator;
  readonly resultRows: Locator;

  // ── Top / channel suggestion ───────────────────────────────────────────────
  readonly topSuggestion: Locator;

  // ── Filter / sort controls ────────────────────────────────────────────────
  readonly searchOptions: Locator;
  readonly sortSelect: Locator;
  readonly typeFilter: Locator;
  readonly durationFilter: Locator;
  readonly dateFilter: Locator;

  // ── Empty / error states ───────────────────────────────────────────────────
  readonly noResultsMessage: Locator;
  readonly errorMessage: Locator;

  // ── Loading indicator ──────────────────────────────────────────────────────
  readonly spinner: Locator;

  constructor(page: import('@playwright/test').Page) {
    super(page);

    // ── Results ──────────────────────────────────────────────────────────────
    this.resultsContainer = page.locator('.search__results, [class*="search__results"]').first();
    // Tile layout (grid)
    this.resultTiles = page.locator('.claim-preview--tile');
    // Row layout (list)
    this.resultRows = page.locator('.claim-preview--small, .claim-preview');

    // ── Top suggestion (channel card at top of results) ───────────────────────
    this.topSuggestion = page.locator('.search-top-claim, [class*="searchTopClaim"]').first();

    // ── Search option controls ────────────────────────────────────────────────
    this.searchOptions = page.locator('.search-options, [class*="searchOptions"]').first();
    this.sortSelect = page.locator('[name="sort"], .search-options__sort').first();
    this.typeFilter = page.locator('[name="type"], .search-options__type').first();
    this.durationFilter = page.locator('[name="duration"], .search-options__duration').first();
    this.dateFilter = page.locator('[name="date"], .search-options__date').first();

    // ── Empty / error states ─────────────────────────────────────────────────
    this.noResultsMessage = page
      .getByText(/no results/i)
      .or(page.locator('.empty-results, .yrbl__message'))
      .first();
    this.errorMessage = page.locator('.error-text, [class*="error"]').first();

    // ── Spinner ───────────────────────────────────────────────────────────────
    this.spinner = page.locator('.spinner, [class*="spinner"]').first();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Navigate directly to the search results page for a given query.
   * Waits for results to stabilise before resolving.
   *
   * @example
   * await searchPage.searchFor('bitcoin');
   */
  async searchFor(query: string, extra?: Record<string, string>): Promise<void> {
    await this.goto(ROUTES.search(query, extra));
    await this.waitForResults();
  }

  /**
   * Navigate to search via the header Wunderbar (types + Enter).
   * Use this when you want to test the search UX rather than load the URL directly.
   */
  async searchViaHeader(query: string): Promise<void> {
    await this.search(query);
    await this.waitForResults();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Waiting
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Wait until at least one result tile/row is visible, or the no-results
   * message appears.  Throws if neither appears within the timeout.
   */
  async waitForResults(timeout = 15_000): Promise<void> {
    await Promise.race([
      this.resultTiles.first().waitFor({ state: 'visible', timeout }),
      this.resultRows.first().waitFor({ state: 'visible', timeout }),
      this.noResultsMessage.waitFor({ state: 'visible', timeout }),
    ]);
  }

  /**
   * Wait until the loading spinner has disappeared.
   */
  async waitForSpinnerGone(timeout = 10_000): Promise<void> {
    await this.spinner.waitFor({ state: 'hidden', timeout }).catch(() => {
      // Spinner may never appear for fast responses – that's fine
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Result inspection
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Count how many result tiles are currently rendered.
   */
  async getTileCount(): Promise<number> {
    return this.resultTiles.count();
  }

  /**
   * Count how many result rows are currently rendered.
   */
  async getRowCount(): Promise<number> {
    return this.resultRows.count();
  }

  /**
   * Get the total count of visible results (tiles + rows, deduplicated).
   * In practice the page uses one layout at a time; this covers both.
   */
  async getResultCount(): Promise<number> {
    const tiles = await this.getTileCount();
    if (tiles > 0) return tiles;
    return this.getRowCount();
  }

  /**
   * Return the visible text (title) of all result items.
   */
  async getResultTitles(): Promise<string[]> {
    // Try tile titles first, fall back to row titles
    const tileCount = await this.resultTiles.count();
    const source = tileCount > 0 ? this.resultTiles : this.resultRows;
    const titleLocators = source.locator('.claim-tile__title, .media__title, .claim-preview__title');
    const count = await titleLocators.count();
    const titles: string[] = [];
    for (let i = 0; i < count; i++) {
      titles.push(
        await titleLocators
          .nth(i)
          .innerText()
          .catch(() => '')
      );
    }
    return titles.filter(Boolean);
  }

  /**
   * Click on the Nth result (0-based).
   */
  async clickResult(index = 0): Promise<void> {
    const tileCount = await this.resultTiles.count();
    const source = tileCount > 0 ? this.resultTiles : this.resultRows;
    await source.nth(index).click();
    await this.waitForApp();
  }

  /**
   * Click on a result whose title contains the given text (case-insensitive).
   */
  async clickResultWithTitle(titleFragment: string): Promise<void> {
    const locator = this.page
      .locator('.claim-tile__title, .media__title, .claim-preview__title')
      .filter({ hasText: new RegExp(titleFragment, 'i') })
      .first();
    await locator.waitFor({ state: 'visible' });
    await locator.click();
    await this.waitForApp();
  }

  /**
   * Returns true if the top-channel suggestion card is visible.
   */
  async hasTopSuggestion(): Promise<boolean> {
    return this.topSuggestion.isVisible();
  }

  /**
   * Returns true when no results were found for the query.
   */
  async hasNoResults(): Promise<boolean> {
    return this.noResultsMessage.isVisible();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Filters and sorting
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Select a sort order from the sort dropdown.
   * Common values: 'relevance', 'newest', 'oldest', 'top'
   */
  async sortBy(value: 'relevance' | 'newest' | 'oldest' | 'top'): Promise<void> {
    await this.sortSelect.waitFor({ state: 'visible' });
    await this.sortSelect.selectOption(value);
    await this.waitForResults();
  }

  /**
   * Filter results by content type.
   * Common values: 'file', 'channel', 'video', 'audio', 'document', 'image'
   */
  async filterByType(type: 'file' | 'channel' | 'video' | 'audio' | 'document' | 'image'): Promise<void> {
    await this.typeFilter.waitFor({ state: 'visible' });
    await this.typeFilter.selectOption(type);
    await this.waitForResults();
  }

  /**
   * Filter results by upload date.
   * Common values: 'today', 'week', 'month', 'year'
   */
  async filterByDate(date: 'today' | 'week' | 'month' | 'year'): Promise<void> {
    await this.dateFilter.waitFor({ state: 'visible' });
    await this.dateFilter.selectOption(date);
    await this.waitForResults();
  }

  /**
   * Filter results by video duration.
   * Common values: 'short' (<4 min), 'long' (>20 min)
   */
  async filterByDuration(duration: 'short' | 'long'): Promise<void> {
    await this.durationFilter.waitFor({ state: 'visible' });
    await this.durationFilter.selectOption(duration);
    await this.waitForResults();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Assertions
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Assert that results are present (at least `min` results visible).
   */
  async assertHasResults(min = 1): Promise<void> {
    const count = await this.getResultCount();
    expect(count, `Expected at least ${min} search result(s), got ${count}`).toBeGreaterThanOrEqual(min);
  }

  /**
   * Assert that the search page is showing the no-results state.
   */
  async assertNoResults(): Promise<void> {
    await expect(this.noResultsMessage, 'Expected no-results message to be visible').toBeVisible();
  }

  /**
   * Assert that the current URL reflects the expected search query.
   */
  async assertQueryInUrl(query: string): Promise<void> {
    const currentUrl = this.page.url();
    const params = new URL(currentUrl).searchParams;
    expect(params.get('q'), `Expected URL to contain q="${query}"`).toBe(query);
  }

  /**
   * Assert that at least one result title contains the expected text.
   */
  async assertResultContains(text: string): Promise<void> {
    const titles = await this.getResultTitles();
    const match = titles.some((t) => t.toLowerCase().includes(text.toLowerCase()));
    expect(match, `Expected at least one result to contain "${text}". Titles: ${JSON.stringify(titles)}`).toBe(true);
  }
}
