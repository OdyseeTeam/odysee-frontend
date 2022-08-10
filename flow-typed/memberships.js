declare type MembershipBuyParams = {
  membership_id: string,
  channel_id: string,
  channel_name: string,
  price_id: string,
};

declare type MembershipListParams = {
  channel_id: string,
  channel_name: string,
};

declare type MembershipData = {
  Membership: Membership,
  MembershipDetails: MembershipDetails,
  Subscription: MembershipSubscriptionDetails,
  Perks: MembershipPerks,
  Prices: MembershipPriceDetails,
};

declare type MembershipOptions = Array<MembershipData>;

declare type Membership = {
  channel_name: string,
  membership_id: string,
  auto_renew: boolean,
};

declare type MembershipDetails = {
  name: string,
  description: string,
};

declare type MembershipSubscriptionDetails = {
  current_period_start: number,
  current_period_end: number,
};

declare type MembershipPerks = Array<string>;

declare type MembershipPriceDetails = {
  recurring: { interval: number },
  currency: CurrenyOption,
  unit_amount: number,
  id: string,
};

declare type MembershipAddTierParams = {
  channel_name: string,
  channel_id: string,
  name: string,
  description: string,
  currency: CurrencyOption,
  amount: number,
  perks: MembershipPerks,
  old_stripe_price: MembershipPriceDetails,
  membership_id: string,
};
