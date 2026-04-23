import type { DoPublishDesktop } from 'redux/actions/publish';

import { SITE_NAME } from 'config';
import { v4 as uuid } from 'uuid';
import React, { useEffect, useState } from 'react';
import { buildURI, isURIValid, isNameValid } from 'util/lbryURI';
import { lazyImport } from 'util/lazyImport';
import * as THUMBNAIL_STATUSES from 'constants/thumbnail_upload_statuses';
import Button from 'component/button';
import ChannelSelector from 'component/channelSelector';
import PublishAdditionalOptions from 'component/publish/shared/publishAdditionalOptions';
import PublishFormErrors from 'component/publish/shared/publishFormErrors';
import PublishVisibility from 'component/publish/shared/publishVisibility';
import PublishPost from 'component/publish/post/publishPost';
import PublishProtectedContent from 'component/publishProtectedContent';
import PublishControlTags from 'component/publish/shared/publishControlTags/view';
import PublishTagsPicker from 'component/publish/shared/publishTagsPicker/view';
import PublishSummary from 'component/publish/shared/publishSummary/view';
import PublishWizard from 'component/publish/shared/publishWizard';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import * as PUBLISH_MODES from 'constants/publish_types';
import Spinner from 'component/spinner';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
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

const SelectThumbnail = lazyImport(() => import('component/selectThumbnail'));
const PublishPrice = lazyImport(() => import('component/publish/shared/publishPrice'));
const PublishStreamReleaseDate = lazyImport(() => import('component/publish/shared/publishStreamReleaseDate'));

type Props = {
  disabled: boolean;
};

