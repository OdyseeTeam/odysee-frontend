// @flow

declare type DoClaimSearchSettings = {|
  useAutoPagination?: boolean,
  noUpperReleaseTimeLimit?: boolean,
  fetch?: {|
    viewCount?: boolean,
  |}
|};

declare type NotTagInput = {
  notTags?: Array<string>,
  showNsfw?: boolean,
  hideMembersOnly?: boolean,
};
