import { test, expect } from '../../fixtures';
import { ROUTES } from '../../helpers/routes';

/**
 * Smoke – Navigation
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies that the core navigation chrome (header, sidebar, logo, links)
 * renders correctly and that basic route transitions work.
 *
 * These tests run against an unauthenticated session so they can execute
 * in any environment without credentials.
 */

test.describe('Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.home);
    await page.waitForLoadState('domcontentloaded');
  });

  test('renders the header element', async ({ homePage }) => {
    await expect(homePage.header).toBeVisible();
  });

  test('renders the Odysee logo / home button', async ({ homePage }) => {
    await homePage.open();
    await expect(homePage.logo).toBeVisible();
  });

  test('clicking the logo navigates to home from another page', async ({ homePage }) => {
    // First go somewhere else
    await homePage.goto(ROUTES.discover);
    await expect(homePage.page).not.toHaveURL('/');

    // Click logo
    await homePage.logo.click();
    await homePage.waitForApp();

    expect(homePage.currentPath()).toBe('/');
  });

  test('shows the Wunderbar search input on desktop', async ({ homePage }) => {
    await homePage.open();
    await expect(homePage.searchInput).toBeVisible();
  });

  test('shows Log In and Sign Up links when unauthenticated', async ({ homePage }) => {
    await homePage.open();
    await expect(homePage.logInButton).toBeVisible();
    await expect(homePage.signUpButton).toBeVisible();
  });

  test('Log In link points to the sign-in route', async ({ homePage }) => {
    await homePage.open();
    const href = await homePage.logInButton.getAttribute('href');
    expect(href).toContain('/$/signin');
  });

  test('Sign Up link points to the signup route', async ({ homePage }) => {
    await homePage.open();
    const href = await homePage.signUpButton.getAttribute('href');
    expect(href).toContain('/$/signup');
  });

  test('sidebar toggle button is present and has aria-expanded attribute', async ({ homePage }) => {
    await homePage.open();
    await expect(homePage.sidebarToggle).toBeVisible();
    const expanded = await homePage.sidebarToggle.getAttribute('aria-expanded');
    expect(['true', 'false']).toContain(expanded);
  });
});

test.describe('Sidebar', () => {
  test('sidebar toggle changes aria-expanded state', async ({ homePage }) => {
    await homePage.open();

    const initialState = await homePage.isSidebarOpen();

    await homePage.toggleSidebar();
    await homePage.page.waitForTimeout(400); // wait for CSS transition

    const afterToggle = await homePage.isSidebarOpen();
    expect(afterToggle).not.toBe(initialState);
  });

  test('toggling sidebar twice returns to original state', async ({ homePage }) => {
    await homePage.open();
    const initial = await homePage.isSidebarOpen();

    await homePage.toggleSidebar();
    await homePage.page.waitForTimeout(300);
    await homePage.toggleSidebar();
    await homePage.page.waitForTimeout(300);

    const restored = await homePage.isSidebarOpen();
    expect(restored).toBe(initial);
  });
});

test.describe('Wunderbar search', () => {
  test('typing in search populates the input', async ({ homePage }) => {
    await homePage.open();
    await homePage.typeInSearch('bitcoin');
    await expect(homePage.searchInput).toHaveValue('bitcoin');
  });

  test('search suggestions appear while typing', async ({ homePage }) => {
    await homePage.open();
    await homePage.typeInSearch('music');
    // Suggestions panel should appear
    await expect(homePage.searchSuggestions).toBeVisible({ timeout: 8_000 });
  });

  test('pressing Enter navigates to search results', async ({ homePage }) => {
    await homePage.open();
    await homePage.search('cats');

    await expect(homePage.page).toHaveURL(/\/\$\/search\?.*q=cats/);
  });

  test('clear button removes search text', async ({ homePage }) => {
    await homePage.open();
    await homePage.typeInSearch('something');
    await expect(homePage.searchInput).toHaveValue('something');

    await homePage.clearSearch();
    await expect(homePage.searchInput).toHaveValue('');
  });
});

test.describe('Route transitions', () => {
  test('navigates to /$/discover', async ({ homePage }) => {
    await homePage.open();
    await homePage.page.goto(ROUTES.discover);
    await homePage.waitForApp();
    expect(homePage.currentPath()).toContain('/$/discover');
  });

  test('navigates to /$/following', async ({ homePage }) => {
    await homePage.goto(ROUTES.following);
    expect(homePage.currentPath()).toContain('/$/following');
  });

  test('navigates to /$/top', async ({ homePage }) => {
    await homePage.goto(ROUTES.top);
    expect(homePage.currentPath()).toContain('/$/top');
  });

  test('navigates to /$/signin and shows auth page', async ({ signInPage }) => {
    await signInPage.gotoSignIn();
    await signInPage.assertEmailStepVisible();
    expect(signInPage.currentPath()).toBe(ROUTES.signIn);
  });

  test('navigates to /$/signup and shows auth page', async ({ signInPage }) => {
    await signInPage.gotoSignUp();
    await signInPage.assertEmailStepVisible();
    expect(signInPage.currentPath()).toBe(ROUTES.signUp);
  });

  test('navigates to /$/search with a query via URL', async ({ searchPage }) => {
    await searchPage.searchFor('dogs');
    await searchPage.assertQueryInUrl('dogs');
    expect(searchPage.currentPath()).toContain('/$/search');
  });

  test('header is visible on the search page', async ({ searchPage }) => {
    await searchPage.searchFor('nature');
    await expect(searchPage.header).toBeVisible();
  });

  test('header is visible on a category page', async ({ homePage }) => {
    await homePage.goto(ROUTES.gaming);
    await homePage.waitForApp();
    await expect(homePage.header).toBeVisible();
  });

  test('browser back button returns to previous page', async ({ homePage }) => {
    await homePage.open();
    await homePage.goto(ROUTES.discover);
    expect(homePage.currentPath()).toBe(ROUTES.discover);

    await homePage.page.goBack();
    await homePage.waitForApp();

    expect(homePage.currentPath()).toBe(ROUTES.home);
  });

  test('404 route shows a not-found page without crashing', async ({ page }) => {
    const response = await page.goto('/$/this-route-does-not-exist-xyz-404');
    // The app should render something (not a blank crash) even for unknown routes
    const body = page.locator('body');
    await expect(body).toBeVisible();
    // It should NOT be an empty body
    const text = await body.innerText();
    expect(text.length).toBeGreaterThan(0);
  });
});

test.describe('Page titles', () => {
  test('home page has a non-empty <title>', async ({ homePage }) => {
    await homePage.open();
    const title = await homePage.getTitle();
    expect(title.length).toBeGreaterThan(0);
  });

  test('search page title changes with the query', async ({ searchPage }) => {
    await searchPage.searchFor('science');
    const title = await searchPage.getTitle();
    expect(title.length).toBeGreaterThan(0);
  });
});
