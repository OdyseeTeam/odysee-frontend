import type { DoPublishDesktop } from 'redux/actions/publish';

import { SITE_NAME, SIMPLE_SITE } from 'config';
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
import PublishFilePicker from 'component/publish/upload/publishFilePicker';
import PublishTitleUrl from 'component/publish/shared/publishTitleUrl';
import PublishProtectedContent from 'component/publishProtectedContent';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import * as PUBLISH_MODES from 'constants/publish_types';
import Spinner from 'component/spinner';
import { BITRATE } from 'constants/publish';
import { SOURCE_NONE } from 'constants/publish_sources';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import PublishTemplateButton from 'component/publish/shared/publishTemplateButton';
import PublishWizard from 'component/publish/shared/publishWizard';
import { Menu, MenuButton, MenuList, MenuItem } from 'component/common/menu';
import PublishControlTags from 'component/publish/shared/publishControlTags/view';
import PublishSummary from 'component/publish/shared/publishSummary/view';
import PublishTagsPicker from 'component/publish/shared/publishTagsPicker/view';
import * as ACTIONS from 'constants/action_types';
import { doAddPipelineItem, doUpdatePipelineItem } from 'redux/actions/publishPipeline';
import type { PipelineStage } from 'redux/actions/publishPipeline';
import { runConversion, runOptimization } from 'util/upload-conversion-pipeline';
import { enqueue, promote, release, dequeue } from 'util/pipeline-queue';
import { v4 as uuid } from 'uuid';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  doResetThumbnailStatus,
  doClearPublish,
  doUpdatePublishForm,
  doPublishDesktop,
  doPublishWithEarlyUpload,
} from 'redux/actions/publish';
import { doResolveUri, doCheckPublishNameAvailability } from 'redux/actions/claims';
import {
  selectPublishFormValues,
  selectIsStillEditing,
  selectMemberRestrictionStatus,
  selectPublishFormValue,
  selectMyClaimForUri,
  selectPrevFileSizeTooBig,
  selectActivePipelineItems,
} from 'redux/selectors/publish';
import type { PipelineItem } from 'redux/actions/publishPipeline';
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
import { doFetchCreatorSettings } from 'redux/actions/comments';

const loadSelectThumbnail = () => import('component/selectThumbnail' /* webpackChunkName: "selectThumbnail" */);
const SelectThumbnail: React.LazyExoticComponent<React.ComponentType<any>> = lazyImport(loadSelectThumbnail);
const loadPublishPrice = () => import('component/publish/shared/publishPrice' /* webpackChunkName: "publish" */);
const PublishPrice: React.LazyExoticComponent<React.ComponentType<any>> = lazyImport(loadPublishPrice);

let previewOrderCounter = 0;

type Props = {
  disabled: boolean;
};

