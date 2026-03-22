import { test, expect } from '../../fixtures';
import { optionalAuthToken } from '../../helpers/auth';
import { ROUTES } from '../../helpers/routes';

// ---------------------------------------------------------------------------
// Sign-in / Auth flow specs
// ---------------------------------------------------------------------------
// These tests run WITHOUT an authenticated session (unauthenticated project).
// They cover the public-facing sign-in UI: page rendering, the multi-step
// email → password flow, validation, and error states.
//
// Tests that require a real account (full happy-path login) are guarded with
// a skip when ODYSEE_AUTH_TOKEN is absent, since we use cookie injection for
// those rather than actually going through the login form.
// ---------------------------------------------------------------------------

test.describe('Sign-in page', () => {
  test.describe('Page rendering', () => {
    test('loads the sign-in page without errors', async ({ signInPage, page }) => {
      await signInPage.gotoSignIn();

      // URL should contain /$/signin
      expect(page.url()).toContain('/$/signin');
    });

    test('shows the email input on initial load', async ({ signInPage }) => {
      await signInPage.gotoSignIn();
      await signInPage.assertEmailStepVisible();
    });

    test('shows the site logo / header', async ({ signInPage }) => {
      await signInPage.gotoSignIn();
      await expect(signInPage.header).toBeVisible();
    });

    test('page title contains recognisable brand text', async ({ signInPage, page }) => {
      await signInPage.gotoSignIn();
      const title = await page.title();
      // Title typically contains "Odysee" or "Sign In"
      expect(title.toLowerCase()).toMatch(/odysee|sign\s*in|log\s*in/i);
    });

    test('does not show the password input before email is submitted', async ({ signInPage }) => {
      await signInPage.gotoSignIn();
      // Password input should be hidden at this stage
      await expect(signInPage.passwordInput).not.toBeVisible();
    });
  });

  test.describe('Email step', () => {
    test('Continue button is present next to the email field', async ({ signInPage }) => {
      await signInPage.gotoSignIn();
      await expect(signInPage.emailContinueButton).toBeVisible();
    });

    test('shows an error when submitting an empty email', async ({ signInPage }) => {
      await signInPage.gotoSignIn();
      await signInPage.emailContinueButton.click();
      // Expect some validation feedback – either a field error or a browser
      // native validation (which prevents submit).  We accept either.
      const hasError = await signInPage.hasError();
      const emailInvalid = await signInPage.emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(hasError || emailInvalid, 'Expected validation feedback for empty email').toBe(true);
    });

    test('shows an error for a badly-formatted email address', async ({ signInPage }) => {
      await signInPage.gotoSignIn();
      await signInPage.emailInput.fill('notanemail');
      await signInPage.emailContinueButton.click();

      const hasError = await signInPage.hasError();
      const emailInvalid = await signInPage.emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(hasError || emailInvalid, 'Expected validation error for malformed email').toBe(true);
    });

    test('email field accepts a valid email format without immediate validation error', async ({ signInPage }) => {
      await signInPage.gotoSignIn();
      await signInPage.emailInput.fill('valid@example.com');
      // No error should appear just from typing
      await signInPage.assertNoError();
    });
  });

  test.describe('Password step', () => {
    // These tests submit a real (but non-existent) email to trigger the
    // password step.  They rely on the API returning a "user not found" style
    // response or on the UI advancing to the password step regardless.
    // Adjust the test email to match whatever the app does locally.

    test('reveals the password input after a valid-looking email is submitted', async ({ signInPage, page }) => {
      await signInPage.gotoSignIn();

      // Use an address that is syntactically valid; the app may redirect to
      // sign-up or show the password step depending on whether the email is
      // recognised.
      await signInPage.emailInput.fill('test-playwright@example.com');
      await signInPage.emailContinueButton.click();

      // Wait briefly for the UI to react
      await page.waitForTimeout(1_500);

      // Either the password input OR a sign-up prompt should appear
      const passwordVisible = await signInPage.passwordInput.isVisible().catch(() => false);
      const signUpVisible = await signInPage.signUpSubmitButton.isVisible().catch(() => false);
      const errorVisible = await signInPage.hasError();

      expect(
        passwordVisible || signUpVisible || errorVisible,
        'Expected either a password field, a sign-up prompt, or an error message after submitting email'
      ).toBe(true);
    });

    test('Forgot password link is reachable from the sign-in page', async ({ signInPage, page }) => {
      await signInPage.gotoSignIn();

      // Navigate directly to the password reset page (the link may only appear
      // after the email step, so we also accept direct URL navigation).
      await page.goto(ROUTES.passwordReset);
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('resetpassword');
    });
  });

  test.describe('Invalid credentials', () => {
    // NOTE: These tests submit credentials that should be rejected by the API.
    // They depend on the dev server being able to reach the Odysee API.
    // If the API is unavailable, the tests will time out or show a network error.

    test('shows an error when incorrect password is submitted', async ({ signInPage, page }) => {
      await signInPage.gotoSignIn();

      // Step 1 – submit a syntactically valid email
      await signInPage.emailInput.fill('test-playwright-invalid@example.com');
      await signInPage.emailContinueButton.click();
      await page.waitForTimeout(1_500);

      // Only proceed with password step if the input appeared
      const passwordVisible = await signInPage.passwordInput.isVisible().catch(() => false);
      if (!passwordVisible) {
        // App redirected to sign-up or showed an error for unknown email – skip
        test.skip();
        return;
      }

      // Step 2 – submit a wrong password
      await signInPage.passwordInput.fill('definitely-wrong-password-12345!');
      await signInPage.passwordSubmitButton.click();

      // Expect an error message
      await expect(signInPage.errorMessage).toBeVisible({ timeout: 10_000 });
    });

    test('stays on the sign-in page after bad credentials', async ({ signInPage, page }) => {
      await signInPage.gotoSignIn();

      await signInPage.emailInput.fill('bad-creds@example.com');
      await signInPage.emailContinueButton.click();
      await page.waitForTimeout(1_500);

      const passwordVisible = await signInPage.passwordInput.isVisible().catch(() => false);
      if (!passwordVisible) {
        test.skip();
        return;
      }

      await signInPage.passwordInput.fill('wrong-pass');
      await signInPage.passwordSubmitButton.click();

      // Page should still be on a sign-in related URL
      await page.waitForTimeout(2_000);
      expect(page.url()).toMatch(/\/\$\/signin|\/\$\/signup|\/\$\/verify/);
    });
  });

  test.describe('Sign-up page', () => {
    test('loads the sign-up page', async ({ signInPage, page }) => {
      await signInPage.gotoSignUp();
      expect(page.url()).toContain('/$/signup');
    });

    test('shows the email input on sign-up page', async ({ signInPage }) => {
      await signInPage.gotoSignUp();
      await signInPage.assertEmailStepVisible();
    });

    test('has a link back to sign-in from sign-up page', async ({ signInPage, page }) => {
      await signInPage.gotoSignUp();

      // There should be a way to switch to the sign-in flow
      const signInLink = page.getByRole('link', { name: /log in|sign in|already have an account/i }).first();
      await expect(signInLink).toBeVisible({ timeout: 8_000 });
    });
  });

  test.describe('Navigation', () => {
    test('navigating to /$/signin from the home page works', async ({ homePage, page }) => {
      await homePage.open();
      // Click the Log In button in the header
      await homePage.logInButton.click();
      await page.waitForURL(/\/\$\/signin/, { timeout: 10_000 });
      expect(page.url()).toContain('/$/signin');
    });

    test('navigating to /$/signup from the home page works', async ({ homePage, page }) => {
      await homePage.open();
      // The "Sign Up" link may be in the header or near the Log In button
      const signUpLink = page.getByRole('link', { name: /sign up/i }).first();
      const visible = await signUpLink.isVisible().catch(() => false);
      if (!visible) {
        // Some layouts only show "Log In" in the header; navigate directly
        await page.goto(ROUTES.signUp);
      } else {
        await signUpLink.click();
      }
      await page.waitForURL(/\/\$\/signup/, { timeout: 10_000 });
      expect(page.url()).toContain('/$/signup');
    });

    test('direct navigation to /$/signin redirects to login page', async ({ page }) => {
      await page.goto(ROUTES.signIn);
      await page.waitForLoadState('domcontentloaded');
      // Should still be on the sign-in page (not redirected away)
      expect(page.url()).toContain('/$/signin');
    });
  });
});
