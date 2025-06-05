declare type MembershipListParams = {
  id?: string,
  channel_id?: string,
  channel_claim_id: string,
};

declare type Perk = {
  id: number,
  name: string,
  description: string,
}
// -- CreatorMembership: data the creator sees for a given membership
declare type CreatorMembership = {
  membership_id: string,
  channel_name: string,
  channel_claim_id: string,
  name: string,
  description: string,
  perks: Array<Perk>,
  prices: [{id: number, amount: string, currency: string, address: string }],
  has_subscribers: boolean,
  enabled: boolean,
}

declare type MembershipSubscribeParams = {
  subscriber_channel_claim_id: string,
  price_id: string,
  source_payment_address: string,
}

declare type MembershipBuyParams = {
  membershipId: string, // just for redux state
  tippedChannelName: string,
  tippedChannelId: string,
  subscriberChannelId: string,
  priceId: number,
}

declare type SubscriptionPrice = {
  "id": number,
  "amount": number,
  "currency": string, // 'AR' , 'USD'
  "frequency": string,
  "crypto_amount": string,
  "transaction_amount": number,
  "transaction_currency": string,
}

declare type MembershipSubscribeResponse = {
  "subscription_id": number,
  "token": string,
  "payee_address": string,
  "start_time": number,
  "end_time": number,
  "price": SubscriptionPrice,
}

declare type CreatorMemberships = Array<CreatorMembership>;

// -- MembershipTier: data the supporter sees for a given membership
// declare type MembershipTier = {
//   Membership: Membership,
//   MembershipDetails: MembershipDetails,
//   Subscription: MembershipSubscriptionDetails,
//   Perks: MembershipOdyseePerks,
// };

declare type PaymentDetails = {
  amount: number,
  currency: string,
  frequency: string,
  initiated_at: number,
  completed_at: number,
  transaction_id: string,
  status: string,
}

// MembershipSubItem
declare type MembershipSub = {
  current_price: { amount: number, currency: "USD", frequency: "monthly", id: number },
  id: string, // this still?
  membership: Membership,
  subscription: {
    current_price: { amount: number, currency: "USD", frequency: "monthly", id: number },
    status: string,
    started_at: number,
    ends_at: string,
    earliest_renewal_at: string,
  },
  perks: Array<any>,
  payments: Array<PaymentDetails>,
  name: string,
  channel_claim_id: string,
}

/*

completed_at: "2025-05-28T21:12:07Z"
conversion_rate: 7.29
creator_channel_claim_id: "bd491cfe1cca4faee2dfaf7e9f10b9ed3495dcf1"
initiated_at: "2025-05-28T21:12:04Z"
is_subscriber_anonymous: false
membership_id: 2754
status: "paid"
subscriber_channel_claim_id: "210e284714708d185ac7ac791117608d1f92075f"
transaction_currency: "AR"
transaction_id: "4IZHeVbyBd9xHiRAmcgDEL-jBFFk2YBwkOQ_57hc94E"
usd_amount: 10
 */
declare type MembershipPayment = {
  completed_at: string, // "2025-05-28T21:12:07Z"
  conversion_rate: number,
  creator_channel_claim_id: string,
  initiated_at: string, // "2025-05-28T21:12:04Z"
  is_subscriber_anonymous: boolean,
  membership_id: number,
  status: string,
  subscriber_channel_claim_id: string,
  transaction_currency: string,
  transaction_id: string,
  usd_amount: number,
}

declare type Membership = {
  id: number,
  name: string,
  enabled: boolean,
  channel_claim_id: string,
}

declare type MembershipUpdateResponse = string;
declare type MembershipDetails = {
  activated: boolean,
  badge_url: string,
  channel_id: string,
  channel_name: string,
  created_at: string,
  description: string,
  id: number,
  is_live: boolean,
  level: number,
  name: string,
  stripe_product_id: string,
  type: string,
  updated_at: string,
  user_id: number,
};

