// @flow
import React from 'react';
import analytics from 'analytics';
import classnames from 'classnames';

import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';

import { useHistory } from 'react-router-dom';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import { Form, Submit, FormErrors } from 'component/common/form';
import { COLLECTION_PAGE } from 'constants/urlParams';

import Button from 'component/button';
// import CollectionDeleteButton from 'component/collectionDeleteButton';
import SortButton from '../../internal/collectionActions/internal/sortButton';
import CollectionItemsList from 'component/collectionItemsList';
import Spinner from 'component/spinner';
import BusyIndicator from 'component/common/busy-indicator';
import Tooltip from 'component/common/tooltip';
import CollectionGeneralTab from './internal/collectionGeneralTab';
import withCollectionItems from 'hocs/withCollectionItems';
import ErrorBubble from 'component/common/error-bubble';
import { normalizePlaylistOrder, serializePlaylistOrderSections } from 'util/playlist-order';
import './style.scss';

export const PAGE_TAB_QUERY = `tab`;

const TAB = {
  GENERAL: 0,
  ITEMS: 1,
};

const PLAYLIST_ORDER_DEFAULT_SECTION_ID = 'playlist-order-default';

type PlaylistSectionOption = {
  id: string,
  label: string,
};

type Props = {
  collectionId: string,
  onDoneForId: (string) => void,
  // -- redux -
  // uri: ?string,
  hasClaim: boolean,
  collectionParams: CollectionPublishCreateParams | CollectionPublishUpdateParams,
  isClaimPending: boolean,
  activeChannelClaim: ?ChannelClaim,
  claimsById: { [string]: Claim },
  settingsByChannelId: { [string]: PerChannelSettings },
  collectionHasEdits: boolean,
  collectionHasUnSavedEdits: boolean,
  hasUnavailableClaims: boolean,
  doCollectionPublish: (CollectionPublishCreateParams, string) => Promise<any>,
  doCollectionEdit: (id: string, params: CollectionEditParams) => void,
  doClearEditsForCollectionId: (id: string) => void,
  doOpenModal: (id: string, props: {}) => void,
  doRemoveFromUnsavedChangesCollectionsForCollectionId: (collectionId: string) => void,
  doFetchCreatorSettings: (channelId: string) => any,
  doUpdateCreatorSettings: (ChannelClaim, PerChannelSettings) => void,
};

export const CollectionFormContext = React.createContext<any>();

