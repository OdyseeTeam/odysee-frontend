declare type StripeState = {
  canReceiveFiatTipsById: { [id: string]: boolean },
  bankAccountConfirmed: ?boolean,
  hasSavedCard: ?boolean,
  accountTotals: { total_received_unpaid: ?number, total_paid_out: ?number },
  accountStatus: { accountConfirmed: ?boolean, stillRequiringVerification: ?boolean },
  accountNotConfirmedButReceivedTips: ?boolean,
  stripeConnectionUrl: ?string,
  accountPendingConfirmation: ?boolean,
  accountTransactions: ?any,
  accountPaymentHistory: ?any,
  lastFour: ?string,
};

declare type CurrencyOption = 'usd' | 'eur';
