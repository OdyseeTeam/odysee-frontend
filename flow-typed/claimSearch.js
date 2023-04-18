// @flow

declare type DoClaimSearchSettings = {
  useAutoPagination?: boolean,
  fetchStripeTransactions?: boolean,
};

declare type NotTagInput = {
  notTags?: Array<string>,
  showNsfw?: boolean,
  hideMembersOnly?: boolean,
};
