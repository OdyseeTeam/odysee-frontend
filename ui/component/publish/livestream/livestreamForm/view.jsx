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
import * as ICONS from 'constants/icons';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import Lbry from 'lbry';
import { buildURI, isURIValid, isNameValid } from 'util/lbryURI';
import * as THUMBNAIL_STATUSES from 'constants/thumbnail_upload_statuses';
import { BITRATE } from 'constants/publish';
import Button from 'component/button';
import ChannelSelector from 'component/channelSelector';
import classnames from 'classnames';
import TagsSelect from 'component/tagsSelect';
import PublishDescription from 'component/publish/shared/publishDescription';
import PublishAdditionalOptions from 'component/publish/shared/publishAdditionalOptions';
import PublishFormErrors from 'component/publish/shared/publishFormErrors';
import PublishStreamReleaseDate from 'component/publish/shared/publishStreamReleaseDate';
import PublishLivestream from 'component/publish/livestream/publishLivestream';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import Spinner from 'component/spinner';
import { toHex } from 'util/hex';
import { lazyImport } from 'util/lazyImport';
import { NEW_LIVESTREAM_REPLAY_API } from 'constants/livestream';
import { useIsMobile } from 'effects/use-screensize';
import Tooltip from 'component/common/tooltip';
import PublishProtectedContent from 'component/publishProtectedContent';

const SelectThumbnail = lazyImport(() => import('component/selectThumbnail' /* webpackChunkName: "selectThumbnail" */));
const PublishPrice = lazyImport(() =>
  import('component/publish/shared/publishPrice' /* webpackChunkName: "publish" */)
);

type Props = {
  liveCreateType: LiveCreateType,
  liveEditType: LiveEditType,
  tags: Array<Tag>,
  publish: DoPublishDesktop,
  filePath: string | WebFile,
  fileText: string,
  fileBitrate: number,
  bid: ?number,
  bidError: ?string,
  editingURI: ?string,
  title: ?string,
  thumbnail: ?string,
  thumbnailError: ?boolean,
  uploadThumbnailStatus: ?string,
  releaseTimeError: ?string,
  thumbnailPath: ?string,
  description: ?string,
  language: string,
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
  // useLBRYUploader: ?boolean,
  publishing: boolean,
  publishSuccess: boolean,
  publishError?: boolean,
  balance: number,
  isStillEditing: boolean,
  clearPublish: () => void,
  resolveUri: (string) => void,
  resetThumbnailStatus: () => void,
  // Add back type
  updatePublishForm: (UpdatePublishState) => void,
  checkAvailability: (string) => void,
  modal: { id: string, modalProps: {} },
  enablePublishPreview: boolean,
  activeChannelClaim: ?ChannelClaim,
  user: ?User,
  isLivestreamClaim: boolean,
  isPostClaim: boolean,
  permanentUrl: ?string,
  isClaimingInitialRewards: boolean,
  claimInitialRewards: () => void,
  hasClaimedInitialRewards: boolean,
  setClearStatus: (boolean) => void,
  // disabled?: boolean,
  remoteFileUrl?: string,
  isMemberRestrictionValid: boolean,
};

