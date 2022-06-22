// @flow

/*
  On submit, this component calls publish, which dispatches doPublishDesktop.
  doPublishDesktop calls lbry-redux Lbry publish method using lbry-redux publish state as params.
  Publish simply instructs the SDK to find the file path on disk and publish it with the provided metadata.
  On web, the Lbry publish method call is overridden in platform/web/api-setup, using a function in platform/web/publish.
  File upload is carried out in the background by that function.
 */

import { SITE_NAME, SIMPLE_SITE } from 'config';
import * as ICONS from 'constants/icons';
import React, { useEffect, useState } from 'react';
import Lbry from 'lbry';
import { buildURI, isURIValid, isNameValid } from 'util/lbryURI';
import * as THUMBNAIL_STATUSES from 'constants/thumbnail_upload_statuses';
import Button from 'component/button';
// import ChannelSelect from 'component/channelSelector';
import classnames from 'classnames';
import TagsSelect from 'component/tagsSelect';
import PublishDescription from 'component/publish/shared/publishDescription';
import PublishPrice from 'component/publish/shared/publishPrice';
import PublishAdditionalOptions from 'component/publish/shared/publishAdditionalOptions';
import PublishFormErrors from 'component/publish/shared/publishFormErrors';
import PublishStreamReleaseDate from 'component/publish/shared/publishStreamReleaseDate';
import PublishLivestream from 'component/publish/livestream/publishLivestream';
import SelectThumbnail from 'component/selectThumbnail';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import * as PUBLISH_MODES from 'constants/publish_types';
import { useHistory } from 'react-router';
import Spinner from 'component/spinner';
import { toHex } from 'util/hex';
import { NEW_LIVESTREAM_REPLAY_API } from 'constants/livestream';
import { SOURCE_NONE, SOURCE_SELECT } from 'constants/publish_sources';

type Props = {
  disabled: boolean,
  tags: Array<Tag>,
  publish: (source?: string | File, ?boolean) => void,
  filePath: string | File,
  fileText: string,
  bid: ?number,
  bidError: ?string,
  editingURI: ?string,
  title: ?string,
  thumbnail: ?string,
  thumbnailError: ?boolean,
  uploadThumbnailStatus: ?string,
  thumbnailPath: ?string,
  description: ?string,
  language: string,
  nsfw: boolean,
  contentIsFree: boolean,
  fee: {
    amount: string,
    currency: string,
  },
  name: ?string,
  nameError: ?string,
  isResolvingUri: boolean,
  winningBidForClaimUri: number,
  myClaimForUri: ?StreamClaim,
  licenseType: string,
  otherLicenseDescription: ?string,
  licenseUrl: ?string,
  useLBRYUploader: ?boolean,
  publishing: boolean,
  publishSuccess: boolean,
  balance: number,
  isStillEditing: boolean,
  clearPublish: () => void,
  resolveUri: (string) => void,
  scrollToTop: () => void,
  prepareEdit: (claim: any, uri: string) => void,
  resetThumbnailStatus: () => void,
  amountNeededForTakeover: ?number,
  // Add back type
  updatePublishForm: (any) => void,
  checkAvailability: (string) => void,
  ytSignupPending: boolean,
  modal: { id: string, modalProps: {} },
  enablePublishPreview: boolean,
  activeChannelClaim: ?ChannelClaim,
  incognito: boolean,
  user: ?User,
  isLivestreamClaim: boolean,
  isPostClaim: boolean,
  permanentUrl: ?string,
  remoteUrl: ?string,
  isClaimingInitialRewards: boolean,
  claimInitialRewards: () => void,
  hasClaimedInitialRewards: boolean,
};

