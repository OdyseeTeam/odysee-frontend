import React, { useRef } from 'react';
import Button from 'component/button';
import ClaimPreviewTile from 'component/claimPreviewTile';
import I18nMessage from 'component/i18nMessage';
import useGetLastVisibleSlot from 'effects/use-get-last-visible-slot';
import useResolvePins from 'effects/use-resolve-pins';
import classNames from 'classnames';
import type { HomepageTitles } from 'util/buildHomepage';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectClaimSearchByQuery,
  selectFetchingClaimSearchByQuery,
  selectClaimSearchByQueryLastPageReached,
} from 'redux/selectors/claims';
import {
  doClaimSearch as doClaimSearchAction,
  doResolveClaimIds as doResolveClaimIdsAction,
  doResolveUris as doResolveUrisAction,
} from 'redux/actions/claims';
import { doFetchOdyseeMembershipForChannelIds as doFetchOdyseeMembershipForChannelIdsAction } from 'redux/actions/memberships';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting, selectShowMatureContent } from 'redux/selectors/settings';
import { selectMutedAndBlockedChannelIds } from 'redux/selectors/blocked';
import { ENABLE_NO_SOURCE_CLAIMS, SIMPLE_SITE } from 'config';
import { createNormalizedClaimSearchKey } from 'util/claim';
import { CsOptHelper } from 'util/claim-search';
import * as CS from 'constants/claim_search';
const SHOW_TIMEOUT_MSG = false;

function urisEqual(prev: Array<string> | null | undefined, next: Array<string> | null | undefined) {
  if (!prev || !next) {
    // ClaimList: "null" and "undefined" have special meaning,
    // so we can't just compare array length here.
    //   - null = "timed out"
    //   - undefined = "no result".
    return prev === next;
  }

  return prev.length === next.length && prev.every((value, index) => value === next[index]);
}

// ****************************************************************************
// ClaimTilesDiscover
// ****************************************************************************
type Props = {
  prefixUris?: Array<string>;
  pins?: {
    urls?: Array<string>;
    claimIds?: Array<string>;
    onlyPinForOrder?: string;
  };
  uris: Array<string>;
  injectedItem?: ListInjectedItem;
  showNoSourceClaims?: boolean;
  renderProperties?: (arg0: Claim) => React.ReactNode | null | undefined;
  fetchViewCount?: boolean;
  // claim search options are below
  tags: Array<string>;
  notTags?: Array<string>;
  claimIds?: Array<string>;
  channelIds?: Array<string>;
  pageSize: number;
  orderBy?: Array<string>;
  releaseTime?: string;
  languages?: Array<string>;
  claimType?: string | Array<string>;
  streamTypes?: Array<string>;
  timestamp?: string;
  feeAmount?: string;
  limitClaimsPerChannel?: number;
  hasSource?: boolean;
  hasNoSource?: boolean;
  forceShowReposts?: boolean;
  hideMembersOnly?: boolean;
  loading: boolean;
  duration?: string;
  contentAspectRatio?: string;
  excludeShorts?: boolean;
  sectionTitle?: HomepageTitles;
  isShorts?: boolean;
};

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

function resolveHideMembersOnly(global: any, override: any) {
  return override === undefined || override === null ? global : override;
}

function resolveSearchOptions(resolveProps: any) {
  const {
    showNsfw,
    hideReposts,
    forceShowReposts,
    hideMembersOnly,
    mutedAndBlockedChannelIds,
    hideShorts,
    search,
    pageSize,
    claimType,
    tags,
    notTags,
    languages,
    channelIds,
    orderBy,
    streamTypes,
    hasNoSource,
    hasSource,
    releaseTime,
    feeAmount,
    limitClaimsPerChannel,
    timestamp,
    claimIds,
    duration,
    contentAspectRatio,
    excludeShorts,
  } = resolveProps;
  const urlParams = new URLSearchParams(search);
  const feeAmountInUrl = urlParams.get('fee_amount');
  const feeAmountParam = feeAmountInUrl || feeAmount;
  const notTagInput: NotTagInput = {
    notTags,
    showNsfw,
    hideMembersOnly,
  };
  let streamTypesParam;

  if (streamTypes) {
    streamTypesParam = streamTypes;
  } else if (SIMPLE_SITE && !hasNoSource && streamTypes !== null) {
    streamTypesParam = undefined;
  }

  const options: ClaimSearchOptions = {
    page: 1,
    page_size: pageSize,
    claim_type: claimType || ['stream', 'repost', 'channel'],
    no_totals: true,
    any_tags: tags || [],
    not_tags: CsOptHelper.not_tags(notTagInput),
    any_languages: languages,
    channel_ids: channelIds || [],
    not_channel_ids: mutedAndBlockedChannelIds,
    order_by: resolveOrderByOption(orderBy),
    stream_types: streamTypesParam,
    remove_duplicates: true,
    duration: CsOptHelper.duration(null, claimType, CS.DURATION.ALL),
  };

  function resolveOrderByOption(ob: string | Array<string>) {
    let order_by;
    switch (ob) {
      case CS.ORDER_BY_TRENDING:
        order_by = CS.ORDER_BY_TRENDING_VALUE;
        break;
      case CS.ORDER_BY_NEW:
        order_by = CS.ORDER_BY_NEW_VALUE;
        break;
      case CS.ORDER_BY_NEW_ASC:
        order_by = CS.ORDER_BY_NEW_ASC_VALUE;
        break;
      case CS.ORDER_BY_NAME_ASC:
        order_by = CS.ORDER_BY_NAME_ASC_VALUE;
        break;
      default:
        order_by = CS.ORDER_BY_TRENDING_VALUE;
    }
    return order_by;
  }

  if (ENABLE_NO_SOURCE_CLAIMS && hasNoSource) {
    options.has_no_source = true;
  } else if (hasSource || (!ENABLE_NO_SOURCE_CLAIMS && (!claimType || claimType === 'stream'))) {
    options.has_source = true;
  }

  if (releaseTime) {
    options.release_time = releaseTime;
  }

  if (feeAmountParam) {
    options.fee_amount = feeAmountParam;
  }

  if (limitClaimsPerChannel) {
    options.limit_claims_per_channel = limitClaimsPerChannel;
  }

  if (hideReposts && !forceShowReposts) {
    if (Array.isArray(options.claim_type)) {
      options.claim_type = options.claim_type.filter((ct) => ct !== 'repost');
    } else {
      options.claim_type = ['stream', 'channel'];
    }
  }

  if (claimType) {
    options.claim_type = claimType;
  }

  if (timestamp) {
    options.timestamp = timestamp;
  }

  if (claimIds) {
    options.claim_ids = claimIds;
  }

  if (hideShorts || excludeShorts) {
    options.exclude_shorts = true;
  }

  if (!hideShorts) {
    if (duration) {
      options.duration = duration;
    }
    if (contentAspectRatio) {
      options.content_aspect_ratio = contentAspectRatio;
    }
  }

  return options;
}