function PostForm(props: Props) {
  const { disabled = false } = props;
  const dispatch = useAppDispatch();
  const formValues = useAppSelector(selectPublishFormValues);
  const {
    tags,
    fileText,
    bid,
    bidError,
    editingURI,
    title,
    thumbnail,
    thumbnailError,
    uploadThumbnailStatus,
    releaseTimeError,
    name,
    publishing,
    publishSuccess,
    publishError,
  } = formValues;

  const myClaimForUri = useAppSelector((state) => selectMyClaimForUri(state, true));
  const permanentUrl = (myClaimForUri && myClaimForUri.permanent_url) || '';
  const isStillEditing = useAppSelector(selectIsStillEditing);
  const filePath = useAppSelector((state) => selectPublishFormValue(state, 'filePath'));
  const modal = useAppSelector(selectModal);
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  const incognito = useAppSelector(selectIncognito);
  const isClaimingInitialRewards = useAppSelector(selectIsClaimingInitialRewards);
  const hasClaimedInitialRewards = useAppSelector(selectHasClaimedInitialRewards);
  const memberRestrictionStatus = useAppSelector(selectMemberRestrictionStatus);

  const updatePublishForm = (value: UpdatePublishState) => dispatch(doUpdatePublishForm(value));
  const publish: DoPublishDesktop = (fp, preview) => dispatch(doPublishDesktop(fp, preview));

  // -- Form persistence --
  const formIdRef = React.useRef('post-draft');

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

  const inEditMode = Boolean(editingURI);
  const mode = PUBLISH_MODES.POST;
  const [prevName, setPrevName] = useState<string | false>(false);
  const [fileEdited, setFileEdited] = useState(false);
  const [prevFileText, setPrevFileText] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const TAGS_LIMIT = 5;
  const emptyPostError = !fileText || fileText.trim() === '';
  const formDisabled = emptyPostError || publishing;
  const activeChannelName = activeChannelClaim && activeChannelClaim.name;
  const activeChannelId = activeChannelClaim && activeChannelClaim.claim_id;
  const nameEdited = isStillEditing && name !== prevName;
  const thumbnailUploaded = uploadThumbnailStatus === THUMBNAIL_STATUSES.COMPLETE && thumbnail;
  const formValidLessFile =
    (!memberRestrictionStatus.isApplicable || memberRestrictionStatus.isSelectionValid) &&
    name &&
    isNameValid(name) &&
    title &&
    bid &&
    thumbnail &&
    !bidError &&
    !releaseTimeError &&
    !emptyPostError &&
    !(thumbnailError && !thumbnailUploaded) &&
    !(uploadThumbnailStatus === THUMBNAIL_STATUSES.IN_PROGRESS);
  const isOverwritingExistingClaim = !editingURI && myClaimForUri;
  const formValid = isOverwritingExistingClaim
    ? false
    : editingURI && !filePath
      ? isStillEditing && formValidLessFile
      : formValidLessFile;
  const [previewing, setPreviewing] = useState(false);
  const formTitle = !editingURI ? __('Post an article') : __('Edit post');
  const isClear = !title && !name && !thumbnail;
  const isFormIncomplete =
    isClaimingInitialRewards || formDisabled || uploadThumbnailStatus === THUMBNAIL_STATUSES.IN_PROGRESS || previewing;
  const [showSchedulingOptions, setShowSchedulingOptions] = useState(false);

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
  }, [publishError]);

  useEffect(() => {
    if (publishSuccess) updatePublishForm({ publishSuccess: false });
  }, [dispatch]);

  useEffect(() => {
    if (!thumbnail) dispatch(doResetThumbnailStatus());
  }, [thumbnail, dispatch]);

  useEffect(() => {
    if (isStillEditing && (!prevName || prevName.trim() === '')) {
      if (name !== prevName) setPrevName(name);
    }
  }, [name, prevName, isStillEditing]);

  useEffect(() => {
    if (!fileEdited && fileText !== prevFileText && fileText !== '') setFileEdited(true);
    else if (fileEdited && fileText === prevFileText) setFileEdited(false);
  }, [fileText, prevFileText, fileEdited]);

  useEffect(() => {
    let uri;
    try {
      uri = name && buildURI({ streamName: name, activeChannelName } as LbryUrlObj, true);
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
  }, [name, activeChannelName, dispatch]);

  useEffect(() => {
    if (editingURI) dispatch(doResolveUri(editingURI));
  }, [editingURI, dispatch]);

  useEffect(() => {
    if (incognito) updatePublishForm({ channel: undefined, channelId: undefined });
    else if (activeChannelName) updatePublishForm({ channel: activeChannelName, channelId: activeChannelId });
  }, [activeChannelName, activeChannelId, incognito]);

  useEffect(() => {
    if (!bid) updatePublishForm({ bid: 0.001 });
  }, []);

  function handlePublish() {
    let outputFile = filePath;
    let runPublish = false;
    if (!emptyPostError) {
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
    if (runPublish) {
      publish(outputFile, false);
    }
  }

  let submitLabel;
  if (isClaimingInitialRewards) submitLabel = __('Claiming credits...');
  else if (publishing) submitLabel = inEditMode ? __('Updating...') : __('Publishing...');
  else if (previewing) submitLabel = <Spinner type="small" />;
  else submitLabel = inEditMode ? __('Update') : __('Publish');

  const wizardSteps = [
    { label: 'Post', validate: () => !emptyPostError && !!title },
    { label: 'Content' },
    { label: 'Visibility' },
    { label: inEditMode ? 'Update' : 'Publish' },
  ];

  return (
    <div className="card-stack">
      <h1 className="page__title page__title--margin">
        <Icon icon={ICONS.POST} />
        <label>{formTitle}</label>
        <span className="publish-wizard__title-actions">
          {!isClear && (
            <Button
              onClick={() => dispatch(doClearPublish())}
              icon={ICONS.REFRESH}
              button="primary"
              label={__('Clear')}
            />
          )}
        </span>
      </h1>

      <PublishWizard
        steps={wizardSteps}
        activeStep={activeStep}
        onStepChange={(step) => setActiveStep(step)}
        onPublish={handlePublish}
        publishLabel={submitLabel}
        publishDisabled={isFormIncomplete || !formValid}
        publishing={publishing || previewing}
        publishFooterLeft={<ChannelSelector disabled={publishing} isPublishMenu />}
      >
        {/* Step 1: Post */}
        <div className="card-stack">
          <Card
            background
            body={
              <div className="publish-details">
                <PublishPost
                  inEditMode={inEditMode}
                  uri={permanentUrl}
                  mode={mode}
                  fileMimeType={myClaimForUri?.value?.source?.media_type}
                  disabled={disabled || publishing}
                  inProgress={!!filePath || !!editingURI || !!name || !!title}
                  setPrevFileText={setPrevFileText}
                />
              </div>
            }
          />
        </div>

        {/* Step 2: Content */}
        <div className="card-stack">
          <Card
            background
            body={
              <div className="publish-details">
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
                      const validated = [];
                      newTags.forEach((t) => {
                        if (!tags.some((tag) => tag.name === t.name)) validated.push(t);
                      });
                      updatePublishForm({ tags: [...tags, ...validated] });
                    }}
                    onRemove={(t) => updatePublishForm({ tags: tags.filter((tag) => tag.name !== t.name) })}
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

        {/* Step 2: Visibility */}
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
                    const validated = [];
                    newTags.forEach((t) => {
                      if (!tags.some((tag) => tag.name === t.name)) validated.push(t);
                    });
                    updatePublishForm({ tags: [...tags, ...validated] });
                  }}
                  onRemove={(t) => updatePublishForm({ tags: tags.filter((tag) => tag.name !== t.name) })}
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
                {showSchedulingOptions && <PublishStreamReleaseDate />}
                {!formDisabled && !formValid ? (
                  <PublishFormErrors title={title} mode={mode} />
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
                            target="_blank"
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

export default PostForm;