function LivestreamForm(props: Props) {
  // Detect upload type from query in URL
  const {
    thumbnail,
    thumbnailError,
    name,
    editingURI,
    myClaimForUri,
    resolveUri,
    title,
    bid,
    bidError,
    uploadThumbnailStatus,
    resetThumbnailStatus,
    updatePublishForm,
    filePath,
    fileText,
    publishing,
    publishSuccess,
    clearPublish,
    isStillEditing,
    tags,
    publish,
    disabled = false,
    checkAvailability,
    ytSignupPending,
    modal,
    enablePublishPreview,
    activeChannelClaim,
    incognito,
    // user,
    // isLivestreamClaim,
    // isPostClaim,
    permanentUrl,
    remoteUrl,
    isClaimingInitialRewards,
    claimInitialRewards,
    hasClaimedInitialRewards,
  } = props;

  const inEditMode = Boolean(editingURI);
  const { replace, location } = useHistory();
  const urlParams = new URLSearchParams(location.search);
  const TYPE_PARAM = 'type';
  const uploadType = urlParams.get(TYPE_PARAM);
  const _uploadType = uploadType && uploadType.toLowerCase();

  const [mode, setMode] = React.useState(PUBLISH_MODES.LIVESTREAM);
  const [publishMode, setPublishMode] = React.useState('New');
  const [isCheckingLivestreams, setCheckingLivestreams] = React.useState(false);

  // Used to check if the url name has changed:
  // A new file needs to be provided
  const [prevName, setPrevName] = React.useState(false);
  // Used to check if the file has been modified by user
  const [fileEdited, setFileEdited] = React.useState(false);
  const [prevFileText, setPrevFileText] = React.useState('');

  const [waitForFile, setWaitForFile] = useState(false);
  const [overMaxBitrate, setOverMaxBitrate] = useState(false);
  const [livestreamData, setLivestreamData] = React.useState([]);
  const hasLivestreamData = livestreamData && Boolean(livestreamData.length);

  const TAGS_LIMIT = 5;
  const fileFormDisabled = mode === PUBLISH_MODES.FILE && !filePath && !remoteUrl;
  const emptyPostError = mode === PUBLISH_MODES.POST && (!fileText || fileText.trim() === '');
  const formDisabled = (fileFormDisabled && !editingURI) || emptyPostError || publishing;
  const isInProgress = filePath || editingURI || name || title;
  const activeChannelName = activeChannelClaim && activeChannelClaim.name;
  // Editing content info
  const fileMimeType =
    myClaimForUri && myClaimForUri.value && myClaimForUri.value.source
      ? myClaimForUri.value.source.media_type
      : undefined;
  const claimChannelId =
    (myClaimForUri && myClaimForUri.signing_channel && myClaimForUri.signing_channel.claim_id) ||
    (activeChannelClaim && activeChannelClaim.claim_id);

  // const nameEdited = isStillEditing && name !== prevName;
  const thumbnailUploaded = uploadThumbnailStatus === THUMBNAIL_STATUSES.COMPLETE && thumbnail;

  const waitingForFile = waitForFile && !remoteUrl && !filePath;
  // If they are editing, they don't need a new file chosen
  const formValidLessFile =
    name &&
    isNameValid(name) &&
    title &&
    !overMaxBitrate &&
    bid &&
    thumbnail &&
    !bidError &&
    !emptyPostError &&
    !(thumbnailError && !thumbnailUploaded) &&
    !(uploadThumbnailStatus === THUMBNAIL_STATUSES.IN_PROGRESS);

  const isOverwritingExistingClaim = !editingURI && myClaimForUri;

  const formValid = isOverwritingExistingClaim
    ? false
    : editingURI && !filePath // if we're editing we don't need a file
    ? isStillEditing && formValidLessFile && !waitingForFile
    : formValidLessFile;

  const [previewing, setPreviewing] = React.useState(false);

  useEffect(() => {
    if (claimChannelId) {
      fetchLivestreams(claimChannelId, activeChannelName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimChannelId]);

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

  // move this to lbryinc OR to a file under ui, and/or provide a standardized livestreaming config.
  async function fetchLivestreams(channelId, channelName) {
    setCheckingLivestreams(true);
    let signedMessage;
    try {
      await Lbry.channel_sign({
        channel_id: channelId,
        hexdata: toHex(channelName || ''),
      }).then((data) => {
        signedMessage = data;
      });
    } catch (e) {
      throw e;
    }
    if (signedMessage) {
      const encodedChannelName = encodeURIComponent(channelName || '');
      const newEndpointUrl =
        `${NEW_LIVESTREAM_REPLAY_API}?channel_claim_id=${channelId}` +
        `&signature=${signedMessage.signature}&signature_ts=${signedMessage.signing_ts}&channel_name=${
          encodedChannelName || ''
        }`;

      const responseFromNewApi = await fetch(newEndpointUrl);

      const data = (await responseFromNewApi.json()).data;

      let newData = [];
      if (data && data.length > 0) {
        for (const dataItem of data) {
          if (dataItem.Status.toLowerCase() === 'inprogress' || dataItem.Status.toLowerCase() === 'ready') {
            const objectToPush = {
              data: {
                fileLocation: dataItem.URL,
                fileDuration:
                  dataItem.Status.toLowerCase() === 'inprogress'
                    ? __('Processing...(') + dataItem.PercentComplete + '%)'
                    : (dataItem.Duration / 1000000000).toString(),
                thumbnails: dataItem.ThumbnailURLs !== null ? dataItem.ThumbnailURLs : [],
                uploadedAt: dataItem.Created,
              },
            };
            newData.push(objectToPush);
          }
        }
      }

      setLivestreamData(newData);
      setCheckingLivestreams(false);
    }
  }

  const isLivestreamMode = mode === PUBLISH_MODES.LIVESTREAM;
  let submitLabel;

  if (isClaimingInitialRewards) {
    submitLabel = __('Claiming credits...');
  } else if (publishing) {
    if (isStillEditing) {
      submitLabel = __('Saving...');
    } else if (isLivestreamMode) {
      submitLabel = __('Creating...');
    } else {
      submitLabel = __('Uploading...');
    }
  } else if (previewing) {
    submitLabel = <Spinner type="small" />;
  } else {
    if (isStillEditing) {
      submitLabel = __('Save');
    } else if (isLivestreamMode) {
      submitLabel = __('Create');
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
      uri = name && buildURI({ streamName: name, activeChannelName });
    } catch (e) {}

    if (activeChannelName && name) {
      // resolve without the channel name so we know the winning bid for it
      try {
        const uriLessChannel = buildURI({ streamName: name });
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

  // set isMarkdownPost in publish form if so, also update isLivestreamPublish
  useEffect(() => {
    updatePublishForm({
      isMarkdownPost: mode === PUBLISH_MODES.POST,
      isLivestreamPublish: mode === PUBLISH_MODES.LIVESTREAM,
    });
  }, [mode, updatePublishForm]);

  useEffect(() => {
    if (incognito) {
      updatePublishForm({ channel: undefined });

      // Anonymous livestreams aren't supported
      if (isLivestreamMode) {
        // setMode(PUBLISH_MODES.FILE);
      }
    } else if (activeChannelName) {
      updatePublishForm({ channel: activeChannelName });
    }
  }, [activeChannelName, incognito, updatePublishForm, isLivestreamMode]);

  /*
  // set mode based on urlParams 'type'
  useEffect(() => {
    if (enableLivestream) {
      setMode(PUBLISH_MODES.LIVESTREAM);
    } else {
      setMode(PUBLISH_MODES.FILE);
    }
    return;
  }, [_uploadType, enableLivestream, defaultPublishMode]);
  */

  // if we have a type urlparam, update it? necessary?
  useEffect(() => {
    if (!_uploadType) return;
    const newParams = new URLSearchParams();
    newParams.set(TYPE_PARAM, mode.toLowerCase());
    replace({ search: newParams.toString() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, _uploadType]);

  /*
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
  */

  async function handlePublish() {
    let outputFile = filePath;
    let runPublish = false;

    // Publish file
    if (mode === PUBLISH_MODES.FILE || isLivestreamMode) {
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

  // When accessing to publishing, make sure to reset file input attributes
  // since we can't restore from previous user selection (like we do
  // with other properties such as name, title, etc.) for security reasons.
  useEffect(() => {
    if (mode === PUBLISH_MODES.FILE) {
      updatePublishForm({ filePath: '', fileDur: 0, fileSize: 0 });
    }
  }, [mode, updatePublishForm]);

  // FIle Source Selector State.
  const [fileSource, setFileSource] = useState();
  const changeFileSource = (state) => setFileSource(state);

  const [showSchedulingOptions, setShowSchedulingOptions] = useState(false);
  useEffect(() => {
    setShowSchedulingOptions(isLivestreamMode && fileSource === SOURCE_NONE);
  }, [isLivestreamMode, fileSource]);

  if (publishing) {
    return (
      <div className="main--empty">
        <h1 className="section__subtitle">{__('Publishing...')}</h1>
        <Spinner delayed />
      </div>
    );
  }

  // Editing claim uri
  return (
    <div className="card-stack">
      {/* <ChannelSelect hideAnon={isLivestreamMode} disabled={disabled} autoSet channelToSet={claimChannelId} /> */}
      <Card className="card--livestream">
        <div>
          <Button
            key={'New'}
            icon={ICONS.LIVESTREAM}
            iconSize={18}
            label={'New Livestream'}
            button="alt"
            onClick={() => {
              // $FlowFixMe
              setPublishMode('New');
            }}
            className={classnames('button-toggle', { 'button-toggle--active': publishMode === 'New' })}
          />
          <Button
            key={'Replay'}
            icon={ICONS.MENU}
            iconSize={18}
            label={'Choose Replay'}
            button="alt"
            onClick={() => {
              // $FlowFixMe
              setPublishMode('Replay');
            }}
            disabled={!hasLivestreamData}
            className={classnames('button-toggle', { 'button-toggle--active': publishMode === 'Replay' })}
          />
        </div>
        <Button
          button="primary"
          label={__('Check for Replays')}
          disabled={isCheckingLivestreams}
          icon={ICONS.REFRESH}
          onClick={() => fetchLivestreams(claimChannelId, activeChannelName)}
        />
      </Card>

      <PublishLivestream
        inEditMode={inEditMode}
        // fileSource={fileSource}
        fileSource={publishMode === 'New' ? fileSource : SOURCE_SELECT}
        changeFileSource={changeFileSource}
        uri={permanentUrl}
        mode={publishMode === 'New' ? PUBLISH_MODES.LIVESTREAM : PUBLISH_MODES.FILE}
        fileMimeType={fileMimeType}
        disabled={disabled || publishing}
        inProgress={isInProgress}
        setPublishMode={setMode}
        setPrevFileText={setPrevFileText}
        livestreamData={livestreamData}
        // subtitle={customSubtitle}
        setWaitForFile={setWaitForFile}
        setOverMaxBitrate={setOverMaxBitrate}
        isCheckingLivestreams={isCheckingLivestreams}
        // checkLivestreams={fetchLivestreams}
        channelId={claimChannelId}
        channelName={activeChannelName}
      />

      {mode !== PUBLISH_MODES.POST && <PublishDescription disabled={formDisabled} />}

      {!publishing && (
        <div className={classnames({ 'card--disabled': formDisabled })}>
          {showSchedulingOptions && <Card body={<PublishStreamReleaseDate />} />}

          <Card actions={<SelectThumbnail livestreamData={livestreamData} />} />

          <h2 className="card__title" style={{ marginTop: 'var(--spacing-l)' }}>
            {__('Tags')}
          </h2>
          <TagsSelect
            suggestMature={!SIMPLE_SITE}
            disableAutoFocus
            hideHeader
            label={__('Selected Tags')}
            empty={__('No tags added')}
            limitSelect={TAGS_LIMIT}
            help={__(
              "Add tags that are relevant to your content so those who're looking for it can find it more easily. If your content is best suited for mature audiences, ensure it is tagged 'mature'."
            )}
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

          {!isLivestreamMode && <PublishPrice disabled={formDisabled} />}

          <PublishAdditionalOptions disabled={formDisabled} showSchedulingOptions={showSchedulingOptions} />
        </div>
      )}
      <section>
        <div className="section__actions">
          <Button
            button="primary"
            onClick={handlePublish}
            label={submitLabel}
            disabled={
              isClaimingInitialRewards ||
              formDisabled ||
              !formValid ||
              uploadThumbnailStatus === THUMBNAIL_STATUSES.IN_PROGRESS ||
              ytSignupPending ||
              previewing
            }
          />
          <Button button="link" onClick={clearPublish} label={__('New --[clears Publish Form]--')} />
        </div>
        <p className="help">
          {!formDisabled && !formValid ? (
            <PublishFormErrors title={title} mode={mode} waitForFile={waitingForFile} overMaxBitrate={overMaxBitrate} />
          ) : (
            <I18nMessage
              tokens={{
                lbry_terms_of_service: (
                  <Button
                    button="link"
                    href="https://odysee.com/$/tos"
                    label={__('%site_name% Terms of Service', { site_name: SITE_NAME })}
                  />
                ),
              }}
            >
              By continuing, you accept the %lbry_terms_of_service%.
            </I18nMessage>
          )}
        </p>
      </section>
    </div>
  );
}

export default LivestreamForm;
