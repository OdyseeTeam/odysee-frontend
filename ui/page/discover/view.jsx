// @flow
import { SHOW_ADS, DOMAIN, ENABLE_NO_SOURCE_CLAIMS } from 'config';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as CS from 'constants/claim_search';
import React, { useState, useRef } from 'react';
import Page from 'component/page';
import ClaimListDiscover from 'component/claimListDiscover';
import Button from 'component/button';
import useHover from 'effects/use-hover';
import { useIsMobile, useIsLargeScreen } from 'effects/use-screensize';
import usePersistedState from 'effects/use-persisted-state';
import analytics from 'analytics';
import HiddenNsfw from 'component/common/hidden-nsfw';
import Icon from 'component/common/icon';
import Ads, { injectAd } from 'web/component/ads';
import LbcSymbol from 'component/common/lbc-symbol';
import I18nMessage from 'component/i18nMessage';
import moment from 'moment';
import { getLivestreamUris } from 'util/livestream';

const DEFAULT_LIVESTREAM_TILE_LIMIT = 8;

const SECTION = {
  HIDDEN: 0,
  LESS: 1,
  MORE: 2,
};

type Props = {
  dynamicRouteProps: RowDataItem,
  // --- redux ---
  location: { search: string },
  followedTags: Array<Tag>,
  repostedUri: string,
  repostedClaim: ?GenericClaim,
  doToggleTagFollowDesktop: (string) => void,
  doResolveUri: (string) => void,
  isAuthenticated: boolean,
  tileLayout: boolean,
  activeLivestreams: ?LivestreamInfo,
  doFetchActiveLivestreams: (orderBy?: Array<string>) => void,
};