function ClaimTilesDiscover(props: Props) {
  const {
    fetchViewCount,
    hasNoSource,
    renderProperties,
    pins,
    prefixUris,
    injectedItem,
    showNoSourceClaims,
    pageSize = 8,
    channelIds,
    loading,
    sectionTitle,
  } = props;
  const dispatch = useAppDispatch();
  // -- redux selectors --
  const showNsfw = useAppSelector(selectShowMatureContent);
  const hmocSetting = useAppSelector((state) => selectClientSetting(state, SETTINGS.HIDE_MEMBERS_ONLY_CONTENT));
  const hideMembersOnly = resolveHideMembersOnly(hmocSetting, props.hideMembersOnly);
  const hideReposts = useAppSelector((state) => selectClientSetting(state, SETTINGS.HIDE_REPOSTS));
  const forceShowReposts = props.forceShowReposts;
  const mutedAndBlockedChannelIds = useAppSelector(selectMutedAndBlockedChannelIds);
  const hideShorts = useAppSelector((state) => selectClientSetting(state, SETTINGS.HIDE_SHORTS));
  const routerSearch = useAppSelector((state) => (state as any).router?.location?.search || '');
  const options = resolveSearchOptions({
    showNsfw,
    hideMembersOnly,
    hideReposts,
    forceShowReposts,
    mutedAndBlockedChannelIds,
    hideShorts,
    pageSize: 8,
    search: routerSearch,
    ...props,
  });
  const searchKey = createNormalizedClaimSearchKey(options);
  const claimSearchResults = useAppSelector((state) => selectClaimSearchByQuery(state)[searchKey]);
  const claimSearchLastPageReached = useAppSelector(
    (state) => selectClaimSearchByQueryLastPageReached(state)[searchKey]
  );
  const fetchingClaimSearch = useAppSelector((state) => selectFetchingClaimSearchByQuery(state)[searchKey]);
  const optionsStringified = JSON.stringify(options);
  // -- dispatch --
  const doClaimSearch = React.useCallback(
    (o: ClaimSearchOptions, s?: DoClaimSearchSettings | null) => dispatch(doClaimSearchAction(o, s)),
    [dispatch]
  );
  const doFetchOdyseeMembershipForChannelIds = React.useCallback(
    (ids: ClaimIds) => dispatch(doFetchOdyseeMembershipForChannelIdsAction(ids)),
    [dispatch]
  );
  const doResolveClaimIds = React.useCallback(
    (ids: Array<string>) => dispatch(doResolveClaimIdsAction(ids)),
    [dispatch]
  );
  const doResolveUris = React.useCallback(
    (uris: Array<string>, returnCached: boolean) => dispatch(doResolveUrisAction(uris, returnCached)),
    [dispatch]
  );
  const listRef = React.useRef();
  const findLastVisibleSlot = injectedItem && injectedItem.node && injectedItem.index === undefined;
  const lastVisibleIndex = useGetLastVisibleSlot(listRef, !findLastVisibleSlot);
  const prevUris = React.useRef();
  const claimSearchUris = claimSearchResults || [];
  const isUnfetchedClaimSearch = claimSearchResults === undefined;
  const resolvedPinUris = useResolvePins({
    pins,
    doResolveClaimIds,
    doResolveUris,
  });
  const uriBuffer = useRef([]);
  const timedOut = claimSearchResults === null;
  const shouldPerformSearch =
    !fetchingClaimSearch && !timedOut && claimSearchUris.length === 0 && !claimSearchLastPageReached;
  const uris = (prefixUris || []).concat(claimSearchUris);
  if (prefixUris && prefixUris.length) uris.splice(prefixUris.length * -1, prefixUris.length);

  // Treat the embed homepage the same as the main homepage for pin injection.
  if (window.location.pathname === '/' || window.location.pathname === '/$/embed/home') {
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
      const searchSettings = fetchViewCount
        ? {
            fetch: {
              viewCount: true,
            },
          }
        : null;
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
                  {inj}
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
        : Array.from({ length: pageSize }, (_, i) => (
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

export default React.memo<Props>(ClaimTilesDiscover, areEqual); // ****************************************************************************
// ****************************************************************************

function trace(key, value) {
  // @if process.env.DEBUG_TILE_RENDER
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
