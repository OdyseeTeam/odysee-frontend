// @flow
import type { Node } from 'react';
import React from 'react';
import Button from 'component/button';
import ClaimPreviewTile from 'component/claimPreviewTile';
import I18nMessage from 'component/i18nMessage';
import useFetchViewCount from 'effects/use-fetch-view-count';
import useLastVisibleItem from 'effects/use-last-visible-item';
import useResolvePins from 'effects/use-resolve-pins';
import useGetUserMemberships from 'effects/use-get-user-memberships';

const SHOW_TIMEOUT_MSG = false;

function urisEqual(prev: ?Array<string>, next: ?Array<string>) {
  if (!prev || !next) {
    // ClaimList: "null" and "undefined" have special meaning,
    // so we can't just compare array length here.
    //   - null = "timed out"
    //   - undefined = "no result".
    return prev === next;
  }

  // $FlowFixMe - already checked for null above.
  return prev.length === next.length && prev.every((value, index) => value === next[index]);
}

// ****************************************************************************
// ClaimTilesDiscover
// ****************************************************************************

type Props = {
  prefixUris?: Array<string>,
  pins?: { urls?: Array<string>, claimIds?: Array<string>, onlyPinForOrder?: string },
  uris: Array<string>,
  injectedItem?: { node: Node, index?: number, replace?: boolean },
  showNoSourceClaims?: boolean,
  renderProperties?: (Claim) => ?Node,
  fetchViewCount?: boolean,
  // claim search options are below
  tags: Array<string>,
  claimIds?: Array<string>,
  channelIds?: Array<string>,
  pageSize: number,
  orderBy?: Array<string>,
  releaseTime?: string,
  languages?: Array<string>,
  claimType?: string | Array<string>,
  streamTypes?: Array<string>,
  timestamp?: string,
  feeAmount?: string,
  limitClaimsPerChannel?: number,
  hasSource?: boolean,
  hasNoSource?: boolean,
  forceShowReposts?: boolean, // overrides SETTINGS.HIDE_REPOSTS
  // --- select ---
  location: { search: string },
  claimSearchResults: Array<string>,
  claimsByUri: { [string]: any },
  claimsById: { [string]: any },
  fetchingClaimSearch: boolean,
  showNsfw: boolean,
  hideReposts: boolean,
  optionsStringified: string,
  // --- perform ---
  doClaimSearch: ({}) => void,
  doFetchViewCount: (claimIdCsv: string) => void,
  doFetchUserMemberships: (claimIdCsv: string) => void,
  doResolveClaimIds: (Array<string>) => Promise<any>,
  doResolveUris: (Array<string>, boolean) => Promise<any>,
};