const CollectionPublishForm = (props: Props) => {
  const {
    // uri,
    collectionId,
    onDoneForId,
    // -- redux -
    hasClaim,
    collectionParams,
    isClaimPending,
    activeChannelClaim,
    claimsById,
    settingsByChannelId,
    collectionHasEdits,
    collectionHasUnSavedEdits,
    hasUnavailableClaims,
    doCollectionPublish,
    doCollectionEdit,
    doClearEditsForCollectionId,
    doOpenModal,
    doRemoveFromUnsavedChangesCollectionsForCollectionId,
    doFetchCreatorSettings,
    doUpdateCreatorSettings,
  } = props;

  const initialParams = React.useRef(collectionParams);
  const collectionResetPending = React.useRef(false);

  const {
    goBack,
    location: { search },
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  const editing = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.EDIT;
  const publishing = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.PUBLISH;
  const isNewPlaylistPublish = publishing && !hasClaim;

  const [thumbailError, setThumbnailError] = React.useState();
  const [formParams, setFormParams] = React.useState(collectionParams);
  const [tabIndex, setTabIndex] = React.useState(0);
  const [showItemsSpinner, setShowItemsSpinner] = React.useState(false);
  const [publishPending, setPublishPending] = React.useState(isClaimPending);

  const { claims } = formParams;
  const selectedChannelId = formParams && formParams.channel_id;
  const selectedChannelClaim = selectedChannelId ? claimsById && claimsById[selectedChannelId] : undefined;
  const selectedChannelSettings = selectedChannelId
    ? settingsByChannelId && settingsByChannelId[selectedChannelId]
    : undefined;
  const normalizedPlaylistOrder = React.useMemo(
    () => normalizePlaylistOrder(selectedChannelSettings && selectedChannelSettings.playlist_order),
    [selectedChannelSettings]
  );
  const playlistSectionOptions = React.useMemo((): Array<PlaylistSectionOption> => {
    const sections = normalizedPlaylistOrder.sections || [];
    if (!sections.length) {
      return [
        {
          id: PLAYLIST_ORDER_DEFAULT_SECTION_ID,
          label: __('Main section'),
        },
      ];
    }

    return sections.map((section, index) => {
      const title = section.title && section.title.trim();
      return {
        id: section.id,
        label:
          title ||
          __('Section %number%', {
            number: index + 1,
          }),
      };
    });
  }, [normalizedPlaylistOrder]);
  const [playlistTargetSectionId, setPlaylistTargetSectionId] = React.useState(
    playlistSectionOptions[0] ? playlistSectionOptions[0].id : PLAYLIST_ORDER_DEFAULT_SECTION_ID
  );
  const [playlistInsertPosition, setPlaylistInsertPosition] = React.useState<'top' | 'bottom'>('top');

  const hasClaims = claims && claims.length;
  const itemError = publishing && !hasClaims ? __('Cannot publish empty list') : undefined;
  const hasChanges =
    (publishing && !hasClaim) ||
    collectionHasEdits ||
    collectionHasUnSavedEdits ||
    JSON.stringify(initialParams.current) !== JSON.stringify(formParams);
  const publishingClaimWithNoChanges = publishing && hasClaim && !collectionHasEdits && !hasChanges;

  React.useEffect(() => {
    if (!isNewPlaylistPublish || !selectedChannelId || selectedChannelSettings) {
      return;
    }

    const maybePromise = doFetchCreatorSettings(selectedChannelId);
    if (maybePromise && typeof maybePromise.catch === 'function') {
      maybePromise.catch(() => {});
    }
  }, [isNewPlaylistPublish, selectedChannelId, selectedChannelSettings, doFetchCreatorSettings]);

  React.useEffect(() => {
    if (!isNewPlaylistPublish) return;

    const hasSelectedOption = playlistSectionOptions.some((option) => option.id === playlistTargetSectionId);
    if (!hasSelectedOption) {
      setPlaylistTargetSectionId(
        playlistSectionOptions[0] ? playlistSectionOptions[0].id : PLAYLIST_ORDER_DEFAULT_SECTION_ID
      );
    }
  }, [isNewPlaylistPublish, playlistSectionOptions, playlistTargetSectionId]);

  const updateChannelPlaylistOrderWithNewPlaylist = React.useCallback(
    (newPlaylistId: string) => {
      if (!isNewPlaylistPublish || !newPlaylistId) return;
      if (!selectedChannelClaim || selectedChannelClaim.value_type !== 'channel') return;

      const resolvedChannelClaim: ChannelClaim = (selectedChannelClaim: any);
      const normalizedOrder = normalizePlaylistOrder(selectedChannelSettings && selectedChannelSettings.playlist_order);
      const sections = normalizedOrder.sections.map((section) => ({
        id: section.id,
        title: section.title,
        itemIds: section.itemIds.filter((id) => id !== newPlaylistId),
      }));

      const targetSectionId = playlistTargetSectionId || sections[0]?.id || PLAYLIST_ORDER_DEFAULT_SECTION_ID;
      let targetSectionIndex = sections.findIndex((section) => section.id === targetSectionId);

      if (targetSectionIndex === -1) {
        sections.push({
          id: targetSectionId,
          title: '',
          itemIds: [],
        });
        targetSectionIndex = sections.length - 1;
      }

      const targetSection = sections[targetSectionIndex];
      const nextItemIds = targetSection.itemIds.slice();
      if (playlistInsertPosition === 'bottom') {
        nextItemIds.push(newPlaylistId);
      } else {
        nextItemIds.unshift(newPlaylistId);
      }

      sections[targetSectionIndex] = {
        ...targetSection,
        itemIds: nextItemIds,
      };

      doUpdateCreatorSettings(resolvedChannelClaim, {
        playlist_order: serializePlaylistOrderSections(sections),
      });
    },
    [
      doUpdateCreatorSettings,
      isNewPlaylistPublish,
      playlistInsertPosition,
      playlistTargetSectionId,
      selectedChannelClaim,
      selectedChannelSettings,
    ]
  );

  function updateFormParams(newParams: {}) {
    setFormParams((prevParams) => ({ ...prevParams, ...newParams }));
  }

  function handlePublish(params) {
    setPublishPending(true);

    const successCb = (pendingClaim) => {
      setPublishPending(false);

      if (pendingClaim) {
        if (isNewPlaylistPublish && pendingClaim.claim_id) {
          updateChannelPlaylistOrderWithNewPlaylist(pendingClaim.claim_id);
        }

        const claimId = pendingClaim.claim_id;
        analytics.apiLog.publish(pendingClaim);
        onDoneForId(claimId);
      }
    };

    // $FlowFixMe
    doCollectionPublish(params, collectionId)
      .then(successCb)
      .catch(() => setPublishPending(false));
  }

  function handleSubmitForm() {
    if (!hasChanges) return goBack();

    const trimmedParams = { ...formParams };
    if (trimmedParams.title) trimmedParams.title = trimmedParams.title.trim();

    setFormParams(trimmedParams);

    if (editing) {
      // $FlowFixMe
      doCollectionEdit(collectionId, trimmedParams);

      return onDoneForId(collectionId);
    }

    if (hasUnavailableClaims) {
      doOpenModal(MODALS.CONFIRM, {
        title: __('Confirm Publish'),
        subtitle: __(
          'You are about to publish this playlist with unavailable items that will be removed (all other items will be unaffected). This action is permanent and cannot be undone.'
        ),
        onConfirm: (closeModal) => {
          handlePublish(trimmedParams);
          closeModal();
        },
      });
    } else {
      handlePublish(trimmedParams);
    }
  }

  function handleCancelButton() {
    doRemoveFromUnsavedChangesCollectionsForCollectionId(collectionId);
    goBack();
  }

  function onTabChange(newTabIndex) {
    if (tabIndex !== newTabIndex) {
      if (newTabIndex === TAB.ITEMS) {
        setShowItemsSpinner(true);
        setTimeout(() => {
          // Wait enough time for the spinner to appear, then switch tabs.
          setTabIndex(newTabIndex);
          // We can stop the spinner immediately. If the list takes a long time
          // to render, the spinner would continue to spin until the
          // state-change is flushed.
          setShowItemsSpinner(false);
        }, 250);
      } else {
        setTabIndex(newTabIndex);
      }
    }
  }

  // Reset the form to original collection state if the edits are cleared
  React.useEffect(() => {
    if (collectionParams && collectionResetPending.current) {
      // $FlowFixMe
      setFormParams(collectionParams);

      initialParams.current = collectionParams;
      collectionResetPending.current = false;
    } else if (collectionParams) {
      // Keep claims in formParams up to date
      updateFormParams({ claims: collectionParams.claims });
    }
  }, [collectionParams]);

  if (publishing && activeChannelClaim === undefined) {
    return (
      <div className="main--empty">
        <Spinner />
      </div>
    );
  }

  return (
    <Form
      className="main--contained collection-publish-form__wrapper"
      onSubmit={handleSubmitForm}
      errors={{ ...(itemError ? { items: itemError } : {}), ...(thumbailError ? { thumbnail: thumbailError } : {}) }}
      disableSubmitOnEnter
    >
      <CollectionFormContext.Provider value={{ formParams, updateFormParams }}>
        <Tabs onChange={onTabChange} index={tabIndex}>
          <TabList className="tabs__list--collection-edit-page">
            <Tab>{__('General')}</Tab>
            <Tab>
              {__('Items')}
              {showItemsSpinner && <Spinner type="small" />}
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              {tabIndex === TAB.GENERAL && (
                <CollectionGeneralTab
                  collectionId={collectionId}
                  formParams={formParams}
                  setThumbnailError={setThumbnailError}
                  updateFormParams={updateFormParams}
                  isNewPlaylistPublish={isNewPlaylistPublish}
                  playlistSectionOptions={playlistSectionOptions}
                  playlistTargetSectionId={playlistTargetSectionId}
                  playlistInsertPosition={playlistInsertPosition}
                  onPlaylistTargetSectionChange={setPlaylistTargetSectionId}
                  onPlaylistInsertPositionChange={setPlaylistInsertPosition}
                />
              )}
            </TabPanel>

            <TabPanel>
              {tabIndex === TAB.ITEMS && (
                <>
                  <div className={classnames('collection-actions')}>
                    <SortButton collectionId={collectionId} />
                  </div>
                  <CollectionItemsList
                    collectionId={collectionId}
                    empty={__('This playlist has no items.')}
                    showEdit
                    isEditPreview
                  />
                </>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>

        {hasUnavailableClaims && publishing && (
          <ErrorBubble>
            {__(
              'This playlist has unavailable items and they will not be published. Make sure you want to continue before uploading.'
            )}
          </ErrorBubble>
        )}

        <div className="section__actions">
          <Submit
            button="primary"
            disabled={publishingClaimWithNoChanges || publishPending}
            label={publishPending ? <BusyIndicator message={__('Submitting')} /> : __(editing ? 'Save' : 'Submit')}
          />
          <Button button="link" label={__('Cancel')} onClick={handleCancelButton} />

          {collectionHasEdits && (
            <Tooltip title={__('Delete all edits from this published playlist')}>
              <Button
                button="alt"
                icon={ICONS.REFRESH}
                label={__('Clear Updates')}
                onClick={() =>
                  doOpenModal(MODALS.CONFIRM, {
                    title: __('Clear Updates'),
                    subtitle: __(
                      "Are you sure you want to delete all edits from this published playlist? (You won't be able to undo this action later)"
                    ),
                    onConfirm: (closeModal) => {
                      doClearEditsForCollectionId(collectionId);
                      collectionResetPending.current = true;
                      closeModal();
                    },
                  })
                }
              />
            </Tooltip>
          )}
        </div>

        <FormErrors />

        <p className="help">
          {publishing
            ? __('After submitting, it will take a few minutes for your changes to be live for everyone.')
            : __('After saving, all changes will remain private')}
        </p>
      </CollectionFormContext.Provider>
    </Form>
  );
};

export default withCollectionItems(CollectionPublishForm);
