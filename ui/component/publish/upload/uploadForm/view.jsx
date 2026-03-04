// @flow
import type { DoPublishDesktop } from 'redux/actions/publish';

/*
  On submit, this component calls publish, which dispatches doPublishDesktop.
  doPublishDesktop calls lbry-redux Lbry publish method using lbry-redux publish state as params.
  Publish simply instructs the SDK to find the file path on disk and publish it with the provided metadata.
  On web, the Lbry publish method call is overridden in platform/web/api-setup, using a function in platform/web/publish.
  File upload is carried out in the background by that function.
 */

import { SITE_NAME, SIMPLE_SITE } from 'config';
import React, { useEffect, useState } from 'react';
import { buildURI, isURIValid, isNameValid } from 'util/lbryURI';
import { lazyImport } from 'util/lazyImport';
import * as THUMBNAIL_STATUSES from 'constants/thumbnail_upload_statuses';
import Button from 'component/button';
import ChannelSelector from 'component/channelSelector';
import classnames from 'classnames';
import TagsSelect from 'component/tagsSelect';
import { FormField } from 'component/common/form';
import PublishDescription from 'component/publish/shared/publishDescription';
import PublishAdditionalOptions from 'component/publish/shared/publishAdditionalOptions';
import PublishFormErrors from 'component/publish/shared/publishFormErrors';
import PublishStreamReleaseDate from 'component/publish/shared/publishStreamReleaseDate';
import PublishVisibility from 'component/publish/shared/publishVisibility';
import PublishFile from 'component/publish/upload/publishFile';
import PublishProtectedContent from 'component/publishProtectedContent';

import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import * as PUBLISH_MODES from 'constants/publish_types';
import Spinner from 'component/spinner';
import { BITRATE } from 'constants/publish';
import { SOURCE_NONE } from 'constants/publish_sources';
import * as COLLECTIONS_CONSTS from 'constants/collections';

import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import PublishTemplateButton from 'component/publish/shared/publishTemplateButton';

const SelectThumbnail = lazyImport(() => import('component/selectThumbnail' /* webpackChunkName: "selectThumbnail" */));
const PublishPrice = lazyImport(() =>
  import('component/publish/shared/publishPrice' /* webpackChunkName: "publish" */)
);
const PLAYLIST_SEARCH_THRESHOLD = 8;

type AutoAddPlaylistOption = {
  id: string,
  title: string,
  isPublished: boolean,
  itemCount: number,
  updatedAtMs: number,
};

function getAutoAddPlaylistTitle(collection: any): string {
  const valueTitle = collection?.value?.title;
  const title = collection?.title || valueTitle || collection?.name;
  return typeof title === 'string' && title.trim() ? title.trim() : __('Untitled playlist');
}

function getAutoAddPlaylistCount(collection: any): number {
  if (typeof collection?.itemCount === 'number') return collection.itemCount;
  if (Array.isArray(collection?.items)) return collection.items.length;
  if (Array.isArray(collection?.value?.claims)) return collection.value.claims.length;
  return 0;
}

function getAutoAddPlaylistUpdatedAt(collection: any): number {
  const possibleTs = [
    collection?.updatedAt,
    collection?.updated_at,
    collection?.createdAt,
    collection?.meta?.creation_timestamp,
    collection?.timestamp,
  ];

  for (let i = 0; i < possibleTs.length; i++) {
    const value = Number(possibleTs[i]);
    if (!Number.isFinite(value) || value <= 0) continue;
    return value > 2000000000 ? value : value * 1000;
  }

  return 0;
}

