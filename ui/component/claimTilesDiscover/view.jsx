// @flow
import type { Node } from 'react';
import React, { useRef } from 'react';
import Button from 'component/button';
import ClaimPreviewTile from 'component/claimPreviewTile';
import I18nMessage from 'component/i18nMessage';
import useGetLastVisibleSlot from 'effects/use-get-last-visible-slot';
import useResolvePins from 'effects/use-resolve-pins';
import classNames from 'classnames';
import { HomepageTitles } from 'util/buildHomepage';

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
  injectedItem?: ListInjectedItem,
  showNoSourceClaims?: boolean,
  renderProperties?: (Claim) => ?Node,
  fetchViewCount?: boolean,
  // claim search options are below
  tags: Array<string>,
  notTags?: Array<string>,
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
  hideMembersOnly?: boolean, // undefined = use SETTING.HIDE_MEMBERS_ONLY_CONTENT; true/false: use this override.
  loading: boolean,
  duration?: string,
  contentAspectRatio?: string,
  // --- select ---
  location: { search: string },
  claimSearchResults: Array<string>,
  claimSearchLastPageReached: ?boolean,
  fetchingClaimSearch: boolean,
  showNsfw: boolean,
  hideReposts: boolean,
  optionsStringified: string,
  // --- perform ---
  doClaimSearch: (ClaimSearchOptions, ?DoClaimSearchSettings) => void,
  doFetchOdyseeMembershipForChannelIds: (claimIds: ClaimIds) => void,
  doResolveClaimIds: (Array<string>) => Promise<any>,
  doResolveUris: (Array<string>, boolean) => Promise<any>,
  excludeShorts?: boolean,
  sectionTitle?: HomepageTitles,
  isShorts?: boolean,
};

function ClaimTilesDiscover(props: Props) {
  const {
    doClaimSearch,
    claimSearchResults,
    claimSearchLastPageReached,
    fetchViewCount,
    fetchingClaimSearch,
    hasNoSource,
    // forceShowReposts = false,
    renderProperties,
    pins,
    prefixUris,
    injectedItem,
    showNoSourceClaims,
    pageSize = 8,
    optionsStringified,
    channelIds,
    doFetchOdyseeMembershipForChannelIds,
    doResolveClaimIds,
    doResolveUris,
    loading,
    sectionTitle,
  } = props;

  const listRef = React.useRef();
  const findLastVisibleSlot = injectedItem && injectedItem.node && injectedItem.index === undefined;
  const lastVisibleIndex = useGetLastVisibleSlot(listRef, !findLastVisibleSlot);

  const prevUris = React.useRef();
  const claimSearchUris = claimSearchResults || [];
  const isUnfetchedClaimSearch = claimSearchResults === undefined;
  const resolvedPinUris = useResolvePins({ pins, doResolveClaimIds, doResolveUris });
  const uriBuffer = useRef([]);

  const timedOut = claimSearchResults === null;
  const shouldPerformSearch =
    !fetchingClaimSearch && !timedOut && claimSearchUris.length === 0 && !claimSearchLastPageReached;

  const uris = (prefixUris || []).concat(claimSearchUris);
  if (prefixUris && prefixUris.length) uris.splice(prefixUris.length * -1, prefixUris.length);

  if (window.location.pathname === '/') {
    injectPinUrls(uris, pins, resolvedPinUris);
  }

  // Show previous results while we fetch to avoid blinkies and poor CLS.
  const finalUris = isUnfetchedClaimSearch && prevUris.current ? prevUris.current : uris;
  prevUris.current = finalUris;

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------

  /**
   * Injects pinned URLs into `uris` in-place.
   * i.e. don't use immutable functions like concat().
   */
  function injectPinUrls(uris, pins, resolvedPinUris) {
    if (!pins || !uris) {
      return;
    }

    if (resolvedPinUris) {
      resolvedPinUris.forEach((pin) => {
        if (uris.includes(pin)) {
          // remove the duplicate pin; we'll put it back at 2nd slot later.
          uris.splice(uris.indexOf(pin), 1);
        } else {
          // remove to make space for the pin (maintain total count).
          uris.pop();
        }
      });

      // add the pins on uris starting from the 2nd index
      uris.splice(2, 0, ...resolvedPinUris);
    }
  }

  const getInjectedItem = (index) => {
    if (injectedItem && injectedItem.node) {
      if (typeof injectedItem.node === 'function') {
        return injectedItem.node(index, lastVisibleIndex, pageSize);
      } else {
        if (injectedItem.index === undefined || injectedItem.index === null) {
          return index === lastVisibleIndex ? injectedItem.node : null;
        } else {
          return index === injectedItem.index ? injectedItem.node : null;
        }
      }
    }

    return null;
  };

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------

  React.useEffect(() => {
    if (channelIds) {
      doFetchOdyseeMembershipForChannelIds(channelIds);
    }
  }, [channelIds, doFetchOdyseeMembershipForChannelIds]);

  React.useEffect(() => {
    if (shouldPerformSearch) {
      const searchOptions = JSON.parse(optionsStringified);
      const searchSettings = fetchViewCount ? { fetch: { viewCount: true } } : null;
      doClaimSearch(searchOptions, searchSettings);
    }
  }, [doClaimSearch, shouldPerformSearch, optionsStringified, fetchViewCount]);

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------

  if (timedOut && SHOW_TIMEOUT_MSG) {
    return (
      <div className="empty empty--centered">
        <p>{__('Sorry, your request timed out. Try refreshing in a bit.')}</p>
        <p>
          <I18nMessage
            tokens={{
              contact_support: <Button button="link" label={__('contact support')} href="https://help.odysee.tv/" />,
            }}
          >
            If you continue to have issues, please %contact_support%.
          </I18nMessage>
        </p>
      </div>
    );
  }

  if (!timedOut && finalUris && finalUris.length === 0 && !loading && claimSearchLastPageReached) {
    return <div className="empty empty--centered">{__('No results')}</div>;
  }

  return (
    <ul
      ref={listRef}
      className={classNames('claim-grid', {
        'claim-shorts-grid': props.isShorts || sectionTitle === 'Shorts',
      })}
    >
      {!loading && finalUris && finalUris.length
        ? finalUris.map((uri, i) => {
            if (uri) {
              const inj = getInjectedItem(i);
              if (inj) {
                if (!uriBuffer.current.includes(i)) {
                  uriBuffer.current.push(i);
                }
              }
              return (
                <React.Fragment key={uri}>
                  {inj && inj}
                  {(i < finalUris.length - uriBuffer.current.length || i < pageSize - uriBuffer.current.length) && (
                    <ClaimPreviewTile
                      sectionTitle={sectionTitle}
                      showNoSourceClaims={hasNoSource || showNoSourceClaims}
                      uri={uri}
                      properties={renderProperties}
                    />
                  )}
                </React.Fragment>
              );
            } else {
              return (
                <ClaimPreviewTile
                  sectionTitle={sectionTitle}
                  showNoSourceClaims={hasNoSource || showNoSourceClaims}
                  key={i}
                  placeholder
                  pulse
                />
              );
            }
          })
        : new Array(pageSize)
            .fill(1)
            .map((x, i) => (
              <ClaimPreviewTile
                sectionTitle={sectionTitle}
                showNoSourceClaims={hasNoSource || showNoSourceClaims}
                key={i}
                placeholder
                pulse
              />
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
