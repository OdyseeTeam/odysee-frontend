// @flow
import { SHOW_ADS } from 'config';
import React from 'react';
import ClaimList from 'component/claimList';
import ClaimListDiscover from 'component/claimListDiscover';
import Ads from 'web/component/ads';
import Card from 'component/common/card';
import { useIsMobile, useIsMediumScreen } from 'effects/use-screensize';
import Button from 'component/button';
import classnames from 'classnames';
import RecSys from 'recsys';

const VIEW_ALL_RELATED = 'view_all_related';
const VIEW_MORE_FROM = 'view_more_from';

type Props = {
  uri: string,
  recommendedContentUris: Array<string>,
  nextRecommendedUri: string,
  isSearching: boolean,
  doFetchRecommendedContent: (string) => void,
  isAuthenticated: boolean,
  claim: ?StreamClaim,
  claimId: string,
};

export default function RecommendedContent(props: Props) {
  const {
    uri,
    doFetchRecommendedContent,
    recommendedContentUris,
    nextRecommendedUri,
    isSearching,
    isAuthenticated,
    claim,
    claimId,
  } = props;
  const [viewMode, setViewMode] = React.useState(VIEW_ALL_RELATED);
  const signingChannel = claim && claim.signing_channel;
  const channelName = signingChannel ? signingChannel.name : null;
  const isMobile = useIsMobile();
  const isMedium = useIsMediumScreen();
  const { onRecsLoaded: onRecommendationsLoaded, onClickedRecommended: onRecommendationClicked } = RecSys;

  React.useEffect(() => {
    doFetchRecommendedContent(uri);
  }, [uri, doFetchRecommendedContent]);

  React.useEffect(() => {
    // Right now we only want to record the recs if they actually saw them.
    if (
      recommendedContentUris &&
      recommendedContentUris.length &&
      nextRecommendedUri &&
      viewMode === VIEW_ALL_RELATED
    ) {
      onRecommendationsLoaded(claimId, recommendedContentUris);
    }
  }, [recommendedContentUris, onRecommendationsLoaded, claimId, nextRecommendedUri, viewMode]);

  function handleRecommendationClicked(e, clickedClaim) {
    if (claim) {
      onRecommendationClicked(claim.claim_id, clickedClaim.claim_id);
    }
  }

  return (
    <Card
      isBodyList
      smallTitle={!isMobile && !isMedium}
      className="file-page__recommended"
      title={__('Related')}
      titleActions={
        signingChannel && (
          <div className="recommended-content__toggles">
            <Button
              className={classnames('button-toggle', {
                'button-toggle--active': viewMode === VIEW_ALL_RELATED,
              })}
              label={__('All')}
              onClick={() => setViewMode(VIEW_ALL_RELATED)}
            />

            <Button
              className={classnames('button-toggle', {
                'button-toggle--active': viewMode === VIEW_MORE_FROM,
              })}
              label={__('More from %claim_name%', { claim_name: channelName })}
              onClick={() => setViewMode(VIEW_MORE_FROM)}
            />
          </div>
        )
      }
      body={
        <div>
          {viewMode === VIEW_ALL_RELATED && (
            <ClaimList
              type="small"
              loading={isSearching}
              uris={recommendedContentUris}
              hideMenu={isMobile}
              injectedItem={SHOW_ADS && IS_WEB && !isAuthenticated && <Ads small type={'video'} />}
              empty={__('No related content found')}
              onClick={handleRecommendationClicked}
            />
          )}
          {viewMode === VIEW_MORE_FROM && signingChannel && (
            <ClaimListDiscover
              hideAdvancedFilter
              tileLayout={false}
              showHeader={false}
              type="small"
              claimType={['stream']}
              orderBy="new"
              pageSize={20}
              infiniteScroll={false}
              hideFilters
              channelIds={[signingChannel.claim_id]}
              loading={isSearching}
              hideMenu={isMobile}
              injectedItem={SHOW_ADS && IS_WEB && !isAuthenticated && <Ads small type={'video'} />}
              empty={__('No related content found')}
            />
          )}
        </div>
      }
    />
  );
}
