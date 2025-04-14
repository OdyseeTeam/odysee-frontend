// @flow
import React from 'react';
import classnames from 'classnames';
import { lazyImport } from 'util/lazyImport';

import { getSortedRowData } from './helper';
import { ENABLE_NO_SOURCE_CLAIMS } from 'config';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import * as PAGES from 'constants/pages';
import Page from 'component/page';
import Button from 'component/button';
import ClaimTilesDiscover from 'component/claimTilesDiscover';
import ClaimPreviewTile from 'component/claimPreviewTile';
import Icon from 'component/common/icon';
import WaitUntilOnPage from 'component/common/wait-until-on-page';
import RecommendedPersonal from 'component/recommendedPersonal';
import Yrbl from 'component/yrbl';
import { useIsLargeScreen } from 'effects/use-screensize';
import { GetLinksData } from 'util/buildHomepage';
import { filterActiveLivestreamUris } from 'util/livestream';
import UpcomingClaims from 'component/upcomingClaims';
import Meme from 'web/component/meme';
import { useHistory } from 'react-router-dom';

const FeaturedBanner = lazyImport(() => import('component/featuredBanner' /* webpackChunkName: "featuredBanner" */));
const Portals = lazyImport(() => import('component/portals' /* webpackChunkName: "portals" */));
const CommentCard = lazyImport(() => import('component/commentCard' /* webpackChunkName: "commentCard" */));

type HomepageOrder = { active: ?Array<string>, hidden: ?Array<string> };

type Props = {
  authenticated: boolean,
  followedTags: Array<Tag>,
  subscribedChannelIds: Array<ClaimId>,
  showNsfw: boolean,
  homepageData: any,
  homepageMeme: ?{ text: string, url: string },
  homepageCommentCards: Array<CommentCards>,
  homepageFetched: boolean,
  doFetchAllActiveLivestreamsForQuery: () => void,
  fetchingActiveLivestreams: boolean,
  homepageOrder: HomepageOrder,
  doOpenModal: (id: string, ?{}) => void,
  userHasOdyseeMembership: ?boolean,
  currentTheme: string,
  activeLivestreamByCreatorId: LivestreamByCreatorId,
  livestreamViewersById: LivestreamViewersById,
  getActiveLivestreamUrisForIds: (Array<string>) => Array<string>,
};

