// @flow
import type { DoPublishDesktop } from 'redux/actions/publish';

/*
  On submit, this component calls publish, which dispatches doPublishDesktop.
  doPublishDesktop calls lbry-redux Lbry publish method using lbry-redux publish state as params.
  Publish simply instructs the SDK to find the file path on disk and publish it with the provided metadata.
  On web, the Lbry publish method call is overridden in platform/web/api-setup, using a function in platform/web/publish.
  File upload is carried out in the background by that function.
 */

import { SITE_NAME } from 'config';
import React, { useEffect, useState } from 'react';
import { buildURI, isURIValid, isNameValid } from 'util/lbryURI';
import { lazyImport } from 'util/lazyImport';
import * as THUMBNAIL_STATUSES from 'constants/thumbnail_upload_statuses';
import Button from 'component/button';
import ChannelSelector from 'component/channelSelector';
import classnames from 'classnames';
import TagsSelect from 'component/tagsSelect';
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

import * as ICONS from 'constants/icons';
import * as TAGS from 'constants/tags';
import Icon from 'component/common/icon';

const SelectThumbnail = lazyImport(() => import('component/selectThumbnail' /* webpackChunkName: "selectThumbnail" */));
const PublishPrice = lazyImport(() =>
  import('component/publish/shared/publishPrice' /* webpackChunkName: "publish" */)
);

type Props = {
  disabled: boolean,
  tags: Array<Tag>,
  publish: DoPublishDesktop,
  filePath: string | File,
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
};

function UploadForm(props: Props) {
  // Detect upload type from query in URL
  const {
    activeChannelClaim,
    bid,
    bidError,
    checkAvailability,
    claimInitialRewards,
    clearPublish,
    description,
    disabled = false,
    editingURI,
    enablePublishPreview,
    filePath,
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
  const fileFormDisabled = mode === PUBLISH_MODES.FILE && !filePath && !remoteUrl;
  const emptyPostError = mode === PUBLISH_MODES.POST && (!fileText || fileText.trim() === '');
  const formDisabled = (fileFormDisabled && !editingURI) || emptyPostError || publishing;
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
      if (enablePublishPreview) {
        setPreviewing(true);
        publish(outputFile, true);
      } else {
        publish(outputFile, false);
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
    formDisabled ||
    !formValid ||
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

          <h2 className="card__title" style={{ marginTop: 'var(--spacing-l)' }}>
            {__('Tags')}
          </h2>

          <Card
            background
            body={
              <div className="publish-row">
                <TagsSelect
                  disableAutoFocus
                  hideHeader
                  label={__('Selected Tags')}
                  empty={__('No tags added')}
                  limitSelect={TAGS_LIMIT}
                  help={__(
                    "Add tags that are relevant to your content so those who're looking for it can find it more easily."
                  )}
                  disabledControlTags={[TAGS.AGE_RESTRICED_CHANNEL_IMAGES_TAG]}
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
          {!formDisabled && !formValid ? (
            <PublishFormErrors title={title} mode={mode} waitForFile={waitingForFile} />
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
