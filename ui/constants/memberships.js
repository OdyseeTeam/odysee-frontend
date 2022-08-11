// @flow
import * as STRIPE from 'constants/stripe';

export const DESCRIPTIONS = Object.freeze({
  Premium: 'Badge on profile, automatic rewards confirmation, and early access to new features',
  'Premium+': 'Badge on profile, automatic rewards confirmation, early access to new features, and no ads',
});

export const INTERVALS = Object.freeze({
  year: 'Yearly',
  month: 'Monthly',
});

export const CURRENCY_SYMBOLS = Object.freeze({
  eur: '€',
  usd: '$',
});

export const PRICES = Object.freeze({
  Premium: { [STRIPE.CURRENCIES.EUR]: '€0.89', [STRIPE.CURRENCIES.USD]: '99¢' },
  'Premium+': { [STRIPE.CURRENCIES.EUR]: '€2.68', [STRIPE.CURRENCIES.USD]: '$2.99' },
});
