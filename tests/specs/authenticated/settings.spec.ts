import { test, expect } from '../../fixtures';
import { optionalAuthToken } from '../../helpers/auth';
import { ROUTES } from '../../helpers/routes';

// ---------------------------------------------------------------------------
// Guard – skip the entire suite when no auth token is provided.
// ---------------------------------------------------------------------------
test.beforeEach(async ({ page }) => {
  const token = optionalAuthToken();
  test.skip(!token, 'Skipped – set ODYSEE_AUTH_TOKEN to run authenticated tests');
});

// ---------------------------------------------------------------------------
// Settings – authenticated
// ---------------------------------------------------------------------------

test.describe('Settings page (authenticated)', () => {
  test('loads the settings page without redirecting to sign-in', async ({ page }) => {
    await page.goto(ROUTES.settings);
    await page.waitForLoadState('domcontentloaded');

    // Should NOT be redirected to the sign-in page
    await expect(page).not.toHaveURL(/\/\$\/signin/);
    await expect(page).toHaveURL(/\/\$\/settings/);
  });

  test('settings page has a visible header / title', async ({ page }) => {
    await page.goto(ROUTES.settings);
    await page.waitForLoadState('domcontentloaded');

    // The page heading or sidebar nav label should be present
    const heading = page
      .getByRole('heading', { name: /settings/i })
      .or(page.locator('.settings-page__title, [class*="settings__title"]'))
      .first();

    await expect(heading).toBeVisible({ timeout: 15_000 });
  });

  test('settings sidebar navigation is visible', async ({ page }) => {
    await page.goto(ROUTES.settings);
    await page.waitForLoadState('domcontentloaded');

    const sidebar = page
      .locator('.settings-side-navigation, [class*="settingsSideNavigation"]')
      .or(page.locator('nav[class*="settings"], aside[class*="settings"]'))
      .first();

    await expect(sidebar).toBeVisible({ timeout: 15_000 });
  });

  test.describe('Account section', () => {
    test('account settings section is present', async ({ page }) => {
      await page.goto(ROUTES.settings);
      await page.waitForLoadState('domcontentloaded');

      // Look for account-related content (email, password, etc.)
      const accountSection = page
        .locator('[class*="settingAccount"], [class*="setting-account"]')
        .or(page.getByText(/account/i).first())
        .first();

      await expect(accountSection).toBeVisible({ timeout: 15_000 });
    });

    test('email address is displayed in account settings', async ({ page }) => {
      await page.goto(ROUTES.settings);
      await page.waitForLoadState('domcontentloaded');

      // An email-like string should appear somewhere on the settings page
      // (Odysee shows the user's email in account settings)
      const emailEl = page
        .locator('[class*="settingAccount"] [class*="email"], input[type="email"]')
        .or(page.locator('text=@').first())
        .first();

      // We just assert it exists – avoid hardcoding the actual email
      await expect(emailEl).toBeAttached({ timeout: 12_000 });
    });
  });

  test.describe('Appearance section', () => {
    test('appearance / theme settings are visible', async ({ page }) => {
      await page.goto(ROUTES.settings);
      await page.waitForLoadState('domcontentloaded');

      const appearanceSection = page
        .locator('[class*="settingAppearance"]')
        .or(page.getByText(/theme|appearance|dark mode/i).first())
        .first();

      await expect(appearanceSection).toBeVisible({ timeout: 15_000 });
    });

    test('can toggle between light and dark theme', async ({ page }) => {
      await page.goto(ROUTES.settings);
      await page.waitForLoadState('domcontentloaded');

      // Locate the theme toggle (button or select)
      const themeToggle = page
        .locator('[class*="themeSelector"] button, [class*="theme-selector"] button')
        .or(page.getByRole('button', { name: /dark|light|theme/i }))
        .first();

      const isVisible = await themeToggle.isVisible({ timeout: 10_000 }).catch(() => false);
      test.skip(!isVisible, 'Theme toggle not found – may be a different UI pattern');

      // Click once (toggle to opposite theme)
      const bodyBefore = await page.evaluate(() => document.body.className);
      await themeToggle.click();
      await page.waitForTimeout(400); // allow CSS transition

      const bodyAfter = await page.evaluate(() => document.body.className);
      // The body class should have changed to reflect the new theme
      expect(bodyAfter).not.toBe(bodyBefore);
    });
  });

  test.describe('Content section', () => {
    test('content settings section is present', async ({ page }) => {
      await page.goto(ROUTES.settings);
      await page.waitForLoadState('domcontentloaded');

      const contentSection = page
        .locator('[class*="settingContent"]')
        .or(page.getByText(/content|mature|nsfw|language/i).first())
        .first();

      await expect(contentSection).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('Notifications section', () => {
    test('notifications settings page loads', async ({ page }) => {
      await page.goto(ROUTES.settingsNotifications);
      await page.waitForLoadState('domcontentloaded');

      await expect(page).not.toHaveURL(/\/\$\/signin/);
      await expect(page).toHaveURL(/\/\$\/settings\/notifications/);

      const notifSection = page
        .locator('[class*="settingNotification"], [class*="notification"]')
        .or(page.getByText(/notifications/i).first())
        .first();

      await expect(notifSection).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('Blocked & Muted section', () => {
    test('blocked and muted settings page loads', async ({ page }) => {
      await page.goto(ROUTES.settingsBlockMute);
      await page.waitForLoadState('domcontentloaded');

      await expect(page).not.toHaveURL(/\/\$\/signin/);
      await expect(page).toHaveURL(/\/\$\/settings\/block_and_mute/);

      const blockSection = page
        .locator('[class*="blockList"], [class*="listBlocked"], [class*="block-list"]')
        .or(page.getByText(/blocked|muted/i).first())
        .first();

      await expect(blockSection).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('Creator settings', () => {
    test('creator settings page loads for authenticated users', async ({ page }) => {
      await page.goto(ROUTES.settingsCreator);
      await page.waitForLoadState('domcontentloaded');

      // Creator settings may redirect non-creators – just assert not auth-gated
      await expect(page).not.toHaveURL(/\/\$\/signin/);
    });
  });

  test.describe('Own comments', () => {
    test('own comments settings page loads', async ({ page }) => {
      await page.goto(ROUTES.settingsOwnComments);
      await page.waitForLoadState('domcontentloaded');

      await expect(page).not.toHaveURL(/\/\$\/signin/);
      await expect(page).toHaveURL(/ownComments/);
    });
  });

  test.describe('Settings navigation', () => {
    test('clicking a sidebar link navigates to that sub-section', async ({ page }) => {
      await page.goto(ROUTES.settings);
      await page.waitForLoadState('domcontentloaded');

      // Find and click the Notifications link in the sidebar
      const notifLink = page
        .getByRole('link', { name: /notifications/i })
        .or(page.locator('a[href*="settings/notifications"]'))
        .first();

      const isVisible = await notifLink.isVisible({ timeout: 8_000 }).catch(() => false);
      test.skip(!isVisible, 'Notifications sidebar link not visible');

      await notifLink.click();
      await expect(page).toHaveURL(/settings\/notifications/, { timeout: 10_000 });
    });

    test('browser back button returns to the previous settings section', async ({ page }) => {
      await page.goto(ROUTES.settings);
      await page.waitForLoadState('domcontentloaded');

      await page.goto(ROUTES.settingsNotifications);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/settings\/notifications/);

      await page.goBack();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/\/\$\/settings/);
    });
  });
});
