// @flow
import * as STRIPE from 'constants/stripe';

export const ODYSEE_TIER_NAMES = Object.freeze({ PREMIUM: 'Premium', PREMIUM_PLUS: 'Premium+' });

export const DESCRIPTIONS = Object.freeze({
  [ODYSEE_TIER_NAMES.PREMIUM]: 'Badge on profile, automatic rewards confirmation, and early access to new features',
  [ODYSEE_TIER_NAMES.PREMIUM_PLUS]:
    'Badge on profile, automatic rewards confirmation, early access to new features, and no ads',
});

export const INTERVALS = Object.freeze({ year: 'Yearly', month: 'Monthly' });

export const PRICES = Object.freeze({
  [ODYSEE_TIER_NAMES.PREMIUM]: { [STRIPE.CURRENCIES.EUR]: '€0.89', [STRIPE.CURRENCIES.USD]: '99¢' },
  [ODYSEE_TIER_NAMES.PREMIUM_PLUS]: { [STRIPE.CURRENCIES.EUR]: '€2.68', [STRIPE.CURRENCIES.USD]: '$2.99' },
});
