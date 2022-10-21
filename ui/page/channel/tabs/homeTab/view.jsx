// @flow
import React from 'react';
import classnames from 'classnames';

import ClaimListDiscover from 'component/claimListDiscover';
import ContentTab from 'page/channel/tabs/contentTab';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import * as CS from 'constants/claim_search';
import PlaylistSection from './internal/playlistSection';
import HomeTabSection from './internal/homeTabSection';
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

  const [newSectionType, setNewSectionType] = React.useState('select');
  console.log('newSectionType: ', newSectionType);

  function handleChangeNewSectionType(e) {
    console.log('AA: ', e.target.value);
    setNewSectionType(e.target.value);
  }

  const [edit, setEdit] = React.useState(false);
  const homeTemplate = {
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
  const [home, setHome] = React.useState(homeTemplate.entries);

  function getSection(section) {
    switch (section.type) {
      case undefined:
        return (
          <div className="segment-add-wrapper">
            <div className="segment-add-option">
              <label>Type</label>
              <select value={newSectionType} defaultValue="Select" onChange={handleChangeNewSectionType}>
                <option value="select" disabled="disabled">
                  Select
                </option>
                <option value="content">Content</option>
                <option value="playlists">Playlists</option>
                <option value="playlist">Playlist</option>
              </select>
            </div>
            {newSectionType === 'content' && (
              <div className="segment-add-option">
                <label>File Type</label>
                <select>
                  <option>{__('Show All')}</option>
                  <option>{__('Videos')}</option>
                  <option>{__('Audio')}</option>
                  <option>{__('Posts')}</option>
                  <option>{__('Images')}</option>
                </select>
              </div>
            )}
            {newSectionType === 'playlist' && (
              <div className="segment-add-option">
                <label>Playlist</label>
                <select>
                  <option>My Playlists...</option>
                </select>
              </div>
            )}
            {(newSectionType === 'content' || newSectionType === 'playlists' || newSectionType === 'playlist') && (
              <div className="segment-add-option">
                <label>Order By</label>
                <select>
                  <option>New</option>
                  <option>Trending</option>
                  <option>Top</option>
                </select>
              </div>
            )}
            <div className="segment-add-option">
              <Button
                label={__('Save Section')}
                button="primary"
                // disabled={sectionCount > 0}
                onClick={handleAddHomeSection}
              />
            </div>
          </div>
        );
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
              hasPremiumPlus
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

  function handleEditCollection(e) {
    console.log('e: ', e);
    let newHome = [...home];
    if (e.order) {
      if (e.order.to >= newHome.length) {
        var k = e.order.to - newHome.length + 1;
        while (k--) {
          newHome.push(undefined);
        }
      }
      newHome.splice(e.order.to, 0, newHome.splice(e.order.from, 1)[0]);
    } else if (e.delete) {
      newHome.splice(e.delete.index, 1);
    }

    setHome(newHome);
  }

  function handleAddHomeSection(e) {
    console.log('handle add: ', e);
    let newHome = [...home];
    newHome.push({
      type: undefined,
      fileType: undefined,
      order: undefined,
      claimId: undefined,
    });
    setHome(newHome);
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
              onClick={() => {
                setEdit(!edit);
              }}
            />
          </div>
        )}
        {home &&
          // home.enabled &&
          home.map((section, i) => {
            return (
              <div key={i} className={classnames('segment-wrapper', { 'segment-wrapper--edit': edit })}>
                <div className="order">
                  {edit && (
                    <CollectionEditButtons
                      altIndex={i}
                      altCollection={home}
                      altEditCollection={(e) => handleEditCollection(e)}
                    />
                  )}
                </div>
                <div className="segment">{getSection(section)}</div>
              </div>
            );
          })}
        <HomeTabSection />
        <Button
          label={__('Add New Section')}
          button="primary"
          icon={ICONS.ADD}
          // disabled={sectionCount > 0}
          onClick={handleAddHomeSection}
        />
      </div>
    </>
  );
}

export default HomeTab;
