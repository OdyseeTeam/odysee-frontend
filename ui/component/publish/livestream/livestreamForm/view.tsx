import type { DoPublishDesktop } from 'redux/actions/publish';

import { SITE_NAME } from 'config';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import classnames from 'classnames';
import Lbry from 'lbry';
import { buildURI, isURIValid, isNameValid } from 'util/lbryURI';
import * as THUMBNAIL_STATUSES from 'constants/thumbnail_upload_statuses';
import { BITRATE } from 'constants/publish';
import Button from 'component/button';
import ChannelSelector from 'component/channelSelector';
import PublishLivestream from 'component/publish/livestream/publishLivestream';
import PublishTitleUrl from 'component/publish/shared/publishTitleUrl';
import PublishDescription from 'component/publish/shared/publishDescription';
import PublishAdditionalOptions from 'component/publish/shared/publishAdditionalOptions';
import PublishFormErrors from 'component/publish/shared/publishFormErrors';
import PublishReleaseDate from 'component/publish/shared/publishReleaseDate';
import PublishVisibility from 'component/publish/shared/publishVisibility';
import PublishProtectedContent from 'component/publishProtectedContent';
import PublishControlTags from 'component/publish/shared/publishControlTags/view';
import PublishTagsPicker from 'component/publish/shared/publishTagsPicker/view';
import PublishSummary from 'component/publish/shared/publishSummary/view';
import PublishWizard from 'component/publish/shared/publishWizard';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import Spinner from 'component/spinner';
import Tooltip from 'component/common/tooltip';
import { toHex } from 'util/hex';
import { lazyImport } from 'util/lazyImport';
import Livestream from 'livestream';
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
import * as SETTINGS from 'constants/settings';
import { doClaimInitialRewards } from 'redux/actions/rewards';
import { selectIsClaimingInitialRewards, selectHasClaimedInitialRewards } from 'redux/selectors/rewards';
import { selectModal, selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectBalance } from 'redux/selectors/wallet';

const SelectThumbnail = lazyImport(() => import('component/selectThumbnail' /* webpackChunkName: "selectThumbnail" */));
const PublishPrice = lazyImport(
  () => import('component/publish/shared/publishPrice' /* webpackChunkName: "publish" */)
);

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

function normalizeReplayUrl(url) {
  if (!url) return '';
  if (url.startsWith('https://') || url.startsWith('http://')) return url;
  return `https://${url}`;
}