function ClaimTilesDiscover(props: Props) {
  const {
    doClaimSearch,
    claimSearchResults,
    claimsByUri,
    claimsById,
    fetchViewCount,
    fetchingClaimSearch,
    hasNoSource,
    // forceShowReposts = false,
    renderProperties,
    pins,
    prefixUris,
    injectedItem,
    showNoSourceClaims,
    doFetchViewCount,
    pageSize = 8,
    optionsStringified,
    doFetchUserMemberships,
    doResolveClaimIds,
    doResolveUris,
  } = props;

  const listRef = React.useRef();
  const injectedIndex = useLastVisibleItem(injectedItem, listRef);

  const prevUris = React.useRef();
  const claimSearchUris = claimSearchResults || [];
  const isUnfetchedClaimSearch = claimSearchResults === undefined;
  const resolvedPinUris = useResolvePins({ pins, claimsById, doResolveClaimIds, doResolveUris });

  const timedOut = claimSearchResults === null;
  const shouldPerformSearch = !fetchingClaimSearch && !timedOut && claimSearchUris.length === 0;

  const uris = (prefixUris || []).concat(claimSearchUris);
  if (prefixUris && prefixUris.length) uris.splice(prefixUris.length * -1, prefixUris.length);

  if (window.location.pathname === '/') {
    injectPinUrls(uris, pins, resolvedPinUris);
  }

  if (uris.length > 0 && uris.length < pageSize && shouldPerformSearch) {
    // prefixUri and pinUrls might already be present while waiting for the
    // remaining claim_search results. Fill the space to prevent layout shifts.
    uris.push(...Array(pageSize - uris.length).fill(''));
  }

  // Show previous results while we fetch to avoid blinkies and poor CLS.
  const finalUris = isUnfetchedClaimSearch && prevUris.current ? prevUris.current : uris;
  prevUris.current = finalUris;

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------

  function injectPinUrls(uris, pins, resolvedPinUris) {
    if (!pins || !uris || uris.length <= 2) {
      return;
    }

    if (resolvedPinUris) {
      resolvedPinUris.forEach((pin) => {
        if (uris.includes(pin)) {
          uris.splice(uris.indexOf(pin), 1);
        } else {
          uris.pop();
        }
      });

      uris.splice(2, 0, ...resolvedPinUris);
    }
  }

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------

  useFetchViewCount(fetchViewCount, uris, claimsByUri, doFetchViewCount);

  useGetUserMemberships(true, uris, claimsByUri, doFetchUserMemberships);

  React.useEffect(() => {
    if (shouldPerformSearch) {
      const searchOptions = JSON.parse(optionsStringified);
      doClaimSearch(searchOptions);
    }
  }, [doClaimSearch, shouldPerformSearch, optionsStringified]);

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------

  if (timedOut && SHOW_TIMEOUT_MSG) {
    return (
      <div className="empty empty--centered">
        <p>{__('Sorry, your request timed out. Try refreshing in a bit.')}</p>
        <p>
          <I18nMessage
            tokens={{
              contact_support: (
                <Button
                  button="link"
                  label={__('contact support')}
                  href="https://odysee.com/@OdyseeHelp:b?view=about"
                />
              ),
            }}
          >
            If you continue to have issues, please %contact_support%.
          </I18nMessage>
        </p>
      </div>
    );
  }

  return (
    <ul ref={listRef} className="claim-grid">
      {finalUris && finalUris.length
        ? finalUris.map((uri, i) => {
            if (uri) {
              if (injectedIndex === i && injectedItem && injectedItem.replace) {
                return <React.Fragment key={uri}>{injectedItem.node}</React.Fragment>;
              }

              return (
                <React.Fragment key={uri}>
                  {injectedIndex === i && injectedItem && injectedItem.node}
                  <ClaimPreviewTile
                    showNoSourceClaims={hasNoSource || showNoSourceClaims}
                    uri={uri}
                    properties={renderProperties}
                  />
                </React.Fragment>
              );
            } else {
              return <ClaimPreviewTile showNoSourceClaims={hasNoSource || showNoSourceClaims} key={i} placeholder />;
            }
          })
        : new Array(pageSize)
            .fill(1)
            .map((x, i) => (
              <ClaimPreviewTile showNoSourceClaims={hasNoSource || showNoSourceClaims} key={i} placeholder />
            ))}
    </ul>
  );
}

export default React.memo<Props>(ClaimTilesDiscover, areEqual);

// ****************************************************************************
// ****************************************************************************

function trace(key, value) {
  // @if process.env.DEBUG_TILE_RENDER
  // $FlowFixMe "cannot coerce certain types".
  console.log(`[claimTilesDiscover] ${key}: ${value}`); // eslint-disable-line no-console
  // @endif
}

function areEqual(prev: Props, next: Props) {
  // --- Deep-compare ---
  // These are props that are hard to memoize from where it is passed.

  if (prev.claimType !== next.claimType) {
    // Array<string>: confirm the contents are actually different.
    if (prev.claimType && next.claimType && JSON.stringify(prev.claimType) !== JSON.stringify(next.claimType)) {
      trace('claimType', next.claimType);
      return false;
    }
  }

  const ARRAY_KEYS = ['prefixUris', 'channelIds'];
  for (let i = 0; i < ARRAY_KEYS.length; ++i) {
    const key = ARRAY_KEYS[i];
    if (!urisEqual(prev[key], next[key])) {
      trace(key, next[key]);
      return false;
    }
  }

  // --- Default the rest(*) to shallow-compare ---
  // (*) including new props introduced in the future, in case developer forgets
  // to update this function. Better to render more than miss an important one.
  const KEYS_TO_IGNORE = [
    ...ARRAY_KEYS,
    'claimType', // Handled above.
    'claimsByUri', // Used for view-count. Just ignore it for now.
    'location',
    'history',
    'match',
    'doClaimSearch',
  ];

  const propKeys = Object.keys(next);
  for (let i = 0; i < propKeys.length; ++i) {
    const pk = propKeys[i];
    if (!KEYS_TO_IGNORE.includes(pk) && prev[pk] !== next[pk]) {
      trace(pk, next[pk]);
      return false;
    }
  }

  return true;
}