type Props = {
  disabled: boolean,
  tags: Array<Tag>,
  publish: DoPublishDesktop,
  filePath: string | File,
  fileSizeTooBig: boolean,
  prevFileSizeTooBig: boolean,
  fileText: string,
  fileBitrate: number,
  bid: ?number,
  bidError: ?string,
  editingURI: ?string,
  title: ?string,
  thumbnail: ?string,
  thumbnailError: ?boolean,
  uploadThumbnailStatus: string,
  thumbnailPath: ?string,
  description: ?string,
  language: string,
  releaseTimeError: ?string,
  nsfw: boolean,
  fee: {
    amount: string,
    currency: string,
  },
  channelId?: string,
  name: ?string,
  nameError: ?string,
  winningBidForClaimUri: number,
  myClaimForUri: ?StreamClaim,
  licenseType: string,
  otherLicenseDescription: ?string,
  licenseUrl: ?string,
  useLBRYUploader: ?boolean,
  publishing: boolean,
  publishSuccess: boolean,
  publishError?: boolean,
  balance: number,
  isStillEditing: boolean,
  claimToEdit: ?Claim,
  clearPublish: () => void,
  resolveUri: (string) => void,
  resetThumbnailStatus: () => void,
  updatePublishForm: (UpdatePublishState) => void,
  checkAvailability: (string) => void,
  modal: { id: string, modalProps: {} },
  enablePublishPreview: boolean,
  activeChannelClaim: ?ChannelClaim,
  incognito: boolean,
  permanentUrl: ?string,
  remoteUrl: ?string,
  isClaimingInitialRewards: boolean,
  claimInitialRewards: () => void,
  hasClaimedInitialRewards: boolean,
  memberRestrictionStatus: MemberRestrictionStatus,
  fetchCreatorSettings: (string) => void,
  myPublishedCollections: { [string]: any },
  myUnpublishedCollections: { [string]: any },
};

