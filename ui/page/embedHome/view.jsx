// @flow
import React from 'react';
import classnames from 'classnames';
import { lazyImport } from 'util/lazyImport';

import './style.scss';
import { ENABLE_NO_SOURCE_CLAIMS } from 'config';
import * as ICONS from 'constants/icons';
import ClaimTilesDiscover from 'component/claimTilesDiscover';
import ClaimPreviewTile from 'component/claimPreviewTile';
import Icon from 'component/common/icon';
import WaitUntilOnPage from 'component/common/wait-until-on-page';
import Spinner from 'component/spinner';
import Button from 'component/button';
import { useIsSmallScreen, useIsMediumScreen, useIsLargeScreen } from 'effects/use-screensize';
import { GetLinksData } from 'util/buildHomepage';
import { getSortedRowData } from '../home/helper';
import { filterActiveLivestreamUris } from 'util/livestream';
import UpcomingClaims from 'component/upcomingClaims';

const CustomBanner = lazyImport(() => import('component/customBanner' /* webpackChunkName: "customBanner" */));

type HomepageOrder = { active: ?Array<string>, hidden: ?Array<string> };

type Props = {
  authenticated: boolean,
  followedTags: Array<Tag>,
  subscribedChannelIds: Array<ClaimId>,
  showNsfw: boolean,
  homepageData: any,
  homepageCustomBanners: ?Array<any>,
  homepageFetched: boolean,
  doFetchAllActiveLivestreamsForQuery: () => void,
  fetchingActiveLivestreams: boolean,
  homepageOrder: HomepageOrder,
  userHasOdyseeMembership: ?boolean,
  activeLivestreamByCreatorId: LivestreamByCreatorId,
  livestreamViewersById: LivestreamViewersById,
};

/**
 * EmbedHomePage - A clean, embeddable version of the Odysee homepage
 *
 * This component provides an iframe-friendly homepage that shows discovery content
 * without navigation, headers, or footers. When users are logged in with an Odysee
 * cookie, they see personalized content. Otherwise, shows public discovery content.
 * Perfect for embedding Odysee content on external websites.
 */
