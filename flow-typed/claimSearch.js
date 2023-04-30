// @flow

declare type DoClaimSearchSettings = {|
  useAutoPagination?: boolean,
  fetch?: {|
    viewCount?: boolean,
  |}
|};

declare type NotTagInput = {
  notTags?: Array<string>,
  showNsfw?: boolean,
  hideMembersOnly?: boolean,
};
