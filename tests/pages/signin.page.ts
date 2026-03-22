import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { ROUTES } from '../helpers/routes';

/**
 * SignInPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object Model for the Odysee sign-in flow (/$/signin).
 *
 * Covers:
 *   - Email entry step
 *   - Password entry step  (appears after email is confirmed as existing)
 *   - Sign-up redirect     (appears when email is not yet registered)
 *   - Error / validation states
 *   - Post-login assertions
 */
export class SignInPage extends BasePage {
  // ── Email step ────────────────────────────────────────────────────────────
  readonly emailInput: Locator;
  readonly emailContinueButton: Locator;

  // ── Password step ─────────────────────────────────────────────────────────
  readonly passwordInput: Locator;
  readonly passwordSubmitButton: Locator;
  readonly forgotPasswordLink: Locator;

  // ── Sign-up / register step ───────────────────────────────────────────────
  readonly signUpEmailInput: Locator;
  readonly signUpPasswordInput: Locator;
  readonly signUpSubmitButton: Locator;

  // ── Shared / misc ─────────────────────────────────────────────────────────
  /** Generic error message element shown below form fields */
  readonly errorMessage: Locator;
  /** Inline field-level error (e.g. "Invalid email") */
  readonly fieldError: Locator;
  /** Loading spinner shown while the request is in-flight */
  readonly loadingSpinner: Locator;
  /** Link that switches between sign-in and sign-up views */
  readonly toggleAuthModeLink: Locator;
  /** "Back" / cancel button on auth pages */
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);

    // ── Email step ──────────────────────────────────────────────────────────
    this.emailInput = page.locator('input[type="email"], input[name="email"]').first();
    this.emailContinueButton = page
      .getByRole('button', { name: /continue|next|submit/i })
      .first();

    // ── Password step ───────────────────────────────────────────────────────
    this.passwordInput = page.locator('input[type="password"]').first();
    this.passwordSubmitButton = page
      .getByRole('button', { name: /log in|sign in|continue|submit/i })
      .first();
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot|reset password/i }).first();

    // ── Sign-up ─────────────────────────────────────────────────────────────
    this.signUpEmailInput = page.locator('input[type="email"]').first();
    this.signUpPasswordInput = page.locator('input[type="password"]').first();
    this.signUpSubmitButton = page
      .getByRole('button', { name: /sign up|create account|register/i })
      .first();

    // ── Shared ──────────────────────────────────────────────────────────────
    this.errorMessage = page.locator(
      '.error-msg, .form-field__error, [class*="error"], .alert--error'
    ).first();
    this.fieldError = page.locator('.form-field__error').first();
    this.loadingSpinner = page.locator('.spinner, [class*="spinner"]').first();
    this.toggleAuthModeLink = page
      .getByRole('link', { name: /sign up|log in|already have an account/i })
      .first();
    this.backButton = page
      .getByRole('button', { name: /back|cancel/i })
      .or(page.getByRole('link', { name: /back|cancel/i }))
      .first();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  /** Navigate directly to the sign-in page and wait for the email input. */
  async gotoSignIn(): Promise<void> {
    await this.goto(ROUTES.signIn);
    await this.emailInput.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Navigate directly to the sign-up page and wait for the email input. */
  async gotoSignUp(): Promise<void> {
    await this.goto(ROUTES.signUp);
    await this.emailInput.waitFor({ state: 'visible', timeout: 15_000 });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Actions – email step
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Fill the email field and click Continue.
   * Odysee uses a multi-step flow: first email, then password on the next step.
   */
  async enterEmail(email: string): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible' });
    await this.emailInput.fill(email);
    await this.emailContinueButton.click();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Actions – password step
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Fill the password field and submit.
   * Call this after `enterEmail()` has revealed the password step.
   */
  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.passwordInput.fill(password);
    await this.passwordSubmitButton.click();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // High-level composite actions
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Full sign-in flow: navigate → enter email → enter password.
   * Does NOT assert success; call `assertSignedIn()` after if needed.
   *
   * @example
   * await signInPage.signIn('user@example.com', 'mypassword');
   * await signInPage.assertSignedIn();
   */
  async signIn(email: string, password: string): Promise<void> {
    await this.gotoSignIn();
    await this.enterEmail(email);
    await this.enterPassword(password);
    // Wait for either a redirect away from auth pages or the home page to load
    await this.page
      .waitForURL((url) => !url.pathname.includes('/$/signin'), { timeout: 15_000 })
      .catch(() => {
        // If still on signin page, let the caller assert – avoids swallowing
        // genuine failures like bad credentials.
      });
  }

  /**
   * Sign-up flow: navigate to signup → enter email → enter password → submit.
   */
  async signUp(email: string, password: string): Promise<void> {
    await this.gotoSignUp();
    await this.signUpEmailInput.waitFor({ state: 'visible' });
    await this.signUpEmailInput.fill(email);
    await this.signUpPasswordInput.fill(password);
    await this.signUpSubmitButton.click();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Assertions
  // ──────────────────────────────────────────────────────────────────────────

  /** Assert the email input step is visible (start of auth flow). */
  async assertEmailStepVisible(): Promise<void> {
    await expect(this.emailInput, 'Email input should be visible').toBeVisible();
  }

  /** Assert the password input step is visible (after email confirmation). */
  async assertPasswordStepVisible(): Promise<void> {
    await expect(
      this.passwordInput,
      'Password input should appear after email step'
    ).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Assert that a visible error message matches the expected text / pattern.
   *
   * @example
   * await signInPage.assertError(/incorrect password/i);
   */
  async assertError(expected: string | RegExp): Promise<void> {
    await expect(this.errorMessage, 'An error message should be visible').toBeVisible({
      timeout: 8_000,
    });
    await expect(this.errorMessage).toContainText(expected);
  }

  /**
   * Assert that NO error message is currently shown.
   */
  async assertNoError(): Promise<void> {
    await expect(this.errorMessage).not.toBeVisible();
  }

  /**
   * Assert that the page redirected away from the sign-in URL,
   * indicating a successful login.
   */
  async assertLoginSuccess(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/\$\/signin/);
    await this.assertSignedIn();
  }

  /**
   * Assert that the user is still on the sign-in page (login failed).
   */
  async assertLoginFailed(): Promise<void> {
    await expect(this.page).toHaveURL(/\/\$\/signin/);
  }

  /**
   * Assert that the "Forgot password" link is visible.
   */
  async assertForgotPasswordLinkVisible(): Promise<void> {
    await expect(this.forgotPasswordLink).toBeVisible({ timeout: 10_000 });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // State queries
  // ──────────────────────────────────────────────────────────────────────────

  /** Returns true when an error message is currently displayed. */
  async hasError(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }

  /** Returns the current error message text, or null if none is shown. */
  async getErrorText(): Promise<string | null> {
    if (!(await this.errorMessage.isVisible())) return null;
    return this.errorMessage.innerText();
  }

  /** Returns true when the loading spinner is shown. */
  async isLoading(): Promise<boolean> {
    return this.loadingSpinner.isVisible();
  }
}
