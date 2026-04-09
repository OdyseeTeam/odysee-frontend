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
import Icon from 'component/common/icon';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doResetThumbnailStatus, doClearPublish, doUpdatePublishForm, doPublishDesktop } from 'redux/actions/publish';
import { doResolveUri, doCheckPublishNameAvailability } from 'redux/actions/claims';
import {
  selectPublishFormValues,
  selectIsStillEditing,
  selectMemberRestrictionStatus,
  selectPublishFormValue,
  selectMyClaimForUri,
} from 'redux/selectors/publish';
import { selectIsStreamPlaceholderForUri } from 'redux/selectors/claims';
import * as RENDER_MODES from 'constants/file_render_modes';
import * as SETTINGS from 'constants/settings';
import { doClaimInitialRewards } from 'redux/actions/rewards';
import {
  selectUnclaimedRewardValue,
  selectIsClaimingInitialRewards,
  selectHasClaimedInitialRewards,
} from 'redux/selectors/rewards';
import { selectModal, selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { selectClientSetting } from 'redux/selectors/settings';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import { selectUser } from 'redux/selectors/user';
import { selectBalance } from 'redux/selectors/wallet';
const SelectThumbnail = lazyImport(
  () =>
    import(
      'component/selectThumbnail'
      /* webpackChunkName: "selectThumbnail" */
    )
);
const PublishPrice = lazyImport(
  () =>
    import(
      'component/publish/shared/publishPrice'
      /* webpackChunkName: "publish" */
    )
);
type LiveCreateTypeValue = 'new_placeholder' | 'choose_replay' | 'edit_placeholder';
type LiveEditTypeValue = 'update_only' | 'use_replay' | 'upload_replay';

type ReplayApiItem = {
  Status: string;
  URL: string;
  Duration: number;
  PercentComplete: number;
  ThumbnailURLs: string[] | null;
  Created: string;
};

type Props = {
  setClearStatus?: (arg0: boolean) => void;
  disabled?: boolean;
};

function LivestreamForm(props: Props) {
  const { setClearStatus } = props;

  const dispatch = useAppDispatch();
  const formValues = useAppSelector((state) => selectPublishFormValues(state));
  const {
    tags,
    filePath: formFilePath,
    fileText,
    fileBitrate,
    bid,
    bidError,
    editingURI,
    title,
    thumbnail,
    thumbnailError,
    uploadThumbnailStatus,
    releaseTimeError,
    description,
    name,
    publishing,
    liveCreateType = 'new_placeholder',
    liveEditType = 'use_replay',
  } = formValues;
  const myClaimForUri = useAppSelector((state) => selectMyClaimForUri(state, true));
  const permanentUrl = (myClaimForUri && myClaimForUri.permanent_url) || '';
  const isLivestreamClaim = useAppSelector((state) => selectIsStreamPlaceholderForUri(state, permanentUrl));
  const isPostClaim =
    useAppSelector((state) => makeSelectFileRenderModeForUri(permanentUrl)(state)) === RENDER_MODES.MARKDOWN;
  const isStillEditing = useAppSelector((state) => selectIsStillEditing(state));
  const filePath = useAppSelector((state) => selectPublishFormValue(state, 'filePath'));
  const remoteFileUrl = useAppSelector((state) => selectPublishFormValue(state, 'remoteFileUrl'));
  const publishSuccess = useAppSelector((state) => selectPublishFormValue(state, 'publishSuccess'));
  const publishError = useAppSelector((state) => selectPublishFormValue(state, 'publishError'));
  const modal = useAppSelector((state) => selectModal(state));
  const enablePublishPreview = useAppSelector((state) => selectClientSetting(state, SETTINGS.ENABLE_PUBLISH_PREVIEW));
  const activeChannelClaim = useAppSelector((state) => selectActiveChannelClaim(state));
  const user = useAppSelector((state) => selectUser(state));
  const isClaimingInitialRewards = useAppSelector((state) => selectIsClaimingInitialRewards(state));
  const hasClaimedInitialRewards = useAppSelector((state) => selectHasClaimedInitialRewards(state));
  const memberRestrictionStatus = useAppSelector((state) => selectMemberRestrictionStatus(state)) as any as {
    isApplicable: boolean;
    isSelectionValid: boolean;
    isRestricting: boolean;
    details: Record<string, boolean>;
  };
  const balance = useAppSelector((state) => selectBalance(state));

  const updatePublishForm = (value: UpdatePublishState) => dispatch(doUpdatePublishForm(value));
  const clearPublish = () => dispatch(doClearPublish());
  const resolveUri = (uri: string) => dispatch(doResolveUri(uri));
  const publish: DoPublishDesktop = (fp, preview) => dispatch(doPublishDesktop(fp, preview));
  const resetThumbnailStatus = () => dispatch(doResetThumbnailStatus());
  const checkAvailability = (n: string) => dispatch(doCheckPublishNameAvailability(n));
  const claimInitialRewards = () => dispatch(doClaimInitialRewards());
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const createTypeShortcut = urlParams.get('s');
  const isMobile = useIsMobile();
  const inEditMode = Boolean(editingURI);
  const activeChannelName = activeChannelClaim && activeChannelClaim.name;
  const activeChannelId = activeChannelClaim && activeChannelClaim.claim_id;
  const [isCheckingLivestreams, setCheckingLivestreams] = React.useState(false);
  // Used to check if the url name has changed:
  // A new file needs to be provided
  const [prevName, setPrevName] = React.useState<string | false>(false);
  const [waitForFile] = useState(false);
  const [livestreamData, setLivestreamData] = React.useState<LivestreamReplayItem[]>([]);
  const hasLivestreamData = livestreamData && Boolean(livestreamData.length);
  const TAGS_LIMIT = 5;
  const formDisabled = publishing;
  // const nameEdited = isStillEditing && name !== prevName;
  const thumbnailUploaded = uploadThumbnailStatus === THUMBNAIL_STATUSES.COMPLETE && thumbnail;
  const waitingForFile = waitForFile && !remoteFileUrl && !filePath;
  // If they are editing, they don't need a new file chosen
  const formValidLessFile =
    (!memberRestrictionStatus.isApplicable || memberRestrictionStatus.isSelectionValid) &&
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
    setClearStatus(isClear); // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [isClear]);
  useEffect(() => {
    if (activeChannelName && activeChannelId) {
      fetchLivestreams(activeChannelId, activeChannelName);
    }
  }, [activeChannelName, activeChannelId]);
  useEffect(() => {
    if (!hasClaimedInitialRewards) {
      dispatch(doClaimInitialRewards());
    }
  }, [hasClaimedInitialRewards, dispatch]);
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
      updatePublishForm({
        publishError: undefined,
      });
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [publishError]);

  // move this to lbryinc OR to a file under ui, and/or provide a standardized livestreaming config.
  async function fetchLivestreams(channelId: string | undefined, channelName: string | undefined) {
    if (!channelId || !channelName) {
      setCheckingLivestreams(false);
      return;
    }

    setCheckingLivestreams(true);

    try {
      const signedMessage = await Lbry.channel_sign({
        channel_id: channelId,
        hexdata: toHex(channelName),
      });

      if (!signedMessage?.signature) {
        setCheckingLivestreams(false);
        return;
      }

      const encodedChannelName = encodeURIComponent(channelName);
      const newEndpointUrl =
        `${NEW_LIVESTREAM_REPLAY_API}?channel_claim_id=${String(channelId)}` +
        `&signature=${signedMessage.signature}&signature_ts=${signedMessage.signing_ts}&channel_name=${encodedChannelName}`;
      const responseFromNewApi = await fetch(newEndpointUrl);
      const json = await responseFromNewApi.json();
      const data: Array<ReplayApiItem> = json?.data || json || [];
      const newData: Array<LivestreamReplayItem> = [];

      if (data && data.length > 0) {
        for (const dataItem of data) {
          const statusNorm = typeof dataItem.Status === 'string' ? dataItem.Status.toLowerCase() : '';
          if (statusNorm === 'inprogress' || statusNorm === 'ready') {
            const objectToPush: LivestreamReplayItem = {
              data: {
                claimId: '',
                url: dataItem.URL,
                fileLocation: dataItem.URL,
                fileDuration:
                  statusNorm === 'inprogress'
                    ? __('Processing...(') + (dataItem.PercentComplete ?? '') + '%)'
                    : String((dataItem.Duration ?? 0) / 1000000000),
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
    } catch (e) {
      console.warn('[LivestreamForm] Failed to fetch replays:', e); // eslint-disable-line no-console
    } finally {
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
      dispatch(doClearPublish());
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);
  useEffect(() => {
    if (!thumbnail) {
      dispatch(doResetThumbnailStatus());
    }
  }, [thumbnail, dispatch]);
  // Save previous name of the editing claim
  useEffect(() => {
    if (isStillEditing && (!prevName || (typeof prevName === 'string' && prevName.trim() === ''))) {
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
      uri =
        name &&
        buildURI(
          {
            streamName: name,
            channelName: activeChannelName,
          } as LbryUrlObj,
          true
        );
    } catch (e) {}

    if (activeChannelName && name) {
      // resolve without the channel name so we know the winning bid for it
      try {
        const uriLessChannel = buildURI(
          {
            streamName: name,
          },
          true
        );
        dispatch(doResolveUri(uriLessChannel));
      } catch (e) {}
    }

    const isValid = uri && isURIValid(uri);

    if (uri && isValid && name) {
      dispatch(doResolveUri(uri));
      dispatch(doCheckPublishNameAvailability(name));
      dispatch(
        doUpdatePublishForm({
          uri,
        })
      );
    }
  }, [name, activeChannelName, dispatch]);
  // because publish editingUri is channel_short/claim_long and we don't have that, resolve it.
  useEffect(() => {
    if (editingURI) {
      dispatch(doResolveUri(editingURI));
    }
  }, [editingURI, dispatch]);
  useEffect(() => {
    if (createTypeShortcut === 'Replay') {
      updatePublishForm({
        liveCreateType: 'choose_replay',
      });
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);
  useEffect(() => {
    dispatch(
      doUpdatePublishForm({
        channel: activeChannelName || undefined,
        channelId: activeChannelId || undefined,
      })
    );
  }, [activeChannelName, activeChannelId, dispatch]);

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
            onClick={() =>
              updatePublishForm({
                liveCreateType: 'new_placeholder',
              })
            }
            disabled={editingURI}
            className={classnames('button-toggle', {
              'button-toggle--active': liveCreateType === 'new_placeholder',
            })}
          />
          {liveCreateType !== 'edit_placeholder' && (
            <Button
              key={'Replay'}
              icon={ICONS.MENU}
              iconSize={18}
              label={__('Choose Replay')}
              button="alt"
              onClick={() =>
                updatePublishForm({
                  liveCreateType: 'choose_replay',
                })
              }
              disabled={!hasLivestreamData}
              className={classnames('button-toggle', {
                'button-toggle--active': liveCreateType === 'choose_replay',
              })}
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
          {/* @ts-ignore -- selectedChannelUrl is managed internally */}
          {!isMobile && <ChannelSelector hideAnon isTabHeader />}
          <Tooltip title={__('Check for Replays')}>
            <Button
              button="secondary"
              label={__('Check for Replays')}
              disabled={isCheckingLivestreams}
              icon={ICONS.REFRESH}
              onClick={() => fetchLivestreams(activeChannelId, activeChannelName)}
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
          <div
            className={classnames({
              'card--disabled': disabled,
            })}
          >
            {(liveCreateType === 'new_placeholder' ||
              (liveCreateType === 'edit_placeholder' && liveEditType === 'update_only')) && (
              <Card background title={__('Date')} body={<PublishStreamReleaseDate />} />
            )}

            <Card
              background
              title={__('Thumbnail')}
              body={
                <div className="publish-row">
                  <React.Suspense fallback={null}>
                    <SelectThumbnail />
                  </React.Suspense>
                </div>
              }
              {...({ livestreamData } as any)}
            />

            <h2 className="card__title" style={{ marginTop: 'var(--spacing-l)' }}>
              {__('Tags')}
            </h2>

            <TagsSelect
              suggestMature={!SIMPLE_SITE}
              disableAutoFocus
              hideHeader
              label={__('Selected Tags')}
              excludedControlTags={null}
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
                updatePublishForm({
                  tags: [...tags, ...validatedTags],
                });
              }}
              onRemove={(clickedTag) => {
                const newTags = tags.slice().filter((tag) => tag.name !== clickedTag.name);
                updatePublishForm({
                  tags: newTags,
                });
              }}
              tagsChosen={tags}
            />

            {/* @ts-ignore -- isStillEditing is resolved internally */}
            <PublishProtectedContent claim={myClaimForUri} />

            {liveCreateType === 'choose_replay' && (
              <React.Suspense fallback={null}>
                <PublishPrice {...({ disabled: !!disabled } as any)} />
              </React.Suspense>
            )}

            <PublishAdditionalOptions
              isLivestream
              disabled={disabled}
              showSchedulingOptions={liveCreateType === 'new_placeholder' || liveCreateType === 'edit_placeholder'} // ^--- the name is wrong. should be "hide" instead
            />
          </div>
        )}
        <section>
          <div className="section__actions publish__actions">
            {/* @ts-ignore -- selectedChannelUrl is managed internally */}
            <ChannelSelector hideAnon disabled={isFormIncomplete} isPublishMenu />
            <Button button="primary" onClick={handlePublish} label={submitLabel} disabled={isFormIncomplete} />
          </div>
          <div className="help">
            {!formDisabled && !formValid ? (
              <PublishFormErrors title={title} waitForFile={waitingForFile} />
            ) : (
              <I18nMessage
                tokens={{
                  odysee_terms_of_service: (
                    <Button
                      button="link"
                      href="https://odysee.com/$/tos"
                      label={__('%site_name% Terms of Service', {
                        site_name: SITE_NAME,
                      })}
                    />
                  ),
                  odysee_community_guidelines: (
                    <Button
                      button="link"
                      href="https://help.odysee.tv/communityguidelines/"
                      navigateTarget="_blank"
                      label={__('Community Guidelines')}
                    />
                  ),
                }}
              >
                By continuing, you accept the %odysee_terms_of_service% and %odysee_community_guidelines%.
              </I18nMessage>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default LivestreamForm;