function DiscoverPage(props: Props) {
  const {
    location: { search },
    followedTags,
    repostedClaim,
    repostedUri,
    doToggleTagFollowDesktop,
    doResolveUri,
    isAuthenticated,
    tileLayout,
    activeLivestreams,
    doFetchActiveLivestreams,
    dynamicRouteProps,
  } = props;

  const [liveSectionStore, setLiveSectionStore] = usePersistedState('discover:liveSection', SECTION.LESS);

  const buttonRef = useRef();
  const isHovering = useHover(buttonRef);
  const isMobile = useIsMobile();
  const isLargeScreen = useIsLargeScreen();

  const urlParams = new URLSearchParams(search);
  const claimType = urlParams.get('claim_type');
  const tagsQuery = urlParams.get('t') || null;
  const tags = tagsQuery ? tagsQuery.split(',') : null;
  const repostedClaimIsResolved = repostedUri && repostedClaim;

  const discoverIcon = ICONS.WILD_WEST;
  const discoverLabel = __('Wild West');
  // Eventually allow more than one tag on this page
  // Restricting to one to make follow/unfollow simpler
  const tag = (tags && tags[0]) || null;
  const channelIds =
    (dynamicRouteProps && dynamicRouteProps.options && dynamicRouteProps.options.channelIds) || undefined;

  const isFollowing = followedTags.map(({ name }) => name).includes(tag);
  let label = isFollowing ? __('Following --[button label indicating a channel has been followed]--') : __('Follow');
  if (isHovering && isFollowing) {
    label = __('Unfollow');
  }

  const initialLiveTileLimit = getPageSize(DEFAULT_LIVESTREAM_TILE_LIMIT);

  const includeLivestreams = !tagsQuery;
  const [liveSection, setLiveSection] = useState(includeLivestreams ? liveSectionStore : SECTION.HIDDEN);
  const livestreamUris = includeLivestreams && getLivestreamUris(activeLivestreams, channelIds);
  const liveTilesOverLimit = livestreamUris && livestreamUris.length > initialLiveTileLimit;
  const useDualList = liveSection === SECTION.LESS && liveTilesOverLimit;

  function getMeta() {
    if (liveSection === SECTION.MORE && liveTilesOverLimit) {
      return (
        <Button
          label={__('Show less livestreams')}
          button="link"
          iconRight={ICONS.UP}
          className="claim-grid__title--secondary"
          onClick={() => setLiveSection(SECTION.LESS)}
        />
      );
    }

    return !dynamicRouteProps ? (
      <a
        className="help"
        href="https://odysee.com/@OdyseeHelp:b/trending:50"
        title={__('Learn more about Credits on %DOMAIN%', { DOMAIN })}
      >
        <I18nMessage tokens={{ lbc: <LbcSymbol /> }}>Results boosted by %lbc%</I18nMessage>
      </a>
    ) : (
      tag && !isMobile && (
        <Button
          ref={buttonRef}
          button="alt"
          icon={ICONS.SUBSCRIBE}
          iconColor="red"
          onClick={handleFollowClick}
          requiresAuth
          label={label}
        />
      )
    );
  }

  function getPageSize(originalSize) {
    return isLargeScreen ? originalSize * (3 / 2) : originalSize;
  }

  function getPins(routeProps) {
    if (routeProps && routeProps.pinnedUrls) {
      return {
        urls: routeProps.pinnedUrls,
        onlyPinForOrder: CS.ORDER_BY_TRENDING,
      };
    }
  }

  React.useEffect(() => {
    if (repostedUri && !repostedClaimIsResolved) {
      doResolveUri(repostedUri);
    }
  }, [repostedUri, repostedClaimIsResolved, doResolveUri]);

  function handleFollowClick() {
    if (tag) {
      doToggleTagFollowDesktop(tag);

      const nowFollowing = !isFollowing;
      analytics.tagFollowEvent(tag, nowFollowing, 'tag-page');
    }
  }

  let headerLabel;
  if (repostedClaim) {
    headerLabel = __('Reposts of %uri%', { uri: repostedUri });
  } else if (tag) {
    headerLabel = (
      <span>
        <Icon icon={ICONS.TAG} size={10} />
        {(tag === CS.TAGS_ALL && __('All Content')) || (tag === CS.TAGS_FOLLOWED && __('Followed Tags')) || tag}

        <Button
          className="claim-search__tags-link"
          button="link"
          label={__('Manage Tags')}
          navigate={`/$/${PAGES.TAGS_FOLLOWING_MANAGE}`}
        />
      </span>
    );
  } else {
    headerLabel = (
      <span>
        <Icon icon={(dynamicRouteProps && dynamicRouteProps.icon) || discoverIcon} size={10} />
        {(dynamicRouteProps && __(`${dynamicRouteProps.title}`)) || discoverLabel}
      </span>
    );
  }

  React.useEffect(() => {
    if (isAuthenticated || !SHOW_ADS || window.location.pathname === `/$/${PAGES.WILD_WEST}`) {
      return;
    }

    // inject ad into last visible card
    injectAd();
  }, [isAuthenticated]);

  // Sync liveSection --> liveSectionStore
  React.useEffect(() => {
    if (liveSection !== SECTION.HIDDEN && liveSection !== liveSectionStore) {
      setLiveSectionStore(liveSection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveSection]);

  // Fetch active livestreams on mount
  React.useEffect(() => {
    if (liveSection === SECTION.LESS) {
      doFetchActiveLivestreams(CS.ORDER_BY_TRENDING_VALUE);
    } else {
      doFetchActiveLivestreams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps, (on mount only)
  }, []);

  return (
    <Page noFooter fullWidthPage={tileLayout}>
      {useDualList && (
        <>
          <ClaimListDiscover
            uris={livestreamUris && livestreamUris.slice(0, initialLiveTileLimit)}
            headerLabel={headerLabel}
            header={repostedUri ? <span /> : undefined}
            tileLayout={repostedUri ? false : tileLayout}
            hideFilters
            infiniteScroll={false}
            loading={false}
            showNoSourceClaims={ENABLE_NO_SOURCE_CLAIMS}
            meta={getMeta()}
          />
          <div className="livestream-list--view-more">
            <Button
              label={__('Show more livestreams')}
              button="link"
              iconRight={ICONS.DOWN}
              className="claim-grid__title--secondary"
              onClick={() => {
                doFetchActiveLivestreams();
                setLiveSection(SECTION.MORE);
              }}
            />
          </div>
        </>
      )}

      <Ads type="homepage" />

      <ClaimListDiscover
        prefixUris={useDualList ? undefined : livestreamUris}
        pins={useDualList ? undefined : getPins(dynamicRouteProps)}
        hideFilters={!(dynamicRouteProps || tags)}
        header={useDualList ? <span /> : repostedUri ? <span /> : undefined}
        tileLayout={repostedUri ? false : tileLayout}
        defaultOrderBy={dynamicRouteProps ? undefined : CS.ORDER_BY_TRENDING}
        claimType={claimType ? [claimType] : undefined}
        headerLabel={!useDualList && headerLabel}
        tags={tags}
        hiddenNsfwMessage={<HiddenNsfw type="page" />}
        repostedClaimId={repostedClaim ? repostedClaim.claim_id : null}
        injectedItem={false}
        // Assume wild west page if no dynamicRouteProps
        // Not a very good solution, but just doing it for now
        // until we are sure this page will stay around
        // TODO: find a better way to determine discover / wild west vs other modes release times
        // for now including && !tags so that
        releaseTime={
          !dynamicRouteProps && !tags && `>${Math.floor(moment().subtract(1, 'day').startOf('week').unix())}`
        }
        feeAmount={!dynamicRouteProps && CS.FEE_AMOUNT_ANY}
        channelIds={channelIds}
        limitClaimsPerChannel={
          (dynamicRouteProps && dynamicRouteProps.options && dynamicRouteProps.options.limitClaimsPerChannel) || 3
        }
        meta={!useDualList && getMeta()}
        hasSource
        showNoSourceClaims={ENABLE_NO_SOURCE_CLAIMS}
      />
    </Page>
  );
}

export default DiscoverPage;