function LivestreamForm(props: Props) {
  // Detect upload type from query in URL
  const {
    liveCreateType,
    liveEditType,
    thumbnail,
    thumbnailError,
    releaseTimeError,
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
    fileBitrate,
    publishing,
    publishSuccess,
    publishError,
    clearPublish,
    isStillEditing,
    tags,
    publish,
    checkAvailability,
    modal,
    enablePublishPreview,
    activeChannelClaim,
    description,
    // user,
    balance,
    permanentUrl,
    isClaimingInitialRewards,
    claimInitialRewards,
    hasClaimedInitialRewards,
    setClearStatus,
    remoteFileUrl,
    isMemberRestrictionValid,
  } = props;

  const {
    location: { search },
  } = useHistory();
  const urlParams = new URLSearchParams(search);
  const createTypeShortcut = urlParams.get('s');

  const isMobile = useIsMobile();

  const inEditMode = Boolean(editingURI);
  const activeChannelName = activeChannelClaim && activeChannelClaim.name;

  const [isCheckingLivestreams, setCheckingLivestreams] = React.useState(false);

  // Used to check if the url name has changed:
  // A new file needs to be provided
  const [prevName, setPrevName] = React.useState(false);

  const [waitForFile] = useState(false);

  const [livestreamData, setLivestreamData] = React.useState([]);
  const hasLivestreamData = livestreamData && Boolean(livestreamData.length);

  const TAGS_LIMIT = 5;
  const formDisabled = publishing;
  const claimChannelId =
    (myClaimForUri && myClaimForUri.signing_channel && myClaimForUri.signing_channel.claim_id) ||
    (activeChannelClaim && activeChannelClaim.claim_id);

  // const nameEdited = isStillEditing && name !== prevName;
  const thumbnailUploaded = uploadThumbnailStatus === THUMBNAIL_STATUSES.COMPLETE && thumbnail;

  const waitingForFile = waitForFile && !remoteFileUrl && !filePath;
  // If they are editing, they don't need a new file chosen
  const formValidLessFile =
    isMemberRestrictionValid &&
    name &&
    isNameValid(name) &&
    title &&
    fileBitrate < BITRATE.MAX &&
    bid &&
    thumbnail &&
    !bidError &&
    !(thumbnailError && !thumbnailUploaded) &&
    !releaseTimeError &&
    !(uploadThumbnailStatus === THUMBNAIL_STATUSES.IN_PROGRESS);

  const isOverwritingExistingClaim = !editingURI && myClaimForUri;

  const formValid = isOverwritingExistingClaim
    ? false
    : editingURI && !filePath // if we're editing we don't need a file
    ? isStillEditing && formValidLessFile && !waitingForFile
    : formValidLessFile;

  const [previewing, setPreviewing] = React.useState(false);

  const requiresReplayUrl =
    liveCreateType === 'choose_replay' || (liveCreateType === 'edit_placeholder' && liveEditType === 'use_replay');
  const requiresFile = liveCreateType === 'edit_placeholder' && liveEditType === 'upload_replay';

  const disabled = !title || !name || (requiresReplayUrl && !remoteFileUrl) || (requiresFile && !filePath);
  const isClear = !title && !name && !description && !thumbnail;

  useEffect(() => {
    setClearStatus(isClear);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [isClear]);

  useEffect(() => {
    if (activeChannelClaim && activeChannelClaim.claim_id && activeChannelName) {
      fetchLivestreams(activeChannelClaim.claim_id, activeChannelName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimChannelId, activeChannelName]);

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
        `${NEW_LIVESTREAM_REPLAY_API}?channel_claim_id=${String(channelId)}` +
        `&signature=${signedMessage.signature}&signature_ts=${signedMessage.signing_ts}&channel_name=${
          encodedChannelName || ''
        }`;

      const responseFromNewApi = await fetch(newEndpointUrl);

      const data: Array<ReplayListResponse> = (await responseFromNewApi.json()).data;
      const newData: Array<LivestreamReplayItem> = [];

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
                percentComplete: dataItem.PercentComplete,
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

  let submitLabel;

  if (isClaimingInitialRewards) {
    submitLabel = __('Claiming credits...');
  } else if (publishing) {
    if (isStillEditing || inEditMode) {
      submitLabel = __('Saving...');
    } else {
      submitLabel = __('Creating...');
    }
  } else if (previewing) {
    submitLabel = <Spinner type="small" />;
  } else {
    if (isStillEditing || inEditMode) {
      submitLabel = __('Save');
    } else {
      submitLabel = __('Create');
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
    if (createTypeShortcut === 'Replay') {
      updatePublishForm({ liveCreateType: 'choose_replay' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  useEffect(() => {
    // $FlowFixMe please
    updatePublishForm({ channel: activeChannelName });
  }, [activeChannelName, updatePublishForm]);

  async function handlePublish() {
    let outputFile = filePath;

    if (enablePublishPreview) {
      setPreviewing(true);
      publish(outputFile, true);
    } else {
      publish(outputFile, false);
    }
  }

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
    (requiresReplayUrl && !remoteFileUrl) ||
    (requiresFile && !filePath) ||
    previewing;

  // Editing claim uri
  return (
    <div className={balance < 0.01 ? 'disabled' : ''}>
      <div className="card-stack">
        <Card className="publish-livestream-header">
          <Button
            key={'New'}
            icon={ICONS.LIVESTREAM_MONOCHROME}
            iconSize={18}
            label={__('New Livestream')}
            button="alt"
            onClick={() => updatePublishForm({ liveCreateType: 'new_placeholder' })}
            disabled={editingURI}
            className={classnames('button-toggle', { 'button-toggle--active': liveCreateType === 'new_placeholder' })}
          />
          {liveCreateType !== 'edit_placeholder' && (
            <Button
              key={'Replay'}
              icon={ICONS.MENU}
              iconSize={18}
              label={__('Choose Replay')}
              button="alt"
              onClick={() => updatePublishForm({ liveCreateType: 'choose_replay' })}
              disabled={!hasLivestreamData}
              className={classnames('button-toggle', { 'button-toggle--active': liveCreateType === 'choose_replay' })}
            />
          )}
          {liveCreateType === 'edit_placeholder' && (
            <Button
              key={'Edit'}
              icon={ICONS.EDIT}
              iconSize={18}
              label={__('Edit / Update')}
              button="alt"
              className="button-toggle button-toggle--active"
            />
          )}
          {!isMobile && <ChannelSelector hideAnon autoSet channelToSet={claimChannelId} isTabHeader />}
          <Tooltip title={__('Check for Replays')}>
            <Button
              button="secondary"
              label={__('Check for Replays')}
              disabled={isCheckingLivestreams}
              icon={ICONS.REFRESH}
              onClick={() => fetchLivestreams(claimChannelId, activeChannelName)}
            />
          </Tooltip>
        </Card>

        <Card
          background
          body={
            <div className="publish-row">
              <PublishLivestream
                inEditMode={inEditMode}
                uri={permanentUrl}
                disabled={publishing}
                livestreamData={livestreamData}
                isCheckingLivestreams={isCheckingLivestreams}
              />
            </div>
          }
        />

        <Card
          background
          title={__('Description')}
          body={
            <div className="publish-row">
              <PublishDescription disabled={disabled} />
            </div>
          }
        />

        {!publishing && (
          <div className={classnames({ 'card--disabled': disabled })}>
            {(liveCreateType === 'new_placeholder' ||
              (liveCreateType === 'edit_placeholder' && liveEditType === 'update_only')) && (
              <Card background title={__('Date')} body={<PublishStreamReleaseDate />} />
            )}

            <Card
              background
              title={__('Thumbnail')}
              body={
                <div className="publish-row">
                  <SelectThumbnail />
                </div>
              }
              livestreamData={livestreamData}
            />

            <PublishProtectedContent claim={myClaimForUri} />

            {liveCreateType === 'choose_replay' && <PublishPrice disabled={disabled} />}

            <Card
              background
              title={__('Tags')}
              body={
                <div className="publish-row">
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
                </div>
              }
            />

            <PublishAdditionalOptions
              isLivestream
              disabled={disabled}
              showSchedulingOptions={liveCreateType === 'new_placeholder' || liveCreateType === 'edit_placeholder'}
              // ^--- the name is wrong. should be "hide" instead
            />
          </div>
        )}
        <section>
          <div className="section__actions publish__actions">
            <Button button="primary" onClick={handlePublish} label={submitLabel} disabled={isFormIncomplete} />
            <ChannelSelector hideAnon disabled={isFormIncomplete} autoSet channelToSet={claimChannelId} isPublishMenu />
          </div>
          <p className="help">
            {!formDisabled && !formValid ? (
              <PublishFormErrors title={title} waitForFile={waitingForFile} />
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
          </p>
        </section>
      </div>
    </div>
  );
}

export default LivestreamForm;