function UploadForm(props: Props) {
  // Detect upload type from query in URL
  const {
    activeChannelClaim,
    bid,
    bidError,
    checkAvailability,
    channelId,
    claimInitialRewards,
    clearPublish,
    description,
    disabled = false,
    editingURI,
    enablePublishPreview,
    filePath,
    fileSizeTooBig,
    prevFileSizeTooBig,
    fileText,
    fileBitrate,
    hasClaimedInitialRewards,
    incognito,
    isClaimingInitialRewards,
    isStillEditing,
    modal,
    myClaimForUri,
    name,
    permanentUrl,
    publish,
    publishError,
    publishSuccess,
    publishing,
    releaseTimeError,
    remoteUrl,
    resetThumbnailStatus,
    resolveUri,
    tags,
    thumbnail,
    thumbnailError,
    title,
    updatePublishForm,
    uploadThumbnailStatus,
    memberRestrictionStatus,
    fetchCreatorSettings,
    myPublishedCollections,
    myUnpublishedCollections,
  } = props;

  const inEditMode = Boolean(editingURI);

  const formTitle = !editingURI ? __('Upload a file') : __('Edit Upload');

  const mode = PUBLISH_MODES.FILE;

  // Used to check if the url name has changed:
  // A new file needs to be provided
  const [prevName, setPrevName] = React.useState(false);
  // Used to check if the file has been modified by user
  const [fileEdited, setFileEdited] = React.useState(false);
  const [prevFileText, setPrevFileText] = React.useState('');

  const [waitForFile, setWaitForFile] = useState(false);

  const TAGS_LIMIT = 5;
  const missingRequiredFile = mode === PUBLISH_MODES.FILE && !editingURI && !filePath && !remoteUrl;
  const emptyPostError = mode === PUBLISH_MODES.POST && (!fileText || fileText.trim() === '');
  const formDisabled = emptyPostError || publishing;
  const isInProgress = filePath || editingURI || name || title;
  const activeChannelName = activeChannelClaim && activeChannelClaim.name;
  const activeChannelId = activeChannelClaim && activeChannelClaim.claim_id;
  // Editing content info
  const fileMimeType =
    myClaimForUri && myClaimForUri.value && myClaimForUri.value.source
      ? myClaimForUri.value.source.media_type
      : undefined;

  const nameEdited = isStillEditing && name !== prevName;
  const thumbnailUploaded = uploadThumbnailStatus === THUMBNAIL_STATUSES.COMPLETE && thumbnail;

  const waitingForFile = waitForFile && !remoteUrl && !filePath;
  const autoAddPlaylistOptions = React.useMemo<Array<AutoAddPlaylistOption>>(() => {
    const seen = new Set();
    const options = [];
    const addEntry = (id: string, collection: any, isPublished: boolean) => {
      if (!id || !collection || COLLECTIONS_CONSTS.BUILTIN_PLAYLISTS.includes(id) || seen.has(id)) {
        return;
      }

      seen.add(id);
      options.push({
        id,
        title: getAutoAddPlaylistTitle(collection),
        isPublished,
        itemCount: getAutoAddPlaylistCount(collection),
        updatedAtMs: getAutoAddPlaylistUpdatedAt(collection),
      });
    };

    Object.entries(myPublishedCollections || {}).forEach(([id, collection]) => addEntry(id, collection, true));
    Object.entries(myUnpublishedCollections || {}).forEach(([id, collection]) => addEntry(id, collection, false));

    return options.sort(
      (a, b) => b.updatedAtMs - a.updatedAtMs || a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    );
  }, [myPublishedCollections, myUnpublishedCollections]);
  const hasAutoAddPlaylistOptions = autoAddPlaylistOptions.length > 0;
  const [autoAddPlaylistEnabled, setAutoAddPlaylistEnabled] = React.useState(false);
  const [autoAddPlaylistSearch, setAutoAddPlaylistSearch] = React.useState('');
  const [autoAddPlaylistId, setAutoAddPlaylistId] = React.useState('');
  const [autoAddPlaylistPosition, setAutoAddPlaylistPosition] = React.useState<'top' | 'bottom'>('top');
  const [autoPublishPlaylistUpdate, setAutoPublishPlaylistUpdate] = React.useState(false);
  const showAutoAddPlaylistSearch = autoAddPlaylistOptions.length > PLAYLIST_SEARCH_THRESHOLD;
  const filteredAutoAddPlaylistOptions = React.useMemo<Array<AutoAddPlaylistOption>>(() => {
    if (!showAutoAddPlaylistSearch) {
      return autoAddPlaylistOptions;
    }

    const query = autoAddPlaylistSearch.trim().toLowerCase();
    if (!query) {
      return autoAddPlaylistOptions;
    }

    return autoAddPlaylistOptions.filter((option) => option.title.toLowerCase().includes(query));
  }, [autoAddPlaylistOptions, autoAddPlaylistSearch, showAutoAddPlaylistSearch]);
  const autoAddPlaylistSelectionValue = filteredAutoAddPlaylistOptions.length > 0 ? autoAddPlaylistId : '';
  const autoAddPlaylistSelectionUnavailable = autoAddPlaylistEnabled && !autoAddPlaylistSelectionValue;
  const selectedAutoAddPlaylist = React.useMemo(
    () => autoAddPlaylistOptions.find((option) => option.id === autoAddPlaylistSelectionValue),
    [autoAddPlaylistOptions, autoAddPlaylistSelectionValue]
  );
  const shouldShowAutoPublishPlaylistOption = Boolean(selectedAutoAddPlaylist && selectedAutoAddPlaylist.isPublished);
  // If they are editing, they don't need a new file chosen
  const formValidLessFile =
    name &&
    isNameValid(name) &&
    title &&
    fileBitrate < BITRATE.MAX &&
    bid &&
    thumbnail &&
    !bidError &&
    !emptyPostError &&
    !releaseTimeError &&
    !(thumbnailError && !thumbnailUploaded) &&
    !(uploadThumbnailStatus === THUMBNAIL_STATUSES.IN_PROGRESS);

  const isOverwritingExistingClaim = !editingURI && myClaimForUri;

  const formValid =
    !(fileSizeTooBig && !(isStillEditing && prevFileSizeTooBig)) &&
    (!memberRestrictionStatus.isApplicable || memberRestrictionStatus.isSelectionValid) &&
    (isOverwritingExistingClaim
      ? false
      : editingURI && !filePath // if we're editing we don't need a file
      ? isStillEditing && formValidLessFile && !waitingForFile
      : formValidLessFile);

  const [previewing, setPreviewing] = React.useState(false);

  const isClear = !filePath && !title && !name && !description && !thumbnail;

  useEffect(() => {
    if (!hasClaimedInitialRewards) {
      claimInitialRewards();
    }
  }, [hasClaimedInitialRewards, claimInitialRewards]);

  // Fetch creator settings (for upload templates) when selected channel changes.
  useEffect(() => {
    const templateChannelId = channelId || activeChannelId;
    if (templateChannelId && !inEditMode) {
      fetchCreatorSettings(templateChannelId);
    }
  }, [channelId, activeChannelId, inEditMode, fetchCreatorSettings]);

  useEffect(() => {
    if (!hasAutoAddPlaylistOptions || inEditMode) {
      setAutoAddPlaylistEnabled(false);
      setAutoAddPlaylistId('');
      return;
    }

    const optionPool =
      showAutoAddPlaylistSearch && autoAddPlaylistSearch.trim()
        ? filteredAutoAddPlaylistOptions
        : autoAddPlaylistOptions;
    const hasSelected = optionPool.some((option) => option.id === autoAddPlaylistId);
    if (!hasSelected) {
      const fallback = optionPool[0] || autoAddPlaylistOptions[0];
      setAutoAddPlaylistId(fallback ? fallback.id : '');
    }
  }, [
    autoAddPlaylistId,
    autoAddPlaylistSearch,
    autoAddPlaylistOptions,
    filteredAutoAddPlaylistOptions,
    hasAutoAddPlaylistOptions,
    inEditMode,
    showAutoAddPlaylistSearch,
  ]);

  useEffect(() => {
    if (!shouldShowAutoPublishPlaylistOption) {
      setAutoPublishPlaylistUpdate(false);
    }
  }, [shouldShowAutoPublishPlaylistOption]);

  useEffect(() => {
    if (!modal) {
      const timer = setTimeout(() => {
        setPreviewing(false);
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [modal]);

  useEffect(() => {
    if (publishError) {
      setPreviewing(false);
      updatePublishForm({ publishError: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [publishError]);

  let submitLabel;

  if (isClaimingInitialRewards) {
    submitLabel = __('Claiming credits...');
  } else if (publishing) {
    if (isStillEditing || inEditMode) {
      submitLabel = __('Saving...');
    } else {
      submitLabel = __('Uploading...');
    }
  } else if (previewing) {
    submitLabel = <Spinner type="small" />;
  } else {
    if (isStillEditing || inEditMode) {
      submitLabel = __('Save');
    } else {
      submitLabel = __('Upload');
    }
  }

  // if you enter the page and it is stuck in publishing, "stop it."
  useEffect(() => {
    if (publishing || publishSuccess) {
      clearPublish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearPublish]);

  useEffect(() => {
    if (!thumbnail) {
      resetThumbnailStatus();
    }
  }, [thumbnail, resetThumbnailStatus]);

  // Save previous name of the editing claim
  useEffect(() => {
    if (isStillEditing && (!prevName || !prevName.trim() === '')) {
      if (name !== prevName) {
        setPrevName(name);
      }
    }
  }, [name, prevName, setPrevName, isStillEditing]);

  // Check for content changes on the text editor
  useEffect(() => {
    if (!fileEdited && fileText !== prevFileText && fileText !== '') {
      setFileEdited(true);
    } else if (fileEdited && fileText === prevFileText) {
      setFileEdited(false);
    }
  }, [fileText, prevFileText, fileEdited]);

  // Every time the channel or name changes, resolve the uris to find winning bid amounts
  useEffect(() => {
    // We are only going to store the full uri, but we need to resolve the uri with and without the channel name
    let uri;
    try {
      uri = name && buildURI({ streamName: name, activeChannelName }, true);
    } catch (e) {}

    if (activeChannelName && name) {
      // resolve without the channel name so we know the winning bid for it
      try {
        const uriLessChannel = buildURI({ streamName: name }, true);
        resolveUri(uriLessChannel);
      } catch (e) {}
    }

    const isValid = uri && isURIValid(uri);
    if (uri && isValid && checkAvailability && name) {
      resolveUri(uri);
      checkAvailability(name);
      updatePublishForm({ uri });
    }
  }, [name, activeChannelName, resolveUri, updatePublishForm, checkAvailability]);

  // because publish editingUri is channel_short/claim_long and we don't have that, resolve it.
  useEffect(() => {
    if (editingURI) {
      resolveUri(editingURI);
    }
  }, [editingURI, resolveUri]);

  useEffect(() => {
    if (incognito) {
      updatePublishForm({ channel: undefined, channelId: undefined });
    } else if (activeChannelName) {
      updatePublishForm({ channel: activeChannelName, channelId: activeChannelId });
    }
  }, [activeChannelName, activeChannelId, incognito, updatePublishForm]);

  // @if TARGET='web'
  function createWebFile() {
    if (fileText) {
      const fileName = name || title;
      if (fileName) {
        return new File([fileText], `${fileName}.md`, { type: 'text/markdown' });
      }
    }
  }
  // @endif

  async function handlePublish() {
    let outputFile = filePath;
    let runPublish = false;

    // Publish post:
    // If here is no file selected yet on desktop, show file dialog and let the
    // user choose a file path. On web a new File is created
    if (mode === PUBLISH_MODES.POST && !emptyPostError) {
      // If user modified content on the text editor or editing name has changed:
      // Save changes and update file path
      if (fileEdited || nameEdited) {
        outputFile = createWebFile();

        // New content stored locally and is not empty
        if (outputFile) {
          updatePublishForm({ filePath: outputFile });
          runPublish = true;
        }
      } else {
        // Only metadata has changed.
        runPublish = true;
      }
    }
    // Publish file
    if (mode === PUBLISH_MODES.FILE) {
      runPublish = true;
    }

    if (runPublish) {
      const postPublishOptions =
        autoAddPlaylistEnabled && autoAddPlaylistSelectionValue
          ? {
              addToPlaylist: {
                collectionId: autoAddPlaylistSelectionValue,
                position: autoAddPlaylistPosition,
                autoPublish: shouldShowAutoPublishPlaylistOption && autoPublishPlaylistUpdate,
                collectionName: selectedAutoAddPlaylist ? selectedAutoAddPlaylist.title : undefined,
              },
            }
          : undefined;

      if (enablePublishPreview) {
        setPreviewing(true);
        publish(outputFile, true, postPublishOptions);
      } else {
        publish(outputFile, false, postPublishOptions);
      }
    }
  }

  // FIle Source Selector State.
  const [fileSource, setFileSource] = useState();
  const changeFileSource = (state) => setFileSource(state);

  const [showSchedulingOptions, setShowSchedulingOptions] = useState(false);
  useEffect(() => {
    setShowSchedulingOptions(fileSource === SOURCE_NONE);
  }, [fileSource]);

  if (publishing) {
    return (
      <div className="main--empty">
        <h1 className="section__subtitle">{__('Publishing...')}</h1>
        <Spinner delayed />
      </div>
    );
  }

  const isFormIncomplete =
    isClaimingInitialRewards ||
    missingRequiredFile ||
    formDisabled ||
    !formValid ||
    autoAddPlaylistSelectionUnavailable ||
    uploadThumbnailStatus === THUMBNAIL_STATUSES.IN_PROGRESS ||
    previewing;

  // Editing claim uri
  return (
    <div className="card-stack">
      <h1 className="page__title page__title--margin">
        <Icon icon={ICONS.PUBLISH} />
        <label>
          {formTitle}
          {!isClear && (
            <Button onClick={() => clearPublish()} icon={ICONS.REFRESH} button="primary" label={__('Clear')} />
          )}
          {!inEditMode && <PublishTemplateButton />}
        </label>
      </h1>

      <Card
        background
        body={
          <div className="publish-row">
            <PublishFile
              inEditMode={inEditMode}
              fileSource={fileSource}
              changeFileSource={changeFileSource}
              uri={permanentUrl}
              mode={mode}
              fileMimeType={fileMimeType}
              disabled={disabled || publishing}
              inProgress={isInProgress}
              setPrevFileText={setPrevFileText}
              setWaitForFile={setWaitForFile}
            />
          </div>
        }
      />

      {mode !== PUBLISH_MODES.POST && (
        <Card
          background
          title={__('Description')}
          body={
            <div className="publish-row">
              <PublishDescription disabled={disabled || publishing} />
            </div>
          }
        />
      )}

      {!publishing && (
        <div className={classnames({ 'card--disabled': formDisabled })}>
          {showSchedulingOptions && <Card body={<PublishStreamReleaseDate />} />}

          <Card
            background
            title={__('Thumbnail')}
            body={
              <div className="publish-row">
                <SelectThumbnail />
              </div>
            }
          />

          <PublishVisibility />

          <PublishProtectedContent claim={myClaimForUri} />

          <PublishPrice disabled={formDisabled} />

          {hasAutoAddPlaylistOptions && !inEditMode && (
            <Card
              className="card--add-to-playlist"
              background
              title={__('Add To Playlist (Optional)')}
              body={
                <div className="publish-row">
                  <FormField
                    type="checkbox"
                    name="publish_auto_add_playlist"
                    label={__('Auto add to Playlist after upload')}
                    checked={autoAddPlaylistEnabled}
                    onChange={() => setAutoAddPlaylistEnabled((prev) => !prev)}
                  />

                  {autoAddPlaylistEnabled && (
                    <>
                      <p
                        className="help"
                        style={{
                          marginTop: 'var(--spacing-m)',
                          fontSize: 'var(--font-xsmall)',
                          color: 'var(--color-text-subtitle)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-xs)',
                        }}
                      >
                        <Icon icon={ICONS.INFO} size={12} />
                        <span>{__('Playlists are sorted by recently updated first.')}</span>
                      </p>

                      {showAutoAddPlaylistSearch && (
                        <FormField
                          type="text"
                          name="publish_auto_add_playlist_search"
                          value={autoAddPlaylistSearch}
                          placeholder={__('Search playlists...')}
                          onChange={(e) => setAutoAddPlaylistSearch(e.target.value || '')}
                        />
                      )}

                      <FormField
                        type="select"
                        name="publish_auto_add_playlist_id"
                        label={__('Playlist')}
                        value={autoAddPlaylistSelectionValue}
                        onChange={(e) => {
                          const value = e.target && e.target.value;
                          if (value) {
                            setAutoAddPlaylistId(value);
                          }
                        }}
                      >
                        {filteredAutoAddPlaylistOptions.length === 0 ? (
                          <option value="">{__('No playlists match your search')}</option>
                        ) : (
                          filteredAutoAddPlaylistOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.title}
                              {option.isPublished ? __(' (Published)') : __(' (Draft)')}
                              {option.itemCount > 0
                                ? __(' (%count% items)', {
                                    count: option.itemCount,
                                  })
                                : ''}
                            </option>
                          ))
                        )}
                      </FormField>

                      {autoAddPlaylistSelectionUnavailable && (
                        <p className="help">
                          {__('No playlist matches your search. Clear the search or disable auto add to continue.')}
                        </p>
                      )}

                      <FormField
                        type="select"
                        name="publish_auto_add_playlist_position"
                        label={__('Insert')}
                        value={autoAddPlaylistPosition}
                        onChange={(e) => {
                          const value = e.target && e.target.value;
                          if (value === 'top' || value === 'bottom') {
                            setAutoAddPlaylistPosition(value);
                          }
                        }}
                      >
                        <option value="top">{__('Add to top')}</option>
                        <option value="bottom">{__('Add to bottom')}</option>
                      </FormField>

                      {shouldShowAutoPublishPlaylistOption && (
                        <FormField
                          type="select"
                          name="publish_auto_add_playlist_publish"
                          label={__('Publish playlist updates')}
                          value={autoPublishPlaylistUpdate ? 'yes' : 'no'}
                          onChange={(e) => setAutoPublishPlaylistUpdate((e.target && e.target.value) === 'yes')}
                        >
                          <option value="no">{__("Don't auto-publish updates")}</option>
                          <option value="yes">{__('Auto-publish this playlist update')}</option>
                        </FormField>
                      )}

                      <p
                        className="help"
                        style={{
                          fontSize: 'var(--font-xsmall)',
                          color: 'var(--color-text-subtitle)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-xs)',
                        }}
                      >
                        <Icon icon={ICONS.INFO} size={12} />
                        <span>
                          {__(
                            'Need more precise ordering than top/bottom? Save first, then fine-tune from the playlist editor.'
                          )}
                        </span>
                      </p>
                    </>
                  )}
                </div>
              }
            />
          )}

          <h2 className="card__title" style={{ marginTop: 'var(--spacing-l)' }}>
            {__('Tags')}
          </h2>

          <Card
            background
            body={
              <div className="publish-row">
                <TagsSelect
                  suggestMature={!SIMPLE_SITE}
                  disableAutoFocus
                  hideHeader
                  label={__('Selected Tags')}
                  empty={__('No tags added')}
                  limitSelect={TAGS_LIMIT}
                  help={
                    <span
                      style={{
                        fontSize: 'var(--font-xsmall)',
                        color: 'var(--color-text-subtitle)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-xs)',
                      }}
                    >
                      <Icon icon={ICONS.INFO} size={12} />
                      <span>
                        {__(
                          "Add tags that are relevant to your content so those who're looking for it can find it more easily. If your content is best suited for mature audiences, ensure it is tagged 'mature'."
                        )}
                      </span>
                    </span>
                  }
                  placeholder={__('gaming, crypto')}
                  onSelect={(newTags) => {
                    const validatedTags = [];
                    newTags.forEach((newTag) => {
                      if (!tags.some((tag) => tag.name === newTag.name)) {
                        validatedTags.push(newTag);
                      }
                    });
                    updatePublishForm({ tags: [...tags, ...validatedTags] });
                  }}
                  onRemove={(clickedTag) => {
                    const newTags = tags.slice().filter((tag) => tag.name !== clickedTag.name);
                    updatePublishForm({ tags: newTags });
                  }}
                  tagsChosen={tags}
                />
              </div>
            }
          />

          <PublishAdditionalOptions disabled={formDisabled} showSchedulingOptions={showSchedulingOptions} />
        </div>
      )}
      <section>
        <div className="section__actions publish__actions">
          <Button button="primary" onClick={handlePublish} label={submitLabel} disabled={isFormIncomplete} />
          <ChannelSelector disabled={isFormIncomplete} isPublishMenu />
        </div>
        <span className="help">
          {!formDisabled && (!formValid || missingRequiredFile) ? (
            <PublishFormErrors
              title={title}
              mode={mode}
              waitForFile={waitingForFile}
              missingRequiredFile={missingRequiredFile}
            />
          ) : (
            <I18nMessage
              tokens={{
                odysee_terms_of_service: (
                  <Button
                    button="link"
                    href="https://odysee.com/$/tos"
                    label={__('%site_name% Terms of Service', { site_name: SITE_NAME })}
                  />
                ),
                odysee_community_guidelines: (
                  <Button
                    button="link"
                    href="https://help.odysee.tv/communityguidelines/"
                    target="_blank"
                    label={__('Community Guidelines')}
                  />
                ),
              }}
            >
              By continuing, you accept the %odysee_terms_of_service% and %odysee_community_guidelines%.
            </I18nMessage>
          )}
        </span>
      </section>
    </div>
  );
}

export default UploadForm;