function EmbedHomePage(props: Props) {
  const {
    authenticated,
    followedTags,
    subscribedChannelIds,
    showNsfw,
    homepageData,
    homepageCustomBanners,
    homepageFetched,
    doFetchAllActiveLivestreamsForQuery,
    fetchingActiveLivestreams,
    homepageOrder,
    userHasOdyseeMembership,
    activeLivestreamByCreatorId: al,
    livestreamViewersById: lv,
  } = props;

  const showPersonalizedChannels = authenticated && subscribedChannelIds.length > 0;
  const showPersonalizedTags = authenticated && followedTags && followedTags.length > 0;
  const showIndividualTags = showPersonalizedTags && followedTags.length < 5;
  const isSmallScreen = useIsSmallScreen();
  const isMediumScreen = useIsMediumScreen();
  const isLargeScreen = useIsLargeScreen();

  const sortedRowData: Array<RowDataItem> = React.useMemo(() => {
    const rowData: Array<RowDataItem> = GetLinksData(
      homepageData,
      isSmallScreen,
      isMediumScreen,
      isLargeScreen,
      true,
      authenticated, // Use actual auth status - show personalized content if logged in
      showPersonalizedChannels,
      showPersonalizedTags,
      subscribedChannelIds,
      followedTags,
      showIndividualTags,
      showNsfw
    );

    // Get sorted data - use user's homepage order if authenticated
    const sorted = getSortedRowData(authenticated, userHasOdyseeMembership, homepageOrder, homepageData, rowData);

    // Limit to reasonable number of sections for embed (more if authenticated)
    const maxSections = authenticated ? 6 : 4;
    return sorted.slice(0, maxSections);
  }, [
    authenticated,
    followedTags,
    homepageData,
    homepageOrder,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    showIndividualTags,
    showNsfw,
    showPersonalizedChannels,
    showPersonalizedTags,
    subscribedChannelIds,
    userHasOdyseeMembership,
  ]);

  // Cache for livestream data per section
  type Cache = {
    topGrid: number,
    hasBanner: boolean,
    [homepageId: string]: {
      livestreamUris: ?Array<string>,
    },
  };

  const cache: Cache = React.useMemo(() => {
    const cache = { topGrid: -1, hasBanner: false }; // No banner in embed
    if (homepageFetched) {
      sortedRowData.forEach((row: RowDataItem, index: number) => {
        // Find index of first row with a title
        if (cache.topGrid === -1 && Boolean(row.title) && row.id !== 'UPCOMING') {
          cache.topGrid = index;
        }
        // Find livestreams related to the category
        const rowChannelIds = row.options?.channelIds;
        const rowExcludedChannelIds = row.options?.excludedChannelIds;
        cache[row.id] = {
          livestreamUris:
            row.id === 'FOLLOWING'
              ? filterActiveLivestreamUris(subscribedChannelIds, rowExcludedChannelIds, al, lv)
              : rowChannelIds
              ? filterActiveLivestreamUris(rowChannelIds, rowExcludedChannelIds, al, lv)
              : null,
        };
      });
    }
    return cache;
  }, [homepageFetched, sortedRowData, subscribedChannelIds, al, lv]);

  type SectionHeaderProps = {
    title: string,
    navigate?: string,
    icon?: string,
  };

  const SectionHeader = ({ title, navigate = '/', icon = '' }: SectionHeaderProps) => {
    return (
      <h1 className="claim-grid__header">
        <Button navigate={navigate} button="link">
          <Icon className="claim-grid__header-icon" sectionIcon icon={icon} size={20} />
          <span className="claim-grid__title">{title}</span>
        </Button>
      </h1>
    );
  };

  function getRowElements(id, title, route, link, icon, options, index, pinUrls, pinnedClaimIds) {
    // Skip banners, portals, and FYP in embed
    if (id === 'BANNER' || id === 'PORTALS' || id === 'FYP') {
      return null;
    }

    // Show UPCOMING section for authenticated users with subscriptions
    if (id === 'UPCOMING') {
      if (!authenticated || !showPersonalizedChannels) {
        return null;
      }
      return (
        <React.Fragment key={id}>
          <UpcomingClaims
            name="embed_homepage_following"
            channelIds={subscribedChannelIds}
            tileLayout
            liveUris={cache[id]?.livestreamUris}
            loading={fetchingActiveLivestreams}
            showHideSetting={false}
          />
        </React.Fragment>
      );
    }

    const tilePlaceholder = (
      <ul className="claim-grid">
        {new Array(options.pageSize || 8).fill(1).map((x, i) => (
          <ClaimPreviewTile showNoSourceClaims={ENABLE_NO_SOURCE_CLAIMS} key={i} placeholder />
        ))}
      </ul>
    );

    const claimTiles = (
      <ClaimTilesDiscover
        {...options}
        showNoSourceClaims={ENABLE_NO_SOURCE_CLAIMS}
        hasSource
        pins={{ urls: pinUrls, claimIds: pinnedClaimIds }}
        prefixUris={cache[id]?.livestreamUris}
        loading={id === 'FOLLOWING' ? fetchingActiveLivestreams : false}
        fetchViewCount
        hideFilters // Hide filters in embed view
        forceShowReposts={id !== 'FOLLOWING'}
        hideMembersOnly={id !== 'FOLLOWING'}
      />
    );

    const HeaderArea = () => {
      function resolveTitleOverride(title: string) {
        if (title === 'Recent From Following') {
          return authenticated ? 'Following' : 'Discover';
        }
        return title;
      }

      return (
        <>
          {title && typeof title === 'string' && (
            <div className="homePage-wrapper__section-title">
              <SectionHeader title={__(resolveTitleOverride(title))} navigate={route || link} icon={icon} />
            </div>
          )}
        </>
      );
    };

    return (
      <div key={id} className="claim-grid__wrapper">
        <HeaderArea />
        {index === 0 ? (
          claimTiles
        ) : (
          <WaitUntilOnPage name={title} placeholder={tilePlaceholder} yOffset={800}>
            {claimTiles}
          </WaitUntilOnPage>
        )}
        {(route || link) && (
          <Button
            className="claim-grid__title--secondary"
            button="link"
            navigate={route || link}
            iconRight={ICONS.ARROW_RIGHT}
            label={__('Explore More on Odysee')}
          />
        )}
      </div>
    );
  }

  React.useEffect(() => {
    doFetchAllActiveLivestreamsForQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  if (!homepageFetched) {
    return (
      <div className="main--empty">
        <Spinner text={__('Loading Odysee...')} />
      </div>
    );
  }

  return (
    <div className={classnames('homePage-wrapper', 'homePage-wrapper--embed')}>
      {/* Embed branding header */}
      <div className="embed-home__header">
        <div className="embed-home__branding">
          <Icon icon={ICONS.ODYSEE} size={24} />
          <h1 className="embed-home__title">{authenticated ? __('Your Odysee Feed') : __('Discover on Odysee')}</h1>
        </div>
        {authenticated && showPersonalizedChannels && (
          <div className="embed-home__auth-badge">
            <Icon icon={ICONS.VALIDATED} size={16} />
            <span>{__('Personalized')}</span>
          </div>
        )}
      </div>

      {/* Discovery content sections */}
      <div className="embed-home__content">
        {sortedRowData.length === 0 ? (
          <div className="main--empty">
            <Spinner text={__('Loading content...')} />
          </div>
        ) : (
          sortedRowData.map(
            ({ id, title, route, link, icon, pinnedUrls: pinUrls, pinnedClaimIds, options = {} }, index) => {
              // Check if there is a banner that should appear in this position (only show first banner if any)
              const bannerForPosition =
                index === 0 && homepageCustomBanners && Array.isArray(homepageCustomBanners)
                  ? homepageCustomBanners.find((banner) => banner.position === 0)
                  : null;

              return (
                <React.Fragment key={id}>
                  {getRowElements(id, title, route, link, icon, options, index, pinUrls, pinnedClaimIds)}
                  {bannerForPosition && <CustomBanner key={`custom-banner-0`} {...bannerForPosition} />}
                </React.Fragment>
              );
            }
          )
        )}
      </div>

      {/* Embed footer with branding */}
      <div className="embed-home__footer">
        <Button
          button="link"
          label={__('Watch More on Odysee.com')}
          href="https://odysee.com"
          iconRight={ICONS.EXTERNAL}
        />
      </div>
    </div>
  );
}

export default EmbedHomePage;