declare type MembershipSubscriptionDetails = {
  application_fee_percent: number,
  automatic_tax: { enabled: boolean },
  billing_cycle_anchor: number,
  billing_thresholds: ?{},
  cancel_at: number,
  cancel_at_period_end: boolean,
  canceled_at: number,
  collection_method: string,
  created: number,
  current_period_end: number,
  current_period_start: number,
  customer: {},
  days_until_due: number,
  default_payment_method: {},
  default_source: ?{},
  default_tax_rates: Array<any>,
  discount: ?number,
  ended_at: number,
  id: string,
  items: {},
  latest_invoice: {},
  livemode: boolean,
  metadata: {},
  next_pending_invoice_item_invoice: number,
  object: string,
  on_behalf_of: ?string,
  pause_collection: {},
  payment_settings: {},
  pending_invoice_item_interval: {},
  pending_setup_intent: ?{},
  pending_update: ?{},
  plan: {
    currency: string,
    amount: number,
    interval: string,
  },
  quantity: number,
  schedule: ?{},
  start_date: number,
  status: string,
  transfer_data: ?{},
  trial_end: number,
  trial_start: number,
};

declare type MembershipOdyseePerk = {
  created_at: string,
  description: string,
  id: number,
  image_url: ?string,
  is_odysee_perk: boolean,
  name: string,
  updated_at: string,
};
declare type MembershipOdyseePerks = Array<MembershipOdyseePerk>;

declare type MembershipNewStripePriceDetails = {
  Price: MembershipPriceDetails,
  StripePrice: StripePriceDetails,
  creator_receives_amount: number,
  client_pays: number,
  fees: {
    stripe_fee: number,
    odysee_fee: number,
  },
};

declare type MembershipPriceDetails = {
  amount: number,
  created_at: string,
  currency: string,
  id: number,
  is_annual: boolean,
  membership_id: number,
  stripe_price_id: string,
  stripe_product_id: string,
  updated_at: string,
};

declare type StripePriceDetails = {
  active: boolean,
  billing_scheme: string,
  created: number,
  currency: string,
  deleted: boolean,
  id: string,
  livemode: boolean,
  lookup_key: string,
  metadata: {},
  nickname: string,
  object: string,
  product: {
    active: boolean,
    attributes: ?{},
    caption: string,
    created: number,
    deactivate_on: ?string,
    deleted: boolean,
    description: string,
    id: string,
    images: ?{},
    livemode: boolean,
    metadata: ?{},
    name: string,
    object: string,
    package_dimensions: ?{},
    shippable: boolean,
    statement_descriptor: string,
    tax_code: ?{},
    type: string,
    unit_label: string,
    updated: number,
    url: string,
  },
  recurring: {
    aggregate_usage: string,
    interval: string,
    interval_count: number,
    trial_period_days: number,
    usage_type: string,
  },
  tax_behavior: string,
  tiers: ?{},
  tiers_mode: string,
  transform_quantity: ?number,
  type: string,
  unit_amount: number,
  unit_amount_decimal: string,
};

declare type MembershipAddTierParams = {
  channel_name: string,
  channel_id: string,
  name: string,
  description: string,
  currency: string,
  amount: number,
  perks: string, // csv
  frequency: string,
  payment_address_id: string,
};

declare type MembershipUpdateTierParams = {
  new_name?: string,
  new_description?: string,
  new_amount?: number,
  membership_id: number,
}

declare type MembershipCreateResponse = {
  membership_id: number,
  name: string,
  description: string,
}

declare type MembershipSubs = Array<MembershipSub>;

declare type MembershipSubscribedDataByCreatorId = { [id: ClaimId]: Array<MembershipSub> };

declare type MembershipIdByChannelId = {
  [channelId: string]: string,
};
declare type ChannelMembershipsByCreatorId = {
  [creatorId: string]: Array<MembershipIdByChannelId>,
};

declare type MembershipSubscriber = {
  subscriber_channel_name: string,
  subscriber_channel_claim_id: string,
  supported_channel_name: string,
  membership_name: string,
  price: number,
  currency: string,
  interval: string,
  joined_at: any, // number or datestring?
}

declare type MembershipSupporter = {
  ChannelBeingSupported: string,
  ChannelName: string,
  ChannelID: string,
  Interval: string,
  JoinedAtTime: string,
  MembershipName: string,
  Price: number,
};
declare type SupportersList = Array<MembershipSubscriber>;

declare type MembershipContentResponse = Array<MembershipContentResponseItem>;
declare type MembershipContentResponseItem = {
  channel_id: string,
  claim_id: string,
  membership_id: number,
};
