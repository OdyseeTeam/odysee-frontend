// @flow
import React, { Fragment } from 'react';
import classnames from 'classnames';

import ClaimListDiscover from 'component/claimListDiscover';
import ContentTab from 'page/channel/tabs/contentTab';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import * as CS from 'constants/claim_search';
import PlaylistSection from './internal/playlistSection';
import CollectionEditButtons from 'component/collectionEditButtons';

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

  const [edit, setEdit] = React.useState(false);
  const home = {
    enabled: true,
    entries: [
      {
        type: 'featured',
        fileType: undefined,
        order: undefined,
        claimId: undefined,
      },
      {
        type: 'content',
        fileTypes: CS.FILE_VIDEO,
        order: CS.ORDER_BY_TOP_VALUE,
        claimId: undefined,
      },
      {
        type: 'playlists',
        fileType: undefined,
        order: CS.ORDER_BY_TOP_NEW,
        claimId: undefined,
      },
      {
        type: 'playlist',
        fileType: undefined,
        order: undefined,
        claimId: '384b6ed88f6f6fa633f9f869c6696b0d1e183644',
      },
      {
        type: 'content',
        fileType: CS.FILE_DOCUMENT,
        order: CS.ORDER_BY_NEW,
        claimId: undefined,
      },
    ],
  };

  function getSegment(section) {
    switch (section.type) {
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
      case 'content':
        return (
          <>
            <label className="home-segment-title">Publications</label>
            <ClaimListDiscover
              fetchViewCount
              hideFilters
              hideAdvancedFilter
              hideLayoutButton
              tileLayout
              orderBy={section.order}
              // claimType={section.files}
              channelIds={[claimId]}
              infiniteScroll={false}
              maxClaimRender={6}
              useSkeletonScreen={false}
            />
          </>
        );
      case 'playlists':
        return (
          <>
            <label className="home-segment-title">Playlists</label>
            <ContentTab
              claimType={'collection'}
              uri={uri}
              viewHiddenChannels
              totalPages={1}
              defaultPageSize={1}
              defaultInfiniteScroll={false}
              params={{ page: 1 }}
              hasPremiumPlus={true}
            />
          </>
        );
      case 'playlist':
        return (
          <>
            <PlaylistSection collectionId={section.claimId} />
          </>
        );
    }
  }

  return (
    <>
      <div className="home-tab">
        {editMode && (
          <div className="channel_sections__actions">
            <Button
              label={__('Edit Home Tab')}
              button="secondary"
              icon={ICONS.EDIT}
              // disabled={sectionCount > 0}
              onClick={() => {
                console.log('fdsgfd');
                setEdit(!edit);
              }}
            />
          </div>
        )}
        {home &&
          home.enabled &&
          home.entries.map((section) => {
            return (
              <div className={classnames('segment-wrapper', { 'segment-wrapper--edit': edit })}>
                <div className="order">
                  <CollectionEditButtons />
                </div>
                <div className="segment">{getSegment(section)}</div>
              </div>
            );
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