function HomePage(props: Props) {
  const {
    followedTags,
    subscribedChannelIds,
    authenticated,
    showNsfw,
    homepageData,
    homepageMeme,
    homepageCommentCards,
    homepageFetched,
    doFetchAllActiveLivestreamsForQuery,
    fetchingActiveLivestreams,
    homepageOrder,
    doOpenModal,
    userHasOdyseeMembership,
    activeLivestreamByCreatorId: al, // yup, unreadable name, but we are just relaying here.
    livestreamViewersById: lv,
  } = props;

  const showPersonalizedChannels = (authenticated || !IS_WEB) && subscribedChannelIds.length > 0;
  const showPersonalizedTags = (authenticated || !IS_WEB) && followedTags && followedTags.length > 0;
  const showIndividualTags = showPersonalizedTags && followedTags.length < 5;
  const isLargeScreen = useIsLargeScreen();
  const { push } = useHistory();

  const sortedRowData: Array<RowDataItem> = React.useMemo(() => {
    const rowData: Array<RowDataItem> = GetLinksData(
      homepageData,
      isLargeScreen,
      true,
      authenticated,
      showPersonalizedChannels,
      showPersonalizedTags,
      subscribedChannelIds,
      followedTags,
      showIndividualTags,
      showNsfw
    );
    return getSortedRowData(authenticated, userHasOdyseeMembership, homepageOrder, homepageData, rowData);
  }, [
    authenticated,
    followedTags,
    homepageData,
    homepageOrder,
    isLargeScreen,
    showIndividualTags,
    showNsfw,
    showPersonalizedChannels,
    showPersonalizedTags,
    subscribedChannelIds,
    userHasOdyseeMembership,
  ]);

  type Cache = {
    topGrid: number,
    hasBanner: boolean,
    [homepageId: string]: {
      livestreamUris: ?Array<string>,
    },
  };

  const cache: Cache = React.useMemo(() => {
    const cache = { topGrid: -1, hasBanner: false };
    if (homepageFetched) {
      sortedRowData.forEach((row: RowDataItem, index: number) => {
        // -- Find index of first row with a title if not already:
        if (cache.topGrid === -1 && Boolean(row.title) && row.id !== 'UPCOMING') {
          cache.topGrid = index;
        }
        // -- Find Bruce Banner if not already:
        if (!cache.hasBanner && row.id === 'BANNER') {
          cache.hasBanner = true;
        }
        // -- Find livestreams related to the category:
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
    help?: string,
  };

  const SectionHeader = ({ title, navigate = '/', icon = '', help }: SectionHeaderProps) => {
    return (
      <h1 className="claim-grid__header">
        <Button navigate={navigate} button="link">
          <Icon className="claim-grid__header-icon" sectionIcon icon={icon} size={20} />
          <span className="claim-grid__title">{title}</span>
          {help}
        </Button>
      </h1>
    );
  };

  const CustomizeHomepage = () => {
    return (
      <Button
        button="link"
        iconRight={ICONS.SETTINGS}
        onClick={() => (authenticated ? doOpenModal(MODALS.CUSTOMIZE_HOMEPAGE) : signupDriver())}
        title={__('Sort and customize your homepage')}
        label={__('Customize --[Short label for "Customize Homepage"]--')}
      />
    );
  };

  function signupDriver() {
    push(`/$/${PAGES.CHANNEL_NEW}?redirect=homepage_customization`);
  }

  function getRowElements(id, title, route, link, icon, help, options, index, pinUrls, pinnedClaimIds) {
    if (id === 'BANNER') {
      if (index === undefined) {
        return <FeaturedBanner key={id} homepageData={homepageData} authenticated={authenticated} />;
      } else return null;
    } else if (id === 'PORTALS') {
      return <Portals key={id} homepageData={homepageData} authenticated={authenticated} />;
    } else if (id === 'UPCOMING') {
      return (
        <React.Fragment key={id}>
          {index === cache.topGrid && <Meme meme={homepageMeme} />}
          {cache.topGrid === -1 && <CustomizeHomepage />}
          <UpcomingClaims
            name="homepage_following"
            channelIds={subscribedChannelIds}
            tileLayout
            liveUris={cache[id].livestreamUris}
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
        hideMembersOnly={id !== 'FOLLOWING'}
        hasSource
        prefixUris={cache[id].livestreamUris}
        pins={{ urls: pinUrls, claimIds: pinnedClaimIds }}
        forceShowReposts={id !== 'FOLLOWING'}
        loading={id === 'FOLLOWING' ? fetchingActiveLivestreams : false}
      />
    );

    const HeaderArea = () => {
      function resolveTitleOverride(title: string) {
        return title === 'Recent From Following' ? 'Following' : title;
      }

      return (
        <>
          {index === cache.topGrid && <Meme meme={homepageMeme} />}
          {title && typeof title === 'string' && (
            <div className="homePage-wrapper__section-title">
              <SectionHeader title={__(resolveTitleOverride(title))} navigate={route || link} icon={icon} help={help} />
              {(index === cache.topGrid ||
                (index && index - 1 === cache.topGrid && sortedRowData[cache.topGrid].id === 'UPCOMING')) && (
                <CustomizeHomepage />
              )}
            </div>
          )}
        </>
      );
    };

    return (
      <div
        key={id}
        className={classnames('claim-grid__wrapper', {
          'hide-ribbon': link !== `/$/${PAGES.CHANNELS_FOLLOWING}`,
        })}
      >
        {id === 'FYP' ? (
          userHasOdyseeMembership && <RecommendedPersonal header={<HeaderArea />} />
        ) : (
          <>
            <HeaderArea />
            {index === 0 && <>{claimTiles}</>}
            {index !== 0 && (
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
                label={__('View More')}
              />
            )}
          </>
        )}
      </div>
    );
  }

  React.useEffect(() => {
    doFetchAllActiveLivestreamsForQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  return (
    <Page className="homePage-wrapper" fullWidthPage>
      {sortedRowData.length === 0 && authenticated && homepageFetched && (
        <div className="empty--centered">
          <Yrbl
            alwaysShow
            title={__('Clean as a whistle! --[title for empty homepage]--')}
            actions={<CustomizeHomepage />}
          />
        </div>
      )}

      {cache.hasBanner &&
        getRowElements(
          'BANNER',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          {},
          undefined,
          undefined,
          undefined
        )}

{homepageFetched &&
  sortedRowData.map(
    ({ id, title, route, link, icon, help, pinnedUrls: pinUrls, pinnedClaimIds, options = {} }, index) => {
      // Check if there are any comments for this position
      const commentCardForPosition = homepageCommentCards?.find((commentCard) => commentCard.position === index) || null;

            return (
              <React.Fragment key={id}>
                {getRowElements(id, title, route, link, icon, help, options, index, pinUrls, pinnedClaimIds)}

                {commentCardForPosition && (
                <div key={`comment-card-${commentCardForPosition.position}`}>
                  <CommentCard
                    claimIds={commentCardForPosition.pinnedClaimIds || []}
                    sortBy={commentCardForPosition.sort_by}
                  />
                </div>
              )}
              </React.Fragment>
            );
          }
        )}
      </Page>
  );
}

export default HomePage;
