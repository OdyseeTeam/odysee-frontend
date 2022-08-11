import * as STRIPE from 'constants/stripe';

declare type StripeState = {
  canReceiveFiatTipsById: { [id: string]: boolean },
  bankAccountConfirmed: ?boolean,
  hasSavedCard: ?boolean,
  accountTotals: { total_received_unpaid: ?number, total_paid_out: ?number },
  accountStatus: { accountConfirmed: ?boolean, stillRequiringVerification: ?boolean },
  accountNotConfirmedButReceivedTips: ?boolean,
  stripeConnectionUrl: ?string,
  accountPendingConfirmation: ?boolean,
  accountTransactions: ?StripeTransactions,
  accountPaymentHistory: ?StripeTransactions,
  lastFour: ?string,
};

declare type StripeTransactions = Array<StripeTransaction>;

declare type StripeTransaction = {
  name: string,
  channel_name: string,
  channel_claim_id: string,
  source_claim_id: string,
  tipped_amount: number,
  transaction_fee: number,
  application_fee: number,
  received_amount: number,
  created_at: number,
  private_tip: string,
};

declare type CurrencyOption = STRIPE.CURRENCIES.USD | STRIPE.CURRENCIES.EUR;
