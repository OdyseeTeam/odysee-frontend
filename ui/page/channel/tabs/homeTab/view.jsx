// @flow
import React, { Fragment } from 'react';
import FileThumbnail from 'component/fileThumbnail';
import ClaimPreviewTile from 'component/claimPreviewTile';
import ClaimList from 'component/claimList';
import ClaimListDiscover from 'component/claimListDiscover';
import ContentTab from 'page/channel/tabs/contentTab';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import * as CS from 'constants/claim_search';
import PlaylistSection from './internal/playlistSection';

import './style.scss';

type Props = {
  uri: string,
  claim: Claim,
  editMode: boolean,
};

function HomeTab(props: Props) {
  const { uri, claim, editMode } = props;
  const claimId = claim && claim.claim_id;
  // console.log('props: ', props);
  // const claimsInChannel = (claim && claim.meta.claims_in_channel) || 0;

  const home = {
    enabled: true,
    entries: [
      {
        type: 'featured',
        order: undefined,
        position: 0,
      },
      {
        type: 'content',
        files: CS.CONTENT_ALL,
        order: CS.ORDER_BY_TOP_VALUE,
        position: 1,
      },
      {
        type: 'playlists',
        order: 'new',
        position: 2,
      },
      {
        type: 'playlist',
        order: undefined,
        claimId: undefined,
        position: 2,
      },
    ],
  };

  function getSegment(type, order, files) {
    switch (type) {
      case 'featured':
        return (
          <ClaimListDiscover
            fetchViewCount
            hideFilters
            hideAdvancedFilter
            hideLayoutButton
            channelIds={[claimId]}
            infiniteScroll={false}
            useSkeletonScreen={false}
            maxClaimRender={1}
          />
        );
        break;
      case 'content':
        return (
          <>
            <label className="home-segment-title">{order} Publications</label>
            <ClaimListDiscover
              fetchViewCount
              hideFilters
              hideAdvancedFilter
              hideLayoutButton
              tileLayout
              orderBy={order}
              // claimType={files}
              channelIds={[claimId]}
              infiniteScroll={false}
              maxClaimRender={6}
              useSkeletonScreen={false}
            />
          </>
        );
        break;
      case 'playlists':
        return (
          <>
            <label className="home-segment-title">Playlists</label>
            <ContentTab
              claimType={'collection'}
              uri={uri}
              viewHiddenChannels
              // empty={collectionEmpty}
              totalPages={1}
              defaultPageSize={1}
              defaultInfiniteScroll={false}
              params={{ page: 1 }}
              hasPremiumPlus={true}
            />
          </>
        );
        break;
      case 'playlist':
        return (
          <>
            <PlaylistSection collectionId="384b6ed88f6f6fa633f9f869c6696b0d1e183644" />
          </>
        );
        break;
    }
  }

  return (
    <>
      {false && editMode && (
        <div className="channel_sections__actions">
          <Button
            label={__('Edit Home Tab')}
            button="secondary"
            icon={ICONS.EDIT}
            // disabled={sectionCount > 0}
            // onClick={handleAddFeaturedChannels}
          />
        </div>
      )}
      <div className="home-tab">
        {home &&
          home.enabled &&
          home.entries.map((section) => {
            return getSegment(section.type, section.order, section.files);
          })}
        <Button
          label={__('Add New Section')}
          button="primary"
          icon={ICONS.ADD}
          // disabled={sectionCount > 0}
          // onClick={handleAddFeaturedChannels}
        />
      </div>
    </>
  );
}

export default HomeTab;