function UploadForm(props: Props) {
  const { disabled = false } = props;
  const dispatch = useAppDispatch();

  const publishFormValues = useAppSelector(selectPublishFormValues);
  const myClaimForUri = useAppSelector((state) => selectMyClaimForUri(state, true));
  const permanentUrl = (myClaimForUri && myClaimForUri.permanent_url) || '';
  const isPostClaim = useAppSelector(
    (state) => makeSelectFileRenderModeForUri(permanentUrl)(state) === RENDER_MODES.MARKDOWN
  );
  const isLivestreamClaim = useAppSelector((state) => selectIsStreamPlaceholderForUri(state, permanentUrl));
  const isStillEditing = useAppSelector(selectIsStillEditing);
  const filePath = useAppSelector((state) => selectPublishFormValue(state, 'filePath'));
  const fileSizeTooBig = useAppSelector((state) => selectPublishFormValue(state, 'fileSizeTooBig'));
  const prevFileSizeTooBig = useAppSelector(selectPrevFileSizeTooBig);
  const remoteUrl = useAppSelector((state) => selectPublishFormValue(state, 'remoteFileUrl'));
  const publishSuccess = useAppSelector((state) => selectPublishFormValue(state, 'publishSuccess'));
  const memberRestrictionStatus = useAppSelector(selectMemberRestrictionStatus);
  const totalRewardValue = useAppSelector(selectUnclaimedRewardValue);
  const modal = useAppSelector(selectModal);
  const enablePublishPreview = useAppSelector((state) => selectClientSetting(state, SETTINGS.ENABLE_PUBLISH_PREVIEW));
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  const incognito = useAppSelector(selectIncognito);
  const isClaimingInitialRewards = useAppSelector(selectIsClaimingInitialRewards);
  const hasClaimedInitialRewards = useAppSelector(selectHasClaimedInitialRewards);

  const {
    tags,
    bid,
    bidError,
    editingURI,
    title,
    thumbnail,
    thumbnailError,
    uploadThumbnailStatus,
    description,
    fileText,
    fileBitrate,
    fileFormat,
    name,
    channelId,
    publishing,
    publishError,
    releaseTimeError,
  } = publishFormValues;

  const updatePublishForm = React.useCallback((v: UpdatePublishState) => dispatch(doUpdatePublishForm(v)), [dispatch]);
  const clearPublish = React.useCallback(() => dispatch(doClearPublish()), [dispatch]);
  const resolveUri = React.useCallback((uri: string) => dispatch(doResolveUri(uri)), [dispatch]);
  const publish: DoPublishDesktop = React.useCallback(
    (fp, preview) => dispatch(doPublishDesktop(fp, preview)),
    [dispatch]
  );
  const resetThumbnailStatus = React.useCallback(() => dispatch(doResetThumbnailStatus()), [dispatch]);
  const checkAvailability = React.useCallback((n: string) => dispatch(doCheckPublishNameAvailability(n)), [dispatch]);
  const claimInitialRewards = React.useCallback(() => dispatch(doClaimInitialRewards()), [dispatch]);
  const fetchCreatorSettings = React.useCallback((cid: string) => dispatch(doFetchCreatorSettings(cid)), [dispatch]);

  const pipelineItems = useAppSelector(selectActivePipelineItems) as PipelineItem[];
  const inEditMode = Boolean(editingURI);
  const mode: string = PUBLISH_MODES.FILE;
  const [prevName, setPrevName] = React.useState<string | false>(false);
  const [fileEdited, setFileEdited] = React.useState(false);
  const [prevFileText, setPrevFileText] = React.useState('');
  const [waitForFile, setWaitForFile] = useState(false);
  const activeStep = useAppSelector((state) => state.publish.activeStep ?? 0);
  const setActiveStep = (step: number) => updatePublishForm({ activeStep: step } as any);
  const TAGS_LIMIT = 5;
  const missingRequiredFile = mode === PUBLISH_MODES.FILE && !editingURI && !filePath && !remoteUrl;
  const emptyPostError = mode === PUBLISH_MODES.POST && (!fileText || fileText.trim() === '');
  const formDisabled = emptyPostError || publishing;
  const isInProgress = filePath || editingURI || name || title;
  const activeChannelName = activeChannelClaim && activeChannelClaim.name;
  const activeChannelId = activeChannelClaim && activeChannelClaim.claim_id;
  const fileMimeType =
    myClaimForUri && myClaimForUri.value && myClaimForUri.value.source
      ? myClaimForUri.value.source.media_type
      : undefined;
  const nameEdited = isStillEditing && name !== prevName;
  const thumbnailUploaded = uploadThumbnailStatus === THUMBNAIL_STATUSES.COMPLETE && thumbnail;
  const waitingForFile = waitForFile && !remoteUrl && !filePath;
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
      : editingURI && !filePath
        ? isStillEditing && formValidLessFile && !waitingForFile
        : formValidLessFile);
  const [previewing, setPreviewing] = React.useState(false);
  const isClear = !filePath && !title && !name && !description && !thumbnail;

  const [fileSource, setFileSource] = useState();
  const changeFileSource = (state) => setFileSource(state);
  const [showSchedulingOptions, setShowSchedulingOptions] = useState(false);

  // -- Effects (unchanged) --
  useEffect(() => {
    if (!hasClaimedInitialRewards) {
      claimInitialRewards();
    }
  }, [hasClaimedInitialRewards, claimInitialRewards]);

  useEffect(() => {
    const templateChannelId = channelId || activeChannelId;
    if (templateChannelId && !inEditMode) {
      fetchCreatorSettings(templateChannelId);
    }
  }, [channelId, activeChannelId, inEditMode, fetchCreatorSettings]);

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
  }, [publishError]);

  useEffect(() => {
    if (publishing || publishSuccess) {
      clearPublish();
    }
  }, [clearPublish]);

  useEffect(() => {
    if (!thumbnail) {
      resetThumbnailStatus();
    }
  }, [thumbnail, resetThumbnailStatus]);

  useEffect(() => {
    if (isStillEditing && (!prevName || prevName.trim() === '')) {
      if (name !== prevName) {
        setPrevName(name);
      }
    }
  }, [name, prevName, setPrevName, isStillEditing]);

  useEffect(() => {
    if (!fileEdited && fileText !== prevFileText && fileText !== '') {
      setFileEdited(true);
    } else if (fileEdited && fileText === prevFileText) {
      setFileEdited(false);
    }
  }, [fileText, prevFileText, fileEdited]);

  useEffect(() => {
    let uri;
    try {
      uri = name && buildURI({ streamName: name, activeChannelName } as LbryUrlObj, true);
    } catch (e) {}

    if (activeChannelName && name) {
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

  useEffect(() => {
    setShowSchedulingOptions(fileSource === SOURCE_NONE);
  }, [fileSource]);

  useEffect(() => {
    void loadSelectThumbnail();
    void loadPublishPrice();
  }, []);

  // -- Handlers --
  async function handlePublish() {
    let outputFile = filePath;
    let runPublish = false;

    if (mode === PUBLISH_MODES.POST && !emptyPostError) {
      if (fileEdited || nameEdited) {
        const fileName = name || title;
        if (fileName) {
          outputFile = new File([fileText], `${fileName}.md`, { type: 'text/markdown' });
          updatePublishForm({ filePath: outputFile });
          runPublish = true;
        }
      } else {
        runPublish = true;
      }
    }

    if (mode === PUBLISH_MODES.FILE) {
      runPublish = true;
    }

    if (runPublish) {
      const pipelineItems = window.store?.getState?.()?.publish?.pipelineItems || {};
      const activePipelineItem = Object.values(pipelineItems).find(
        (item: any) => item.formId === pipelineIdForForm.current && item.stage !== 'error' && item.stage !== 'published'
      ) as any;
      const pipelineId = activePipelineItem?.id || pipelineItemIdRef.current;

      dispatch(doUpdatePipelineItem(pipelineId, { stage: 'processing', progress: 0 }));

      const uploadHandle = (window as any).__earlyUploadHandles?.[pipelineId];
      const uploadPromise = earlyUploadPromiseRef.current || uploadHandle?.promise;

      if (uploadPromise && mode === PUBLISH_MODES.FILE) {
        dispatch(doPublishWithEarlyUpload(uploadPromise, pipelineId));
      } else {
        publish(outputFile, false);
      }
    }
  }

  // -- Submit label --
  let submitLabel;
  if (isClaimingInitialRewards) {
    submitLabel = __('Claiming credits...');
  } else if (publishing) {
    submitLabel = __('Publishing...');
  } else if (previewing) {
    submitLabel = <Spinner type="small" />;
  } else {
    submitLabel = __('Publish');
  }

  const isFormIncomplete =
    isClaimingInitialRewards ||
    missingRequiredFile ||
    formDisabled ||
    !formValid ||
    uploadThumbnailStatus === THUMBNAIL_STATUSES.IN_PROGRESS ||
    previewing;

  // -- Form persistence --
  const activeFormId = useAppSelector((state) => selectPublishFormValue(state, 'activeFormId'));
  const pipelineIdForForm = React.useRef(activeFormId && activeFormId !== '__new__' ? activeFormId : uuid());
  const previewOrderRef = React.useRef(++previewOrderCounter);

  const savedStep = useAppSelector((state) => state.publish.activeStep);

  const applyActiveChannel = React.useCallback(() => {
    if (incognito) {
      updatePublishForm({ channel: undefined, channelId: undefined });
    } else if (activeChannelName) {
      updatePublishForm({ channel: activeChannelName, channelId: activeChannelId });
    }
  }, [activeChannelName, activeChannelId, incognito, updatePublishForm]);

  React.useLayoutEffect(() => {
    dispatch({ type: 'PUBLISH_RESTORE_FORM', data: { id: pipelineIdForForm.current } });
    dispatch({ type: 'PUBLISH_SET_ACTIVE_FORM', data: { id: pipelineIdForForm.current } });
    const s = window.store?.getState?.()?.publish;
    setActiveStep(s?.activeStep ?? 0);
    if (!s?.bid) updatePublishForm({ bid: 0.001 });
    if (!s?.channel || s.channel === 'anonymous') applyActiveChannel();
    return () => {
      const currentState = window.store?.getState?.()?.publish;
      if (currentState?.activeFormId === pipelineIdForForm.current) {
        dispatch({ type: 'PUBLISH_SAVE_FORM', data: { id: pipelineIdForForm.current } });
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useLayoutEffect(() => {
    if (activeFormId && activeFormId !== pipelineIdForForm.current) {
      dispatch({ type: 'PUBLISH_SAVE_FORM', data: { id: pipelineIdForForm.current } });
      const isNew = activeFormId === '__new__';
      const newId = isNew ? uuid() : activeFormId;
      pipelineIdForForm.current = newId;
      dispatch({ type: 'PUBLISH_RESTORE_FORM', data: { id: newId } });
      dispatch({ type: 'PUBLISH_SET_ACTIVE_FORM', data: { id: newId } });
      const s = window.store?.getState?.()?.publish;
      if (s) setActiveStep(s.activeStep ?? 0);
      if (isNew) applyActiveChannel();
    }
  }, [activeFormId]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Pipeline --
  const pipelineItemIdRef = React.useRef<string>(uuid());
  const pipelineHandleRef = React.useRef<{ pause: () => Promise<void>; resume: () => void } | null>(null);
  const pipelinePausedRef = React.useRef(false);
  const pipelineResumeRef = React.useRef<(() => void) | null>(null);
  const pipelineInFlightRef = React.useRef(false);
  const preparedSourceFileRef = React.useRef<File | null>(null);
  const preparedOutputFileRef = React.useRef<File | null>(null);
  const earlyUploadPromiseRef = React.useRef<Promise<{ tusUrl: string }> | null>(null);
  const earlyUploadAbortRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    if (!(window as any).__pipelineHandles) (window as any).__pipelineHandles = {};
    if (!(window as any).__earlyUploadHandles) (window as any).__earlyUploadHandles = {};
  }, []);

  React.useEffect(() => {
    if (!(filePath instanceof File)) {
      preparedSourceFileRef.current = null;
      preparedOutputFileRef.current = null;
      pipelineInFlightRef.current = false;
      pipelineItemIdRef.current = uuid();
      return;
    }

    const isKnownPipelineFile =
      filePath === preparedSourceFileRef.current || filePath === preparedOutputFileRef.current;

    if (!isKnownPipelineFile && !pipelineInFlightRef.current) {
      preparedSourceFileRef.current = null;
      preparedOutputFileRef.current = null;
      pipelineItemIdRef.current = uuid();
      if (earlyUploadAbortRef.current) {
        earlyUploadAbortRef.current();
        earlyUploadAbortRef.current = null;
        earlyUploadPromiseRef.current = null;
      }
    }
  }, [filePath]);

  function beginEarlyUpload(file: File, pipelineId: string, progressScale?: (p: number) => number) {
    dispatch(doUpdatePipelineItem(pipelineId, { stage: 'uploading', progress: progressScale ? progressScale(0) : 0 }));
    import('web/setup/publish-v4-early-upload').then(({ startEarlyUpload }) => {
      const handle = startEarlyUpload(file, {
        onProgress: (percent, bytesPerSecond) => {
          const updates: any = { progress: progressScale ? progressScale(percent) : Math.round(percent) };
          if (bytesPerSecond > 0) updates.uploadSpeed = bytesPerSecond;
          dispatch(doUpdatePipelineItem(pipelineId, updates));
        },
        onError: () => {
          release(pipelineId, 'uploading');
          dispatch(doUpdatePipelineItem(pipelineId, { stage: 'error', progress: 0 }));
        },
      });
      earlyUploadPromiseRef.current = handle.promise;
      earlyUploadAbortRef.current = handle.abort;
      if (!(window as any).__earlyUploadHandles) (window as any).__earlyUploadHandles = {};
      (window as any).__earlyUploadHandles[pipelineId] = handle;
      handle.promise
        .then(() => {
          release(pipelineId, 'uploading');
          dispatch(doUpdatePipelineItem(pipelineId, { stage: 'ready', progress: 100 }));
        })
        .catch(() => {});
    });
  }

  function waitIfPaused(): Promise<void> {
    if (!pipelinePausedRef.current) return Promise.resolve();
    return new Promise((resolve) => {
      pipelineResumeRef.current = resolve;
    });
  }

  function registerPipelineHandle(pipelineId: string) {
    if (!(window as any).__pipelineHandles) (window as any).__pipelineHandles = {};
    (window as any).__pipelineHandles[pipelineId] = {
      handleRef: pipelineHandleRef,
      pause: () => {
        pipelinePausedRef.current = true;
      },
      resume: () => {
        pipelinePausedRef.current = false;
        if (pipelineResumeRef.current) {
          pipelineResumeRef.current();
          pipelineResumeRef.current = null;
        }
      },
    };
  }

  async function startPipeline(file: File, pipelineId: string, needsConvert: boolean, needsOptimize: boolean) {
    registerPipelineHandle(pipelineId);
    pipelineInFlightRef.current = true;
    preparedSourceFileRef.current = file;
    preparedOutputFileRef.current = null;

    const stepCount = (needsConvert ? 1 : 0) + (needsOptimize ? 1 : 0) + 1;
    let stepIndex = 0;
    const scaleProgress = (stepProgress: number) => Math.round((stepIndex * 100 + stepProgress) / stepCount);

    try {
      let currentFile = file;
      let currentStage: PipelineStage = needsConvert ? 'converting' : 'optimizing';

      if (needsConvert) {
        dispatch(doUpdatePipelineItem(pipelineId, { stage: 'converting', progress: scaleProgress(0) }));
        const handle = runConversion(currentFile, (progress) => {
          dispatch(doUpdatePipelineItem(pipelineId, { progress: scaleProgress(progress) }));
        });
        pipelineHandleRef.current = handle;
        const result = await handle.promise;
        await waitIfPaused();
        currentFile = result.file;
        updatePublishForm({ filePath: currentFile });
        stepIndex++;
      }

      if (needsOptimize) {
        const prevStage = currentStage;
        currentStage = 'optimizing';
        promote(pipelineId, prevStage, 'optimizing');
        dispatch(doUpdatePipelineItem(pipelineId, { stage: 'optimizing', progress: scaleProgress(0) }));
        const handle = runOptimization(currentFile, 5_000_000, (progress) => {
          dispatch(doUpdatePipelineItem(pipelineId, { progress: scaleProgress(progress) }));
        });
        pipelineHandleRef.current = handle;
        const result = await handle.promise;
        await waitIfPaused();
        currentFile = result.file;
        updatePublishForm({ filePath: currentFile });
        stepIndex++;
      }

      pipelineHandleRef.current = null;
      pipelineInFlightRef.current = false;
      preparedOutputFileRef.current = currentFile;
      promote(pipelineId, currentStage, 'uploading');
      dispatch(doUpdatePipelineItem(pipelineId, { stage: 'uploading', progress: scaleProgress(0) }));
      beginEarlyUpload(currentFile, pipelineId, scaleProgress);
    } catch (e) {
      console.error('[Pipeline] Error:', e); // eslint-disable-line no-console
      pipelineHandleRef.current = null;
      pipelineInFlightRef.current = false;
      preparedSourceFileRef.current = null;
      preparedOutputFileRef.current = null;
      pipelineItemIdRef.current = uuid();
      release(pipelineId);
      dispatch(doUpdatePipelineItem(pipelineId, { stage: 'error', progress: 0 }));
    }
  }

  function handleStepChange(newStep: number, source: 'next' | 'back' | 'step') {
    if (activeStep === 0 && newStep === 1 && source === 'next' && filePath && filePath instanceof File) {
      const filename = filePath.name;
      const needsConvert = fileFormat && fileFormat.toLowerCase() === 'mkv';
      const needsOptimize = fileBitrate > BITRATE.RECOMMENDED;
      const pipelineAlreadyHandled =
        pipelineInFlightRef.current ||
        filePath === preparedSourceFileRef.current ||
        filePath === preparedOutputFileRef.current;

      if ((needsConvert || needsOptimize) && !pipelineAlreadyHandled) {
        const steps: PipelineStage[] = [];
        if (needsConvert) steps.push('converting');
        if (needsOptimize) steps.push('optimizing');
        steps.push('uploading');

        const itemId = pipelineItemIdRef.current;
        const file = filePath;
        const firstStage = steps[0];

        dispatch(
          doAddPipelineItem({
            id: itemId,
            filename,
            stage: firstStage,
            progress: 0,
            steps,
            fileSize: file.size,
            formId: pipelineIdForForm.current,
          })
        );

        const started = enqueue(itemId, firstStage, () => {
          startPipeline(file, itemId, needsConvert, needsOptimize);
        });
        if (!started) {
          dispatch(doUpdatePipelineItem(itemId, { stage: 'queued' }));
        }
      } else if (!pipelineAlreadyHandled && !earlyUploadPromiseRef.current) {
        const itemId = pipelineItemIdRef.current;
        const file = filePath;

        dispatch(
          doAddPipelineItem({
            id: itemId,
            filename,
            stage: 'uploading',
            progress: 0,
            steps: ['uploading'],
            fileSize: file.size,
            formId: pipelineIdForForm.current,
          })
        );

        const started = enqueue(itemId, 'uploading', () => {
          beginEarlyUpload(file, itemId);
        });
        if (!started) {
          dispatch(doUpdatePipelineItem(itemId, { stage: 'queued' }));
        }
      }
    }
    setActiveStep(newStep);
    updatePublishForm({ activeStep: newStep } as any);
  }

  // -- Wizard steps --
  const isMkvFormat = fileFormat && fileFormat.toLowerCase() === 'mkv';

  const wizardSteps = [
    {
      label: 'File',
      validate: () => !missingRequiredFile,
    },
    {
      label: 'Content',
      validate: () =>
        !!title &&
        !!name &&
        isNameValid(name) &&
        !!thumbnail &&
        !isOverwritingExistingClaim &&
        !(thumbnailError && !thumbnailUploaded) &&
        uploadThumbnailStatus !== THUMBNAIL_STATUSES.IN_PROGRESS,
    },
    {
      label: 'Visibility',
    },
    {
      label: 'Publish',
    },
  ];

  if (publishing || publishFormValues.type !== 'file') {
    return (
      <div className="main--empty">
        <Spinner delayed />
      </div>
    );
  }

  return (
    <div className="card-stack">
      <h1 className="page__title page__title--margin">
        <Icon icon={ICONS.PUBLISH} />
        {(() => {
          const currentFilename =
            filePath instanceof File ? filePath.name : typeof filePath === 'string' ? filePath : null;
          const unpublishedItems = pipelineItems.filter((item) => item.stage !== 'published' && item.stage !== 'error');
          if (inEditMode) {
            return <label>{__('Edit Upload')}</label>;
          }
          if (!currentFilename && unpublishedItems.length === 0) {
            return <label>{__('Upload a file')}</label>;
          }
          const displayName = currentFilename || __('New file');
          if (unpublishedItems.length === 0 || (unpublishedItems.length <= 1 && currentFilename)) {
            return (
              <label>
                {__('Upload')} {displayName}
              </label>
            );
          }
          return (
            <label className="publish-wizard__title-label">
              {__('Upload')}
              <Menu>
                <MenuButton className="publish-wizard__title-select">
                  {displayName}
                  <Icon icon={ICONS.DOWN} size={10} />
                </MenuButton>
                <MenuList className="menu__list publish-wizard__title-menu">
                  {unpublishedItems.map((item) => (
                    <MenuItem
                      key={item.id}
                      className="menu__link"
                      onSelect={() => {
                        dispatch({ type: 'PUBLISH_SET_ACTIVE_FORM', data: { id: item.formId || item.id } });
                      }}
                    >
                      {item.filename}
                    </MenuItem>
                  ))}
                  <hr className="publish-wizard__title-menu-separator" />
                  <MenuItem
                    className="menu__link"
                    onSelect={() => {
                      dispatch({ type: 'PUBLISH_SET_ACTIVE_FORM', data: { id: '__new__' } });
                    }}
                  >
                    <Icon icon={ICONS.ADD} size={14} />
                    {__('Upload More')}
                  </MenuItem>
                </MenuList>
              </Menu>
            </label>
          );
        })()}
        <span className="publish-wizard__title-actions">
          {!isClear && (
            <Button onClick={() => clearPublish()} icon={ICONS.REFRESH} button="primary" label={__('Clear')} />
          )}
          {!inEditMode && <PublishTemplateButton />}
        </span>
      </h1>

      <PublishWizard
        steps={wizardSteps}
        activeStep={activeStep}
        onStepChange={handleStepChange}
        onPublish={handlePublish}
        publishLabel={submitLabel}
        publishDisabled={isFormIncomplete}
        publishing={publishing || previewing}
        publishFooterLeft={<ChannelSelector disabled={publishing} isPublishMenu />}
      >
        {/* Step 1: File */}
        <div className="card-stack">
          <Card
            background
            body={
              <div className="publish-row">
                <PublishFilePicker disabled={disabled || publishing} />
              </div>
            }
          />
        </div>

        {/* Step 2: Details */}
        <div className="card-stack">
          <Card
            background
            body={
              <div className="publish-details">
                <PublishTitleUrl disabled={disabled || publishing} />
                <div>
                  <h3 className="publish-details__title">{__('Description')}</h3>
                  <PublishDescription disabled={disabled || publishing} />
                </div>
                <div>
                  <h3 className="publish-details__title">{__('Thumbnail')}</h3>
                  <SelectThumbnail />
                </div>
                <div>
                  <h3 className="publish-details__title">{__('Tags')}</h3>
                  <PublishTagsPicker
                    tags={tags}
                    limitSelect={TAGS_LIMIT}
                    onAdd={(newTags) => {
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
                  />
                </div>
                <PublishAdditionalOptions
                  disabled={formDisabled}
                  showSchedulingOptions={showSchedulingOptions}
                  defaultExpand={false}
                />
              </div>
            }
          />
        </div>

        {/* Step 3: Visibility */}
        <div className="card-stack">
          <Card
            background
            body={
              <div className="publish-details">
                <PublishVisibility />
                <PublishProtectedContent claim={myClaimForUri} />
                <PublishPrice disabled={formDisabled} />
                <PublishControlTags
                  tags={tags}
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
                />
              </div>
            }
          />
        </div>

        {/* Step 4: Publish */}
        <div className="card-stack">
          <Card
            background
            body={
              <div className="publish-details publish-details--publish">
                <PublishSummary />

                {showSchedulingOptions && <PublishStreamReleaseDate />}

                <div>
                  {!formDisabled && (!formValid || missingRequiredFile) && (
                    <PublishFormErrors
                      title={title}
                      mode={mode}
                      waitForFile={waitingForFile}
                      missingRequiredFile={missingRequiredFile}
                    />
                  )}
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
                            target="_blank"
                            label={__('Community Guidelines')}
                          />
                        ),
                      }}
                    >
                      By continuing, you accept the %odysee_terms_of_service% and %odysee_community_guidelines%.
                    </I18nMessage>
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </PublishWizard>
    </div>
  );
}

export default UploadForm;
