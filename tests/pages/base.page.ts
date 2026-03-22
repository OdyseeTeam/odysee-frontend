import type { Page, Locator, Response } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * BasePage
 * ─────────────────────────────────────────────────────────────────────────────
 * Base Page Object Model that every other page class extends.
 * Encapsulates common UI elements (header, search, nav) and shared actions.
 *
 * Selectors are kept close to the real class names used by the app so that
 * if a class ever changes, it only needs updating in one place.
 */
export class BasePage {
  readonly page: Page;

  // ── Header ────────────────────────────────────────────────────────────────
  readonly header: Locator;
  readonly logo: Locator;
  readonly sidebarToggle: Locator;

  // ── Search (Wunderbar) ────────────────────────────────────────────────────
  readonly searchInput: Locator;
  readonly searchClearButton: Locator;
  readonly searchSuggestions: Locator;

  // ── Auth buttons (shown when logged out) ─────────────────────────────────
  readonly logInButton: Locator;
  readonly signUpButton: Locator;

  // ── Auth indicators (shown when logged in) ────────────────────────────────
  readonly profileMenuButton: Locator;
  readonly walletButton: Locator;

  // ── Side navigation ───────────────────────────────────────────────────────
  readonly sideNav: Locator;
  readonly sideNavHome: Locator;
  readonly sideNavFollowing: Locator;
  readonly sideNavLibrary: Locator;
  readonly sideNavNotifications: Locator;

  constructor(page: Page) {
    this.page = page;

    // ── Header ──────────────────────────────────────────────────────────────
    this.header = page.locator('header.header');
    this.logo = page.locator('.header__navigationItem--logo');
    this.sidebarToggle = page.locator('#navigation-button');

    // ── Wunderbar search ────────────────────────────────────────────────────
    this.searchInput = page.locator('.wunderbar__input');
    this.searchClearButton = page.locator('.wunderbar__clear');
    this.searchSuggestions = page.locator('.wunderbar__suggestions');

    // ── Auth (logged-out) ───────────────────────────────────────────────────
    this.logInButton = page.getByRole('link', { name: /log in/i }).first();
    this.signUpButton = page.getByRole('link', { name: /sign up/i }).first();

    // ── Auth (logged-in) ────────────────────────────────────────────────────
    this.profileMenuButton = page.locator('.header-profile-menu-button, [class*="headerProfileMenu"]').first();
    this.walletButton = page.locator('.header__navigationItem--balance').first();

    // ── Side navigation ─────────────────────────────────────────────────────
    this.sideNav = page.locator('.navigation');
    this.sideNavHome = page.locator('.navigation a[href="/"]').first();
    this.sideNavFollowing = page.locator('.navigation a[href="/$/following"]').first();
    this.sideNavLibrary = page.locator('.navigation a[href="/$/library"]').first();
    this.sideNavNotifications = page.locator('.navigation a[href="/$/notifications"]').first();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Navigate to a root-relative path and wait for the app shell to be ready.
   */
  async goto(path: string = '/'): Promise<Response | null> {
    const response = await this.page.goto(path);
    await this.waitForApp();
    return response;
  }

  /**
   * Wait for the app to be interactive:
   *   1. DOM content loaded
   *   2. Header is visible (proves React has mounted)
   */
  async waitForApp(timeout = 20_000): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.header.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for the network to go quiet after navigation / actions.
   * Useful before asserting on dynamically loaded content.
   */
  async waitForIdle(timeout = 10_000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Search (Wunderbar)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Type a query into the search bar and press Enter to navigate to results.
   */
  async search(query: string): Promise<void> {
    await this.searchInput.waitFor({ state: 'visible' });
    await this.searchInput.click();
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForApp();
  }

  /**
   * Type a query into the search bar WITHOUT pressing Enter.
   * Useful for asserting on inline suggestions.
   */
  async typeInSearch(query: string): Promise<void> {
    await this.searchInput.waitFor({ state: 'visible' });
    await this.searchInput.click();
    await this.searchInput.fill(query);
  }

  /**
   * Clear the search input via the × button.
   */
  async clearSearch(): Promise<void> {
    await this.searchClearButton.click();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Authentication state
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Returns true when the user is signed in.
   * Detection strategy: the "Log In" link is absent from the header.
   */
  async isSignedIn(): Promise<boolean> {
    return !(await this.logInButton.isVisible());
  }

  /**
   * Assert that the current session IS authenticated.
   * Fails with a clear message if not.
   */
  async assertSignedIn(): Promise<void> {
    await expect(this.logInButton, 'Expected to be signed in, but the "Log In" button is visible').not.toBeVisible();
  }

  /**
   * Assert that the current session is NOT authenticated.
   */
  async assertSignedOut(): Promise<void> {
    await expect(this.logInButton, 'Expected to be signed out, but the "Log In" button is not visible').toBeVisible();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Sidebar
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Toggle the left sidebar open / closed.
   */
  async toggleSidebar(): Promise<void> {
    await this.sidebarToggle.click();
  }

  /**
   * Returns true when the sidebar is expanded (aria-expanded=true).
   */
  async isSidebarOpen(): Promise<boolean> {
    const expanded = await this.sidebarToggle.getAttribute('aria-expanded');
    return expanded === 'true';
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Title / meta helpers
  // ──────────────────────────────────────────────────────────────────────────

  /** Returns the current page <title>. */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /** Returns the current page URL (full href). */
  currentUrl(): string {
    return this.page.url();
  }

  /** Returns the current pathname (without origin). */
  currentPath(): string {
    return new URL(this.page.url()).pathname;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Toast / Snackbar
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Wait for a snackbar / toast notification to appear and return its text.
   */
  async getSnackbarText(timeout = 8_000): Promise<string> {
    const snackbar = this.page.locator('.snack-bar__message, [class*="snack-bar"]').first();
    await snackbar.waitFor({ state: 'visible', timeout });
    return snackbar.innerText();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Generic utilities
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Scroll to the bottom of the page (triggers infinite-scroll loaders).
   */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // Small pause so the scroll event is processed
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for a specific number of milliseconds.
   * Prefer using explicit locator waits over this where possible.
   */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Take a named screenshot into the test-results folder.
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  }
}
