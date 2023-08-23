// @flow
import React from 'react';
import classnames from 'classnames';
import { DOMAIN, SIMPLE_SITE } from 'config';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as CS from 'constants/claim_search';
import Page from 'component/page';
import ClaimListDiscover from 'component/claimListDiscover';
import Button from 'component/button';
import { ClaimSearchFilterContext } from 'contexts/claimSearchFilterContext';
import HiddenNsfw from 'component/common/hidden-nsfw';
import Icon from 'component/common/icon';
import LbcSymbol from 'component/common/lbc-symbol';
import I18nMessage from 'component/i18nMessage';
import moment from 'moment';
import LivestreamSection from './internal/livestreamSection';
import Ad from 'web/component/ad';
import { tagSearchCsOptionsHook } from 'util/search';

const CATEGORY_CONTENT_TYPES_FILTER = CS.CONTENT_TYPES.filter((x) => x !== CS.CLAIM_REPOST);

type Props = {
  dynamicRouteProps: RowDataItem,
  location: { search: string },
  followedTags: Array<Tag>,
  repostedUri: string,
  repostedClaim: ?GenericClaim,
  doToggleTagFollowDesktop: (string) => void,
  doResolveUri: (string) => void,
  tileLayout: boolean,
  hasPremiumPlus: boolean,
};