function LivestreamForm(props: Props) {
  const { setClearStatus, disabled: propDisabled = false } = props;
  const dispatch = useAppDispatch();
  const formValues = useAppSelector(selectPublishFormValues);
  const {
    tags,
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
    publishSuccess,
    publishError,
    liveCreateType = 'new_placeholder',
    liveEditType = 'use_replay',
  } = formValues;

  const myClaimForUri = useAppSelector((state) => selectMyClaimForUri(state, true));
  const permanentUrl = (myClaimForUri && myClaimForUri.permanent_url) || '';
  const isStillEditing = useAppSelector(selectIsStillEditing);
  const filePath = useAppSelector((state) => selectPublishFormValue(state, 'filePath'));
  const remoteFileUrl = useAppSelector((state) => selectPublishFormValue(state, 'remoteFileUrl'));
  const modal = useAppSelector(selectModal);
  const enablePublishPreview = useAppSelector((state) => selectClientSetting(state, SETTINGS.ENABLE_PUBLISH_PREVIEW));
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  const incognito = useAppSelector(selectIncognito);
  const isClaimingInitialRewards = useAppSelector(selectIsClaimingInitialRewards);
  const hasClaimedInitialRewards = useAppSelector(selectHasClaimedInitialRewards);
  const memberRestrictionStatus = useAppSelector(selectMemberRestrictionStatus);
  const balance = useAppSelector(selectBalance);
  const releaseTimeValue = useAppSelector((state) => selectPublishFormValue(state, 'releaseTime'));
  const isScheduled = Boolean(releaseTimeValue);

  const updatePublishForm = (value: UpdatePublishState) => dispatch(doUpdatePublishForm(value));
  const publish: DoPublishDesktop = (fp, preview) => dispatch(doPublishDesktop(fp, preview));

  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const createTypeShortcut = urlParams.get('s');
  const inEditMode = Boolean(editingURI);
  const activeChannelName = activeChannelClaim && activeChannelClaim.name;
  const activeChannelId = activeChannelClaim && activeChannelClaim.claim_id;

  const formIdRef = React.useRef('livestream-draft');

  useEffect(() => {
    const currentPublish = (window as any).store?.getState?.()?.publish;
    if (!currentPublish?.editingURI) {
      dispatch({ type: 'PUBLISH_RESTORE_FORM', data: { id: formIdRef.current } });
    }
    dispatch({ type: 'PUBLISH_SET_ACTIVE_FORM', data: { id: formIdRef.current } });
    if (!bid) updatePublishForm({ bid: 0.001 });
    return () => {
      const currentState = (window as any).store?.getState?.()?.publish;
      if (currentState?.activeFormId === formIdRef.current) {
        dispatch({ type: 'PUBLISH_SAVE_FORM', data: { id: formIdRef.current } });
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [activeStep, setActiveStep] = useState(0);
  const [prevName, setPrevName] = useState<string | false>(false);
  const [previewing, setPreviewing] = useState(false);
  const [isCheckingLivestreams, setCheckingLivestreams] = useState(false);
  const [livestreamData, setLivestreamData] = useState<LivestreamReplayItem[]>([]);
  const hasLivestreamData = livestreamData && Boolean(livestreamData.length);
  const TAGS_LIMIT = 5;

  const formDisabled = publishing;
  const thumbnailUploaded = uploadThumbnailStatus === THUMBNAIL_STATUSES.COMPLETE && thumbnail;
  const requiresReplayUrl =
    liveCreateType === 'choose_replay' || (liveCreateType === 'edit_placeholder' && liveEditType === 'use_replay');
  const requiresFile = liveCreateType === 'edit_placeholder' && liveEditType === 'upload_replay';
  const waitingForFile = !remoteFileUrl && !filePath && (requiresReplayUrl || requiresFile);

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
    : editingURI && !filePath
      ? isStillEditing && formValidLessFile && !waitingForFile
      : formValidLessFile;
  const hasSelectedReplay = React.useMemo(() => {
    if (!requiresReplayUrl || !remoteFileUrl || !hasLivestreamData) return false;
    return livestreamData.some((item) => normalizeReplayUrl(item?.data?.fileLocation) === remoteFileUrl);
  }, [hasLivestreamData, livestreamData, remoteFileUrl, requiresReplayUrl]);
  const isClear = !title && !name && !description && !thumbnail;
  const isFormIncomplete =
    isClaimingInitialRewards ||
    formDisabled ||
    !formValid ||
    uploadThumbnailStatus === THUMBNAIL_STATUSES.IN_PROGRESS ||
    (requiresReplayUrl && !hasSelectedReplay) ||
    (requiresFile && !filePath) ||
    previewing;

  useEffect(() => {
    if (setClearStatus) setClearStatus(isClear);
  }, [isClear, setClearStatus]);

  useEffect(() => {
    if (activeChannelName && activeChannelId) fetchLivestreams(activeChannelId, activeChannelName);
  }, [activeChannelName, activeChannelId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hasClaimedInitialRewards) dispatch(doClaimInitialRewards());
  }, [hasClaimedInitialRewards, dispatch]);

  useEffect(() => {
    if (!modal) {
      const timer = setTimeout(() => setPreviewing(false), 250);
      return () => clearTimeout(timer);
    }
  }, [modal]);

  useEffect(() => {
    if (publishError) {
      setPreviewing(false);
      updatePublishForm({ publishError: undefined });
    }
  }, [publishError]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (publishSuccess) updatePublishForm({ publishSuccess: false });
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!thumbnail) dispatch(doResetThumbnailStatus());
  }, [thumbnail, dispatch]);

  useEffect(() => {
    if (isStillEditing && (!prevName || (typeof prevName === 'string' && prevName.trim() === ''))) {
      if (name !== prevName) setPrevName(name);
    }
  }, [name, prevName, isStillEditing]);

  useEffect(() => {
    let uri: string | undefined;
    try {
      uri = name ? buildURI({ streamName: name, channelName: activeChannelName } as LbryUrlObj, true) : undefined;
    } catch {}
    if (activeChannelName && name) {
      try {
        const uriLessChannel = buildURI({ streamName: name }, true);
        dispatch(doResolveUri(uriLessChannel));
      } catch {}
    }
    const isValid = uri && isURIValid(uri);
    if (uri && isValid && name) {
      dispatch(doResolveUri(uri));
      dispatch(doCheckPublishNameAvailability(name));
      updatePublishForm({ uri });
    }
  }, [name, activeChannelName, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editingURI) dispatch(doResolveUri(editingURI));
  }, [editingURI, dispatch]);

  useEffect(() => {
    if (editingURI) {
      updatePublishForm({ liveCreateType: 'edit_placeholder' });
    } else if (createTypeShortcut === 'Replay') {
      updatePublishForm({ liveCreateType: 'choose_replay' });
    } else {
      updatePublishForm({ liveCreateType: 'new_placeholder' });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (incognito) updatePublishForm({ channel: undefined, channelId: undefined });
    else if (activeChannelName) updatePublishForm({ channel: activeChannelName, channelId: activeChannelId });
  }, [activeChannelName, activeChannelId, incognito]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchLivestreams(channelId?: string, channelName?: string) {
    if (!channelId || !channelName) {
      setCheckingLivestreams(false);
      return;
    }
    setCheckingLivestreams(true);
    try {
      const signedMessage = await Lbry.channel_sign({ channel_id: channelId, hexdata: toHex(channelName) });
      if (!signedMessage?.signature) {
        setCheckingLivestreams(false);
        return;
      }
      const data: Array<ReplayApiItem> =
        (await Livestream.call(
          'replays',
          'list',
          {
            channel_claim_id: String(channelId),
            signature: signedMessage.signature,
            signature_ts: signedMessage.signing_ts,
            channel_name: channelName,
          },
          'get'
        )) || [];
      const newData: Array<LivestreamReplayItem> = [];
      for (const dataItem of data) {
        const statusNorm = typeof dataItem.Status === 'string' ? dataItem.Status.toLowerCase() : '';
        if (statusNorm === 'inprogress' || statusNorm === 'ready') {
          newData.push({
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
          });
        }
      }
      setLivestreamData(newData);
    } catch (e) {
      console.warn('[LivestreamForm] Failed to fetch replays:', e); // eslint-disable-line no-console
    } finally {
      setCheckingLivestreams(false);
    }
  }

  function handlePublish() {
    if (enablePublishPreview) {
      setPreviewing(true);
      publish(filePath, true);
    } else {
      publish(filePath, false);
    }
  }

  let submitLabel: any;
  if (isClaimingInitialRewards) submitLabel = __('Claiming credits...');
  else if (publishing) submitLabel = isStillEditing || inEditMode ? __('Saving...') : __('Creating...');
  else if (previewing) submitLabel = <Spinner type="small" />;
  else submitLabel = isStillEditing || inEditMode ? __('Save') : __('Create');

  const isReplayMode = liveCreateType === 'choose_replay' || liveCreateType === 'edit_placeholder';
  const wizardSteps = isReplayMode
    ? [
        { label: 'Replay', validate: () => !!remoteFileUrl || !!filePath },
        { label: 'Details', validate: () => !!title && !!name && isNameValid(name) },
        { label: 'Visibility' },
        { label: inEditMode ? 'Update' : 'Publish' },
      ]
    : [
        { label: 'Details', validate: () => !!title && !!name && isNameValid(name) },
        { label: 'Visibility' },
        { label: inEditMode ? 'Update' : 'Publish' },
      ];

  const showDatePicker =
    liveCreateType === 'new_placeholder' || (liveCreateType === 'edit_placeholder' && liveEditType === 'update_only');

  const headerTitle =
    liveCreateType === 'choose_replay'
      ? __('Publish replay')
      : inEditMode
        ? __('Edit livestream')
        : __('Create livestream');

  return (
    <div className={classnames('card-stack', { disabled: balance < 0.01 })}>
      <div className="livestream-form__header">
        <h1 className="page__title">
          <Icon icon={ICONS.LIVESTREAM_MONOCHROME} />
          <label>{headerTitle}</label>
        </h1>
        {!isClear && (
          <Button
            onClick={() => dispatch(doClearPublish())}
            icon={ICONS.REFRESH}
            button="primary"
            label={__('Clear')}
            className="livestream-form__clear"
          />
        )}
      </div>

      <PublishWizard
        steps={wizardSteps}
        activeStep={activeStep}
        onStepChange={(step) => setActiveStep(step)}
        onPublish={handlePublish}
        publishLabel={submitLabel}
        publishDisabled={isFormIncomplete || !formValid}
        publishing={publishing || previewing}
        publishFooterLeft={<ChannelSelector hideAnon disabled={publishing} isPublishMenu />}
      >
        {/* Step: Replay (only in replay mode) */}
        {isReplayMode && (
          <div className="card-stack">
            <Card
              background
              body={
                <div className="publish-details">
                  <div className="publish-livestream-header">
                    <Tooltip title={__('Check for Replays')}>
                      <Button
                        button="secondary"
                        label={__('Check for Replays')}
                        disabled={isCheckingLivestreams}
                        icon={ICONS.REFRESH}
                        onClick={() => fetchLivestreams(activeChannelId, activeChannelName)}
                      />
                    </Tooltip>
                  </div>
                  <PublishLivestream
                    inEditMode={inEditMode}
                    uri={permanentUrl}
                    disabled={publishing}
                    livestreamData={livestreamData}
                    isCheckingLivestreams={isCheckingLivestreams}
                    hideTitleUrl
                  />
                </div>
              }
            />
          </div>
        )}

        {/* Step 1/2: Details */}
        <div className="card-stack">
          <Card
            background
            body={
              <div className="publish-details">
                <PublishTitleUrl disabled={publishing || propDisabled} />

                <div>
                  <h3 className="publish-details__title">{__('Description')}</h3>
                  <PublishDescription disabled={publishing || propDisabled} />
                </div>

                <div>
                  <h3 className="publish-details__title">{__('Thumbnail')}</h3>
                  <React.Suspense fallback={null}>
                    <SelectThumbnail />
                  </React.Suspense>
                </div>

                <div>
                  <h3 className="publish-details__title">{__('Tags')}</h3>
                  <PublishTagsPicker
                    tags={tags}
                    limitSelect={TAGS_LIMIT}
                    onAdd={(newTags) => {
                      const validated: Array<Tag> = [];
                      newTags.forEach((t: Tag) => {
                        if (!tags.some((tag: Tag) => tag.name === t.name)) validated.push(t);
                      });
                      updatePublishForm({ tags: [...tags, ...validated] });
                    }}
                    onRemove={(t: Tag) => updatePublishForm({ tags: tags.filter((tag: Tag) => tag.name !== t.name) })}
                  />
                </div>

                {showDatePicker && (
                  <div>
                    <h3 className="publish-details__title">{__('When do you want to go live?')}</h3>
                    <div className="publish-visibility__options publish-visibility__options--two">
                      <button
                        type="button"
                        className={classnames('publish-visibility__option', {
                          'publish-visibility__option--selected': !isScheduled,
                        })}
                        onClick={() => updatePublishForm({ releaseTime: undefined })}
                      >
                        <div className="publish-visibility__option-header">
                          <Icon icon={ICONS.GLOBE} size={18} />
                          <span>{__('Anytime')}</span>
                        </div>
                        <p className="publish-visibility__option-desc">
                          {__('Go live whenever you want without a scheduled time.')}
                        </p>
                      </button>

                      <button
                        type="button"
                        className={classnames('publish-visibility__option', {
                          'publish-visibility__option--selected': isScheduled,
                        })}
                        onClick={() => {
                          if (!isScheduled) {
                            const d = new Date();
                            d.setHours(d.getHours() + 1);
                            d.setMinutes(d.getMinutes() + 30);
                            d.setMinutes(0, 0, 0);
                            updatePublishForm({ releaseTime: Math.round(d.getTime() / 1000) });
                          }
                        }}
                      >
                        <div className="publish-visibility__option-header">
                          <Icon icon={ICONS.TIMERCHECK} size={18} />
                          <span>{__('Scheduled')}</span>
                        </div>
                        <p className="publish-visibility__option-desc">
                          {__('Set a specific time when you will go live.')}
                        </p>
                        {isScheduled && (
                          <div className="publish-visibility__scheduled" onClick={(e) => e.stopPropagation()}>
                            <PublishReleaseDate />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <PublishAdditionalOptions
                  isLivestream
                  disabled={formDisabled || propDisabled}
                  showSchedulingOptions={showDatePicker}
                  defaultExpand={false}
                />
              </div>
            }
          />
        </div>

        {/* Step 2: Visibility */}
        <div className="card-stack">
          <Card
            background
            body={
              <div className="publish-details">
                <PublishVisibility />
                {/* @ts-ignore -- isStillEditing is resolved internally */}
                <PublishProtectedContent claim={myClaimForUri} />
                {liveCreateType === 'choose_replay' && (
                  <React.Suspense fallback={null}>
                    <PublishPrice {...({ disabled: formDisabled } as any)} />
                  </React.Suspense>
                )}
                <PublishControlTags
                  tags={tags}
                  onSelect={(newTags) => {
                    const validated: Array<Tag> = [];
                    newTags.forEach((t: Tag) => {
                      if (!tags.some((tag: Tag) => tag.name === t.name)) validated.push(t);
                    });
                    updatePublishForm({ tags: [...tags, ...validated] });
                  }}
                  onRemove={(t: Tag) => updatePublishForm({ tags: tags.filter((tag: Tag) => tag.name !== t.name) })}
                />
              </div>
            }
          />
        </div>

        {/* Step 3: Publish */}
        <div className="card-stack">
          <Card
            background
            body={
              <div className="publish-details">
                <PublishSummary />
                {!formDisabled && !formValid ? (
                  <PublishFormErrors title={title} waitForFile={waitingForFile} />
                ) : (
                  <div className="help">
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
                            navigateTarget="_blank"
                            label={__('Community Guidelines')}
                          />
                        ),
                      }}
                    >
                      By continuing, you accept the %odysee_terms_of_service% and %odysee_community_guidelines%.
                    </I18nMessage>
                  </div>
                )}
              </div>
            }
          />
        </div>
      </PublishWizard>
    </div>
  );
}

export default LivestreamForm;
