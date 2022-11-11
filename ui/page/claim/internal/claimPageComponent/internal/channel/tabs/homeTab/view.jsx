// @flow
import React from 'react';
import classnames from 'classnames';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import * as CS from 'constants/claim_search';
import HomeTabSection from './internal/homeTabSection';
import CollectionEditButtons from 'component/collectionEditButtons';
import LivestreamLink from 'component/livestreamLink';
import useFetchLiveStatus from 'effects/use-fetch-live';
import './style.scss';

type Props = {
  uri: string,
  preferEmbed: boolean,
  claim: any,
  editMode: boolean,
  activeLivestreamForChannel: any,
  settingsByChannelId: { [string]: PerChannelSettings },
  handleViewMore: (any) => void,
  doFetchChannelLiveStatus: (string) => void,
  doUpdateCreatorSettings: (ChannelClaim, PerChannelSettings) => void,
};

function HomeTab(props: Props) {
  const {
    preferEmbed,
    claim,
    editMode,
    activeLivestreamForChannel,
    settingsByChannelId,
    handleViewMore,
    doFetchChannelLiveStatus,
    doUpdateCreatorSettings,
  } = props;

  const claimId = claim && claim.claim_id;
  const isChannelBroadcasting = Boolean(activeLivestreamForChannel);
  const homepage_settings =
    settingsByChannelId && settingsByChannelId[claim.claim_id] && settingsByChannelId[claim.claim_id].homepage_settings;

  const homeTemplate = [
    {
      type: 'featured',
      file_type: undefined,
      order_by: CS.ORDER_BY_TOP_VALUE,
      claim_id: undefined,
      rows: 1,
    },
    {
      type: 'content',
      file_type: CS.FILE_TYPES,
      order_by: CS.ORDER_BY_NEW_VALUE,
      claim_id: undefined,
      rows: 2,
    },
  ];

  const [home, setHome] = React.useState([]);
  const [edit, setEdit] = React.useState(false);

  useFetchLiveStatus(claimId, doFetchChannelLiveStatus, true);

  React.useEffect(() => {
    if (homepage_settings) {
      setHome(homepage_settings);
    } else {
      setHome(homeTemplate);
    }
  }, [settingsByChannelId]);

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
      if (e.change.field && e.change.field !== 'order_by') {
        if (e.change.field === 'type') {
          // $FlowIgnore
          newHome[index] = {
            type: e.change.value,
            file_type: e.change.value === 'content' ? CS.FILE_TYPES : undefined,
            order_by: CS.ORDER_BY_NEW_VALUE,
            claim_id: undefined,
          };
        } else if (e.change.field === 'file_type') {
          // $FlowIgnore
          newHome[index][e.change.field] = e.change.value.split(',');
        } else {
          // $FlowIgnore
          newHome[index][e.change.field] = e.change.value;
        }
      } else {
        // $FlowIgnore
        newHome[index][e.change.field] = [e.change.value];
      }
    }
    setHome(newHome);
  }

  function handleAddHomeSection(e) {
    let newHome = [...home];
    newHome.push({
      type: undefined,
      file_type: CS.FILE_TYPES,
      order_by: CS.ORDER_BY_NEW_VALUE,
      claim_id: undefined,
      rows: 1,
    });
    setHome(newHome);
  }

  function handleSaveHomeSection() {
    setHome(home);
    doUpdateCreatorSettings(claim, { homepage_settings: home });
    setEdit(false);
  }

  function handleCancelChanges() {
    setHome(
      (settingsByChannelId && settingsByChannelId[claim.claim_id].homepage_settings) ||
        (settingsByChannelId && homeTemplate)
    );
    setEdit(false);
  }

  const isInitialized = true;
  const isChannelEmpty = false;

  return (
    settingsByChannelId && (
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
        {!edit && isInitialized && isChannelBroadcasting && !isChannelEmpty && (
          <div className="home-section-live">
            <LivestreamLink claimUri={activeLivestreamForChannel.claimUri} />
          </div>
        )}
        {home &&
          !preferEmbed &&
          home.map((section, i) => {
            return (
              <div key={i} className={classnames('home-section-wrapper', { 'home-section-wrapper--edit': edit })}>
                <div className="order">
                  {edit && (
                    <CollectionEditButtons
                      altIndex={i}
                      altCollection={home}
                      altEditCollection={(e) => handleEditCollection(e)}
                    />
                  )}
                </div>
                <HomeTabSection
                  channelClaimId={claimId}
                  section={section}
                  editMode={edit}
                  index={i}
                  hasFeaturedContent={home.some((s) => s?.type === 'featured')}
                  handleEditCollection={(e) => handleEditCollection(e, i)}
                  handleViewMore={(e) => handleViewMore(e)}
                />
              </div>
            );
          })}
        {edit && (
          <div className="home-tab-edit">
            <Button label={__('Save')} button="primary" onClick={() => handleSaveHomeSection()} />
            <Button button="link" label={__('Cancel')} onClick={handleCancelChanges} />
          </div>
        )}
        {edit && (
          <Button label={__('Add New Section')} button="primary" icon={ICONS.ADD} onClick={handleAddHomeSection} />
        )}
      </div>
    )
  );
}

export default HomeTab;
