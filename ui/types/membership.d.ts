/**
 * Membership / creator subscription types.
 */

type CreatorMembership = {
  id: string;
  name: string;
  description?: string;
  channel_id: string;
  channel_name: string;
  price?: { amount: number; currency: string };
  perks: Array<{ id: string; name: string; description?: string }>;
  [key: string]: any;
};

type CreatorMemberships = Array<CreatorMembership>;

type MembershipSub = {
  id: string;
  membership_id: string;
  channel_id: string;
  channel_name: string;
  price?: { amount: number; currency: string };
  status: string;
  created_at?: string;
  [key: string]: any;
};

type MembershipSubs = Array<MembershipSub>;

type MembershipOdyseePerk = {
  id: string;
  name: string;
  description?: string;
  [key: string]: any;
};

type MembershipTier = {
  id: string;
  name: string;
  description?: string;
  price?: { amount: number; currency: string };
  perks?: Array<MembershipOdyseePerk>;
  [key: string]: any;
};

type MembershipListParams = {
  channel_id?: string;
  channel_claim_id?: string;
  channel_name?: string;
  signature?: string;
  signing_ts?: string;
};

type MembershipCreateResponse = {
  [key: string]: any;
};

type MembershipUpdateTierParams = {
  id: string;
  name?: string;
  description?: string;
  price?: { amount: number; currency: string };
  perks?: Array<string>;
  [key: string]: any;
};

type MembershipAddTierParams = Omit<MembershipUpdateTierParams, 'id'> & {
  channel_id: string;
};

type MembershipBuyParams = {
  membership_id?: string;
  channel_id?: string;
  channel_name?: string;
  price_id?: string;
  tippedChannelId?: string;
  subscriberChannelId?: string;
  priceId?: any;
  membershipId?: any;
  [key: string]: any;
};

type MembershipPayment = {
  amount: number;
  currency: string;
  created_at: string;
  [key: string]: any;
};

type MembershipDetails = {
  [key: string]: any;
};

type MembershipContentResponse = {
  items: Array<MembershipContentResponseItem>;
  [key: string]: any;
};

type MembershipContentResponseItem = {
  claim_id: string;
  [key: string]: any;
};

type MembershipSubscribeParams = {
  price_id: string;
  [key: string]: any;
};

type MembershipSubscribeResponse = {
  [key: string]: any;
};

type MembershipSubscribedDataByCreatorId = Record<string, any>;
type MembershipMineDataByCreatorId = Record<string, any>;
type ChannelMembershipsByCreatorId = Record<string, any>;
type MemberRestrictionStatus = {
  isApplicable: boolean;
  isSelectionValid: boolean;
  isRestricting: boolean;
  details: {
    isUnlisted: boolean;
    isAnonymous: boolean;
    hasTiers: boolean;
    hasTiersWithRestrictions: boolean;
  };
};
