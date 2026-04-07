/**
 * Stripe / payment types.
 */

type StripeTransaction = {
  payment_intent_id: string;
  amount: number;
  currency: string;
  created_at: string;
  source_claim_id?: string;
  target_claim_id?: string;
  channel_name?: string;
  channel_claim_id?: string;
  tipped_amount?: number;
  tipper_channel_name?: string;
  private_tip?: boolean;
  type?: string;
  [key: string]: any;
};

type StripeTransactions = Array<StripeTransaction>;

type StripeState = {
  accountStatus?: StripeAccountStatus;
  customerStatus?: StripeCustomerStatus;
  accountTransactions?: StripeTransactions;
  customerTransactions?: StripeTransactions;
  [key: string]: any;
};

type StripeAccountStatus = {
  charges_enabled?: boolean;
  details_submitted?: boolean;
  payouts_enabled?: boolean;
  [key: string]: any;
};

type StripeAccountLink = {
  url: string;
  [key: string]: any;
};

type StripeCustomerStatus = {
  has_payment_method?: boolean;
  [key: string]: any;
};

type StripeCustomerSetupResponse = {
  client_secret: string;
  [key: string]: any;
};

type StripeCustomerListParams = {
  page?: number;
  page_size?: number;
  [key: string]: any;
};

type StripeCustomerPurchaseCostResponse = {
  amount: number;
  currency: string;
  [key: string]: any;
};

type StripeCheckout = {
  url: string;
  [key: string]: any;
};

type StripeCardDetails = {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  [key: string]: any;
};

type StripePriceDetails = {
  id: string;
  amount: number;
  currency: string;
  [key: string]: any;
};
