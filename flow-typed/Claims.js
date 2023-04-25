/**
 * Flow types for the Claims slice.
 */

// @flow

// -- TODO:
// declare type ClaimsState = {
// };

declare type ClaimSearchResultsInfo = {|
  page: number, // last queried page
  pageSize: number,
  totalItems?: number,
  totalPages?: number,
|};
