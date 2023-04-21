// @flow
import React from 'react';
import classnames from 'classnames';

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
import ScheduledStreams from 'component/scheduledStreams';
import Ad from 'web/component/ad/ad';
import Meme from 'web/component/meme';
import Portals from 'component/portals';
import FeaturedBanner from 'component/featuredBanner';
import { useHistory } from 'react-router-dom';
import './style.scss';

type HomepageOrder = { active: ?Array<string>, hidden: ?Array<string> };

type Props = {
  authenticated: boolean,
  followedTags: Array<Tag>,
  subscribedChannelIds: Array<ClaimId>,
  showNsfw: boolean,
  homepageData: any,
  homepageMeme: ?{ text: string, url: string },
  homepageFetched: boolean,
  doFetchAllActiveLivestreamsForQuery: () => void,
  fetchingActiveLivestreams: boolean,
  hideScheduledLivestreams: boolean,
  homepageOrder: HomepageOrder,
  doOpenModal: (id: string, ?{}) => void,
  userHasOdyseeMembership: ?boolean,
  hasPremiumPlus: boolean,
  currentTheme: string,
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
    homepageFetched,
    doFetchAllActiveLivestreamsForQuery,
    fetchingActiveLivestreams,
    hideScheduledLivestreams,
    homepageOrder,
    doOpenModal,
    userHasOdyseeMembership,
    hasPremiumPlus,
    getActiveLivestreamUrisForIds,
  } = props;

  const showPersonalizedChannels = (authenticated || !IS_WEB) && subscribedChannelIds.length > 0;
  const showPersonalizedTags = (authenticated || !IS_WEB) && followedTags && followedTags.length > 0;
  const showIndividualTags = showPersonalizedTags && followedTags.length < 5;
  const isLargeScreen = useIsLargeScreen();
  const { push } = useHistory();

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

  const sortedRowData: Array<RowDataItem> = getSortedRowData(
    authenticated,
    userHasOdyseeMembership,
    homepageOrder,
    homepageData,
    rowData
  );

  type SectionHeaderProps = {
    title: string,
    navigate?: string,
    icon?: string,
    help?: string,
  };

  const topGrid = sortedRowData.findIndex((row) => row.title);
  const hasBanner = Boolean(
    sortedRowData.filter((obj) => {
      return obj.id === 'BANNER';
    }).length
  );

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
        prefixUris={options.channelIds && getActiveLivestreamUrisForIds(options.channelIds)}
        // pins={{ urls: pinUrls, claimIds: pinnedClaimIds }}
        injectedItem={index === topGrid && !hasPremiumPlus && { node: <Ad type="tileA" tileLayout /> }}
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
          {index === topGrid && <Meme meme={homepageMeme} />}
          {title && typeof title === 'string' && (
            <div className="homePage-wrapper__section-title">
              <SectionHeader title={__(resolveTitleOverride(title))} navigate={route || link} icon={icon} help={help} />
              {index === topGrid && <CustomizeHomepage />}
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

      {hasBanner &&
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
            if (id !== 'FOLLOWING') {
              return getRowElements(id, title, route, link, icon, help, options, index, pinUrls, pinnedClaimIds);
            } else {
              return (
                <React.Fragment key={id}>
                  {!fetchingActiveLivestreams &&
                    authenticated &&
                    subscribedChannelIds.length > 0 &&
                    id === 'FOLLOWING' &&
                    !hideScheduledLivestreams && (
                      <ScheduledStreams
                        channelIds={subscribedChannelIds}
                        tileLayout
                        liveUris={getActiveLivestreamUrisForIds(subscribedChannelIds)}
                        limitClaimsPerChannel={2}
                      />
                    )}
                  {getRowElements(id, title, route, link, icon, help, options, index, pinUrls, pinnedClaimIds)}
                </React.Fragment>
              );
            }
          }
        )}
    </Page>
  );
}

export default HomePage;
