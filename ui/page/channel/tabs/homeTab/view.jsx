// @flow
import React from 'react';
import classnames from 'classnames';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import * as CS from 'constants/claim_search';
import HomeTabSection from './internal/homeTabSection';
import CollectionEditButtons from 'component/collectionEditButtons';

import './style.scss';

type Props = {
  uri: string,
  claim: Claim,
  editMode: boolean,
};

function HomeTab(props: Props) {
  const { claim, editMode } = props;
  const claimId = claim && claim.claim_id;

  const [edit, setEdit] = React.useState(false);
  const homeTemplate = {
    enabled: true,
    entries: [
      {
        type: 'featured',
        file_type: undefined,
        order_by: undefined,
        claimId: undefined,
      },
      {
        type: 'content',
        file_type: CS.FILE_VIDEO,
        order_by: CS.ORDER_BY_NEW_VALUE,
        claimId: undefined,
      },/*
      {
        type: 'playlists',
        file_type: undefined,
        order_by: CS.ORDER_BY_NEW_VALUE,
        claimId: undefined,
      },
      {
        type: 'playlist',
        file_type: undefined,
        order_by: undefined,
        claimId: '384b6ed88f6f6fa633f9f869c6696b0d1e183644',
      },*/
    ],
  };

  const [home, setHome] = React.useState(homeTemplate.entries);
  const hasUnsavedChanges = homeTemplate.entries !== home;
  // console.log('hasUnsavedChanges: ', hasUnsavedChanges)

  function handleEditCollection(e, index) {
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
    } else if (e.change) {
      console.log('change: ', e.change);
      if (e.change.field !== 'order_by') {
        newHome[index][e.change.field] = e.change.value;
      } else {
        newHome[index][e.change.field] = [e.change.value];
      }
    }
    setHome(newHome);
  }

  function handleAddHomeSection(e) {
    console.log('handle add: ', e);
    let newHome = [...home];
    newHome.push({
      type: undefined,
      file_type: undefined,
      order: undefined,
      claimId: undefined,
    });
    setHome(newHome);
  }

  function handleCancelChanges() {
    setHome(homeTemplate.entries);
    setEdit(false);
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
              disabled={edit}
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
              <>
                <div key={i} className={classnames('home-section-wrapper', { 'home-section-wrapper--edit': edit })}>
                  <div className="order">
                    {edit && (
                      <CollectionEditButtons
                        altIndex={i}
                        altCollection={home}
                        altEditCollection={(e) => handleEditCollection(e)}
                        // dragHandleProps={dragHandleProps}
                        // doDisablePlayerDrag={doDisablePlayerDrag}
                      />
                    )}
                  </div>
                  <HomeTabSection
                    channelClaimId={claimId}
                    section={section}
                    editMode={edit}
                    handleEditCollection={(e) => handleEditCollection(e, i)}
                  />
                </div>
              </>
            );
          })}
        {edit && (
          <div className="home-tab-edit">
            <Button
              label={__('Save')}
              button="primary"
              disabled={!hasUnsavedChanges}
              onClick={() => handleSaveHomeSection()}
            />
            <Button button="link" label={__('Cancel')} onClick={handleCancelChanges} />
          </div>
        )}
        {/*
        <Button
          label={__('Add New Section')}
          button="primary"
          icon={ICONS.ADD}
          disabled={true}
          onClick={handleAddHomeSection}
        />        
        */}
      </div>
    </>
  );
}

export default HomeTab;
