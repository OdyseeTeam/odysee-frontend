import { type Locator, type Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './base.page';
import { ROUTES } from '../helpers/routes';

/**
 * HomePage
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object Model for the Odysee home page (/).
 *
 * Covers:
 *   - Featured / hero banner
 *   - Category / tag navigation rail
 *   - Content tile grid (claimPreviewTile)
 *   - Infinite-scroll loading
 *   - Homepage selector (if enabled)
 */
export class HomePage extends BasePage {
  // ── Featured banner ───────────────────────────────────────────────────────
  readonly featuredBanner: Locator;
  readonly featuredBannerTitle: Locator;
  readonly featuredBannerButton: Locator;

  // ── Category navigation rail ──────────────────────────────────────────────
  readonly categoryNav: Locator;
  readonly categoryNavItems: Locator;

  // ── Content grid ──────────────────────────────────────────────────────────
  readonly contentGrid: Locator;
  readonly contentTiles: Locator;
  readonly contentTileTitle: Locator;
  readonly contentTileThumbnail: Locator;
  readonly contentTileChannel: Locator;
  readonly contentTileDuration: Locator;
  readonly contentTileViewCount: Locator;

  // ── Claim list (non-tile variant) ─────────────────────────────────────────
  readonly claimList: Locator;
  readonly claimPreviews: Locator;

  // ── Loading states ────────────────────────────────────────────────────────
  readonly loadingSpinner: Locator;
  readonly skeletonItems: Locator;

  // ── Homepage selector (multi-homepage feature) ────────────────────────────
  readonly homepageSelector: Locator;

  // ── "Following" empty state ───────────────────────────────────────────────
  readonly followingSuggestions: Locator;

  // ── Nag / first-run overlay ───────────────────────────────────────────────
  readonly nagBar: Locator;
  readonly nagBarDismiss: Locator;

  constructor(page: Page) {
    super(page);

    // ── Featured banner ──────────────────────────────────────────────────────
    this.featuredBanner = page.locator('.featured-banner, [class*="featuredBanner"]').first();
    this.featuredBannerTitle = page.locator('.featured-banner__title, [class*="featuredBanner__title"]').first();
    this.featuredBannerButton = page.locator('.featured-banner button, .featured-banner a').first();

    // ── Category navigation rail ─────────────────────────────────────────────
    this.categoryNav = page.locator('.claim-list__header, .homepage__header, [class*="claimListHeader"]').first();
    this.categoryNavItems = page.locator('.tag-select__tag, .wunderbar__tag, [class*="tag"]');

    // ── Content tile grid ────────────────────────────────────────────────────
    this.contentGrid = page.locator('.claim-grid, [class*="claimGrid"]').first();
    this.contentTiles = page.locator('.claim-preview--tile');
    this.contentTileTitle = page.locator('.claim-preview__title').first();
    this.contentTileThumbnail = page.locator('.claim-preview__thumbnail').first();
    this.contentTileChannel = page.locator('.claim-preview__channel-staked').first();
    this.contentTileDuration = page.locator('.claim-preview__duration, .video-duration').first();
    this.contentTileViewCount = page.locator('.claim-preview__view-count, [class*="viewCount"]').first();

    // ── Claim list ───────────────────────────────────────────────────────────
    this.claimList = page.locator('.claim-list').first();
    this.claimPreviews = page.locator('.claim-preview');

    // ── Loading states ───────────────────────────────────────────────────────
    this.loadingSpinner = page.locator('.spinner, [class*="spinner"]').first();
    this.skeletonItems = page.locator('[class*="skeleton"], .MuiSkeleton-root');

    // ── Homepage selector ────────────────────────────────────────────────────
    this.homepageSelector = page.locator('[class*="homepageSelector"]').first();

    // ── Following suggestions ────────────────────────────────────────────────
    this.followingSuggestions = page.locator('[class*="userChannelFollowIntro"], [class*="channelsFollowing"]').first();

    // ── Nag bar ──────────────────────────────────────────────────────────────
    this.nagBar = page.locator('.nag, [class*="nag"]').first();
    this.nagBarDismiss = page.locator('.nag button, [class*="nag"] button').first();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  /** Navigate to the home page and wait for content to appear. */
  async open(): Promise<void> {
    await this.goto(ROUTES.home);
    await this.waitForContent();
  }

  /** Navigate to a category page (e.g. Gaming, Music). */
  async openCategory(category: string): Promise<void> {
    await this.goto(`/$/` + category.toLowerCase());
    await this.waitForContent();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Content assertions / helpers
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Wait until at least one content tile or claim preview is visible.
   * Fails if nothing loads within the timeout.
   */
  async waitForContent(timeout = 20_000): Promise<void> {
    // Either tiles or list-style previews are acceptable
    await this.page
      .locator('.claim-preview--tile, .claim-preview')
      .first()
      .waitFor({ state: 'visible', timeout });
  }

  /**
   * Returns the number of content tiles currently visible on the page.
   */
  async getTileCount(): Promise<number> {
    return this.contentTiles.count();
  }

  /**
   * Returns the number of claim previews (list variant) visible.
   */
  async getPreviewCount(): Promise<number> {
    return this.claimPreviews.count();
  }

  /**
   * Returns the text of the Nth tile's title (0-based index).
   */
  async getTileTitle(index = 0): Promise<string> {
    return this.contentTiles.nth(index).locator('.claim-preview__title').innerText();
  }

  /**
   * Click the Nth content tile (0-based).
   * Waits for the watch/claim page to load.
   */
  async clickTile(index = 0): Promise<void> {
    await this.contentTiles.nth(index).click();
    await this.waitForApp();
  }

  /**
   * Click the first tile matching a title substring (case-insensitive).
   */
  async clickTileByTitle(titleSubstring: string): Promise<void> {
    const tile = this.page
      .locator('.claim-preview--tile')
      .filter({ hasText: new RegExp(titleSubstring, 'i') })
      .first();
    await tile.click();
    await this.waitForApp();
  }

  /**
   * Assert that the content grid has at least `min` tiles.
   */
  async assertHasTiles(min = 1): Promise<void> {
    await expect(this.contentTiles.first()).toBeVisible();
    const count = await this.getTileCount();
    expect(count, `Expected at least ${min} tile(s), got ${count}`).toBeGreaterThanOrEqual(min);
  }

  /**
   * Assert that at least one claim preview (list style) is visible.
   */
  async assertHasPreviews(min = 1): Promise<void> {
    await expect(this.claimPreviews.first()).toBeVisible();
    const count = await this.getPreviewCount();
    expect(count, `Expected at least ${min} preview(s), got ${count}`).toBeGreaterThanOrEqual(min);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Featured banner
  // ──────────────────────────────────────────────────────────────────────────

  /** Returns true if the featured banner is currently rendered. */
  async hasFeaturedBanner(): Promise<boolean> {
    return this.featuredBanner.isVisible();
  }

  /** Returns the featured banner title text (or empty string if absent). */
  async getFeaturedBannerTitle(): Promise<string> {
    if (!(await this.hasFeaturedBanner())) return '';
    return this.featuredBannerTitle.innerText();
  }

  /** Click the CTA button inside the featured banner. */
  async clickFeaturedBannerCta(): Promise<void> {
    await this.featuredBannerButton.click();
    await this.waitForApp();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Nag / first-run helpers
  // ──────────────────────────────────────────────────────────────────────────

  /** Dismiss the nag/first-run bar if it's present. */
  async dismissNagIfPresent(timeout = 3_000): Promise<void> {
    const visible = await this.nagBar.isVisible({ timeout }).catch(() => false);
    if (visible) {
      await this.nagBarDismiss.click();
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Infinite scroll
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Scroll to the bottom of the page and wait for more tiles to load.
   * Returns the total tile count after the load.
   */
  async loadMoreByScrolling(): Promise<number> {
    const before = await this.getTileCount();
    await this.scrollToBottom();

    // Wait briefly for the network request, then check if count grew
    await this.page.waitForTimeout(1_500);
    const after = await this.getTileCount();

    return after;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Category navigation helpers
  // ──────────────────────────────────────────────────────────────────────────

  /** Returns all visible category nav item labels. */
  async getCategoryLabels(): Promise<string[]> {
    const items = this.page.locator('.claim-list__header a, [class*="claimListHeader"] a');
    const count = await items.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      labels.push((await items.nth(i).innerText()).trim());
    }
    return labels;
  }

  /** Click a category link by its exact label text. */
  async clickCategory(label: string): Promise<void> {
    await this.page
      .locator('.claim-list__header a, [class*="claimListHeader"] a')
      .filter({ hasText: label })
      .first()
      .click();
    await this.waitForApp();
  }
}