function DiscoverPage(props: Props) {
  const {
    location: { search },
    repostedClaim,
    repostedUri,
    doResolveUri,
    tileLayout,
    dynamicRouteProps,
    hasPremiumPlus,
  } = props;

  const isWildWest = dynamicRouteProps && dynamicRouteProps.id === 'WILD_WEST';
  const isCategory = Boolean(dynamicRouteProps);
  const hideFilter = dynamicRouteProps?.hideSort || undefined;

  const urlParams = new URLSearchParams(search);
  const langParam = urlParams.get(CS.LANGUAGE_KEY) || null;
  const claimType = urlParams.get('claim_type');
  const tagsQuery = urlParams.get('t') || null;
  const orderParam = urlParams.get(CS.ORDER_BY_KEY);
  const tags = tagsQuery ? tagsQuery.split(',') : null;
  const repostedClaimIsResolved = repostedUri && repostedClaim;
  const hideRepostRibbon = isCategory && !isWildWest;
  const hideMembersOnlyContent = isCategory && !isWildWest;

  // Eventually allow more than one tag on this page
  // Restricting to one to make follow/unfollow simpler
  const tag = (tags && tags[0]) || null;
  const routedChannelIds = dynamicRouteProps?.options?.channelIds;
  const channelIds = routedChannelIds && routedChannelIds.length > 0 ? routedChannelIds : undefined;
  const excludedChannelIds = dynamicRouteProps?.options?.excludedChannelIds || undefined;

  const claimSearchFilters = {
    contentTypes: isCategory && !isWildWest ? CATEGORY_CONTENT_TYPES_FILTER : CS.CONTENT_TYPES,
    liftUpTagSearch: true,
  };

  // **************************************************************************
  // **************************************************************************

  function getMeta() {
    if (!dynamicRouteProps) {
      return (
        <a
          className="help"
          target="_blank"
          rel="noreferrer"
          href="https://help.odysee.tv/category-blockchain/category-staking/increase/"
          title={__('Learn more about Credits on %DOMAIN%', { DOMAIN })}
        >
          <I18nMessage tokens={{ lbc: <LbcSymbol /> }}>Results boosted by %lbc%</I18nMessage>
        </a>
      );
    }

    return null;
  }

  function getSubSection() {
    const includeLivestreams = !tagsQuery;
    if (includeLivestreams && (isWildWest || (channelIds && channelIds.length > 0))) {
      return (
        <LivestreamSection
          tileLayout={repostedUri ? false : tileLayout}
          channelIds={channelIds}
          excludedChannelIds={isWildWest ? excludedChannelIds : null}
          searchLanguages={dynamicRouteProps?.options?.searchLanguages}
          langParam={langParam}
          hideMembersOnlyContent={hideMembersOnlyContent}
        />
      );
    }
    return null;
  }

  function getPins(routeProps) {
    if (routeProps && (routeProps.pinnedUrls || routeProps.pinnedClaimIds)) {
      return {
        urls: routeProps.pinnedUrls,
        claimIds: routeProps.pinnedClaimIds,
        onlyPinForOrder: CS.ORDER_BY_TRENDING,
      };
    }
  }

  function getHeaderLabel() {
    let headerLabel;
    if (repostedClaim) {
      headerLabel = __('Reposts of %uri%', { uri: repostedUri });
    } else if (tag && !isCategory) {
      headerLabel = (
        <h1 className="page__title">
          <Icon icon={ICONS.TAG} size={10} />
          <span>
            #{(tag === CS.TAGS_ALL && __('All Content')) || (tag === CS.TAGS_FOLLOWED && __('Followed Tags')) || tag}
          </span>

          <span>
            <Button
              className="claim-search__tags-link"
              button="link"
              label={__('Manage Tags')}
              navigate={`/$/${PAGES.TAGS_FOLLOWING_MANAGE}`}
            />
          </span>
        </h1>
      );
    } else {
      headerLabel = (
        <>
          <h1 className="page__title">
            <Icon icon={(dynamicRouteProps && dynamicRouteProps.icon) || ICONS.DISCOVER} size={10} />
            <label>{(dynamicRouteProps && __(`${dynamicRouteProps.title}`)) || __('All Content')}</label>
          </h1>
        </>
      );
    }
    return headerLabel;
  }

  function getAds() {
    return (
      !isWildWest &&
      !hasPremiumPlus && {
        node: (index, lastVisibleIndex, pageSize) => {
          if (pageSize && index < pageSize) {
            return index === lastVisibleIndex ? <Ad type="tileA" tileLayout={tileLayout} /> : null;
          } else {
            return index % (pageSize * 2) === 0 ? <Ad type="tileA" tileLayout={tileLayout} /> : null;
          }
        },
      }
    );
  }

  function getDefaultOrderBy() {
    // We were passing undefined to 'ClaimListDiscover::defaultOrderBy', so we
    // don't know what the fallback actually is for our remaining logic (i.e.
    // getReleaseTime()) to work correctly.
    // Make it explicit here rather than depending on the component's default.
    return isWildWest || tags ? CS.ORDER_BY_TRENDING : dynamicRouteProps?.options?.orderBy || CS.ORDER_BY_TOP;
  }

  function getReleaseTime() {
    const defaultOrder = getDefaultOrderBy();
    const order = orderParam || defaultOrder;
    const isOrderTop = order === CS.ORDER_BY_TOP;
    const categoryReleaseTime = dynamicRouteProps?.options?.releaseTime;

    if (isWildWest) {
      // The homepage definition currently does not support 'start-of-week', so
      // continue to hardcode here for now.
      return `>${Math.floor(moment().subtract(0, 'hour').startOf('week').unix())}`;
    }

    if (categoryReleaseTime && !isOrderTop) {
      return categoryReleaseTime;
    }

    return undefined;
  }

  // **************************************************************************
  // **************************************************************************

  React.useEffect(() => {
    if (repostedUri && !repostedClaimIsResolved) {
      doResolveUri(repostedUri);
    }
  }, [repostedUri, repostedClaimIsResolved, doResolveUri]);

  // **************************************************************************
  // **************************************************************************

  return (
    <Page noFooter fullWidthPage={tileLayout} className={classnames({ 'hide-ribbon': hideRepostRibbon })}>
      <ClaimSearchFilterContext.Provider value={claimSearchFilters}>
        <ClaimListDiscover
          pins={getPins(dynamicRouteProps)}
          hideFilters={isWildWest ? true : hideFilter}
          header={repostedUri ? <span /> : undefined}
          subSection={getSubSection()}
          tileLayout={repostedUri ? false : tileLayout}
          defaultOrderBy={getDefaultOrderBy()}
          claimType={claimType ? [claimType] : undefined}
          defaultStreamType={undefined}
          // defaultStreamType={isCategory && !isWildWest ? [CS.FILE_VIDEO, CS.FILE_AUDIO, CS.FILE_DOCUMENT] : undefined} remove due to claim search bug with reposts
          headerLabel={getHeaderLabel()}
          tags={tags}
          hiddenNsfwMessage={<HiddenNsfw type="page" />}
          repostedClaimId={repostedClaim ? repostedClaim.claim_id : null}
          injectedItem={getAds()}
          // TODO: find a better way to determine discover / wild west vs other modes release times
          // for now including && !tags so that
          releaseTime={getReleaseTime()}
          feeAmount={undefined}
          channelIds={channelIds}
          excludedChannelIds={excludedChannelIds}
          limitClaimsPerChannel={
            SIMPLE_SITE
              ? (dynamicRouteProps && dynamicRouteProps.options && dynamicRouteProps.options.limitClaimsPerChannel) || 3
              : 3
          }
          meta={getMeta()}
          hasSource
          hideRepostsOverride={dynamicRouteProps ? false : undefined}
          hideMembersOnlyContent={hideMembersOnlyContent}
          searchLanguages={dynamicRouteProps?.options?.searchLanguages}
          duration={dynamicRouteProps?.options?.duration}
          csOptionsHook={tagSearchCsOptionsHook}
        />
      </ClaimSearchFilterContext.Provider>
    </Page>
  );
}

export default DiscoverPage;
