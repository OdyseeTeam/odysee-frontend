import { test as base, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { SearchPage } from '../pages/search.page';
import { ChannelPage } from '../pages/channel.page';
import { WatchPage } from '../pages/watch.page';
import { SignInPage } from '../pages/signin.page';
import { ShortsPage } from '../pages/shorts.page';

// ---------------------------------------------------------------------------
// Fixture type definitions
// ---------------------------------------------------------------------------

/**
 * Page-object fixtures available to every test that imports from this module.
 * Each fixture is scoped to the test (a fresh instance per test).
 */
export type OdyseeFixtures = {
  /** Home page – covers content tiles, featured banner, category nav */
  homePage: HomePage;
  /** Search results page – covers results, filters, no-results state */
  searchPage: SearchPage;
  /** Channel page – covers tabs, follow, content grid, about, discussion */
  channelPage: ChannelPage;
  /** Watch / file page – covers player, metadata, comments, recommended */
  watchPage: WatchPage;
  /** Sign-in / sign-up flow pages */
  signInPage: SignInPage;
  /** Shorts / FYP feed – covers slide navigation, actions panel, playback */
  shortsPage: ShortsPage;
};

// ---------------------------------------------------------------------------
// Extended test instance
// ---------------------------------------------------------------------------

/**
 * Drop-in replacement for `@playwright/test`'s `test`.
 *
 * Import `test` and `expect` from this module instead of `@playwright/test`
 * to get all page-object fixtures automatically injected.
 *
 * @example
 * import { test, expect } from '../fixtures';
 *
 * test('home page has content', async ({ homePage }) => {
 *   await homePage.open();
 *   await homePage.assertHasTiles(4);
 * });
 */
export const test = base.extend<OdyseeFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },

  channelPage: async ({ page }, use) => {
    await use(new ChannelPage(page));
  },

  watchPage: async ({ page }, use) => {
    await use(new WatchPage(page));
  },

  signInPage: async ({ page }, use) => {
    await use(new SignInPage(page));
  },

  shortsPage: async ({ page }, use) => {
    await use(new ShortsPage(page));
  },
});

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

// Re-export expect so callers only need one import source.
export { expect };

// Re-export Playwright's core types that tests commonly use.
export type { Page, BrowserContext, Locator } from '@playwright/test';
