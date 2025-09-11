// @flow
import { v4 as Uuidv4 } from 'uuid';
import React from 'react';
import ClaimList from 'component/claimList';
import ClaimListDiscover from 'component/claimListDiscover';
import ClaimPreview from 'component/claimPreview';
import Card from 'component/common/card';
import { useIsMobile, useIsSmallScreen } from 'effects/use-screensize';
import Button from 'component/button';
import { FYP_ID } from 'constants/urlParams';
import classnames from 'classnames';
import RecSys from 'recsys';
import LangFilterIndicator from 'component/langFilterIndicator';
import './style.scss';

const VIEW_ALL_RELATED = 'view_all_related';
const VIEW_MORE_FROM = 'view_more_from';

type Props = {
  uri: string,
  recommendedContentUris: Array<string>,
  nextRecommendedUri: string,
  isSearching: boolean,
  searchInLanguage: boolean,
  doFetchRecommendedContent: (string, ?FypParam) => void,
  claim: ?StreamClaim,
  claimId: string,
  metadata: any,
  location: UrlLocation,
};

export default React.memo<Props>(function RecommendedContent(props: Props) {
  const {
    uri,
    doFetchRecommendedContent,
    recommendedContentUris,
    nextRecommendedUri,
    isSearching,
    searchInLanguage,
    claim,
    location,
  } = props;

  const claimId: ?string = claim && claim.claim_id;

  const [viewMode, setViewMode] = React.useState(VIEW_ALL_RELATED);
  const signingChannel = claim && claim.signing_channel;
  const channelName = signingChannel ? signingChannel.name : null;
  const isMobile = useIsMobile();
  const isSmall = useIsSmallScreen();
  const { onRecsLoaded: onRecommendationsLoaded, onClickedRecommended: onRecommendationClicked } = RecSys;

  // Assume this component always resides in a page where the `uri` matches
  // e.g. never in a floating popup. With that, we can grab the FYP ID from
  // the search param directly. Otherwise, the parent component would need to
  // pass it.
  // @see https://www.notion.so/FYP-Design-Notes-727782dde2cb485290c530ae96a34285
  const { search } = location;
  const urlParams = new URLSearchParams(search);
  const fypId = urlParams.get(FYP_ID);
  const [uuid] = React.useState(fypId ? Uuidv4() : '');

  React.useEffect(() => {
    const fypParam = fypId && uuid ? { gid: fypId, uuid } : null;
    doFetchRecommendedContent(uri, fypParam);
  }, [uri, doFetchRecommendedContent, fypId, uuid]);

  React.useEffect(() => {
    // Right now we only want to record the recs if they actually saw them.
    if (
      claimId &&
      recommendedContentUris &&
      recommendedContentUris.length &&
      nextRecommendedUri &&
      viewMode === VIEW_ALL_RELATED
    ) {
      onRecommendationsLoaded(claimId, recommendedContentUris, uuid);
    }
  }, [recommendedContentUris, onRecommendationsLoaded, claimId, nextRecommendedUri, viewMode, uuid]);

  function handleRecommendationClicked(e, clickedClaim) {
    if (claim) {
      onRecommendationClicked(claim.claim_id, clickedClaim.claim_id);
    }
  }

  return (
    <Card
      isBodyList
      smallTitle={!isMobile && !isSmall}
      className="file-page__recommended"
      title={__('Related')}
      titleActions={
        signingChannel && (
          <div className="recommended-content__bubble">
            {searchInLanguage && <LangFilterIndicator />}

            <Button
              className={classnames('button-bubble', {
                'button-bubble--active': viewMode === VIEW_ALL_RELATED,
              })}
              label={__('Related')}
              onClick={() => setViewMode(VIEW_ALL_RELATED)}
            />

            <Button
              className={classnames('button-bubble', {
                'button-bubble--active': viewMode === VIEW_MORE_FROM,
              })}
              label={__('More from %claim_name%', { claim_name: channelName })}
              onClick={() => setViewMode(VIEW_MORE_FROM)}
            />
          </div>
        )
      }
      body={
        <div>
          {isSearching && (
            <>
              {new Array(20).fill(1).map((x, i) => (
                <ClaimPreview key={i} placeholder="loading" type="small" />
              ))}
            </>
          )}
          {viewMode === VIEW_ALL_RELATED && (
            <ClaimList
              type="small"
              loading={isSearching}
              uris={recommendedContentUris}
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
              hasSource
              channelIds={[signingChannel.claim_id]}
              loading={isSearching}
              empty={__('No related content found')}
            />
          )}
        </div>
      }
    />
  );
}, areEqual);

function areEqual(prevProps: Props, nextProps: Props) {
  const a = prevProps;
  const b = nextProps;

  if (
    a.uri !== b.uri ||
    a.nextRecommendedUri !== b.nextRecommendedUri ||
    a.isSearching !== b.isSearching ||
    (a.recommendedContentUris && !b.recommendedContentUris) ||
    (!a.recommendedContentUris && b.recommendedContentUris) ||
    (a.claim && !b.claim) ||
    (!a.claim && b.claim)
  ) {
    return false;
  }

  if (a.claim && b.claim && a.claim.claim_id !== b.claim.claim_id) {
    return false;
  }

  if (a.recommendedContentUris && b.recommendedContentUris) {
    if (a.recommendedContentUris.length !== b.recommendedContentUris.length) {
      return false;
    }

    let i = a.recommendedContentUris.length;
    while (i--) {
      if (a.recommendedContentUris[i] !== b.recommendedContentUris[i]) {
        return false;
      }
    }
  }

  return true;
}
