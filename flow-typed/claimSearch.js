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
  showUnlisted?: boolean,
  hideMembersOnly?: boolean,
};
