import type { DoPublishDesktop } from 'redux/actions/publish';

/*
  On submit, this component calls publish, which dispatches doPublishDesktop.
  doPublishDesktop calls lbry-redux Lbry publish method using lbry-redux publish state as params.
  Publish simply instructs the SDK to find the file path on disk and publish it with the provided metadata.
  On web, the Lbry publish method call is overridden in platform/web/api-setup, using a function in platform/web/publish.
  File upload is carried out in the background by that function.
 */
import { SITE_NAME, SIMPLE_SITE } from 'config';
import React, { useEffect } from 'react';
import { buildURI, isURIValid, isNameValid } from 'util/lbryURI';
import { lazyImport } from 'util/lazyImport';
import * as THUMBNAIL_STATUSES from 'constants/thumbnail_upload_statuses';
import Button from 'component/button';
import ChannelSelector from 'component/channelSelector';
import classnames from 'classnames';
import TagsSelect from 'component/tagsSelect';
import PublishAdditionalOptions from 'component/publish/shared/publishAdditionalOptions';
import PublishFormErrors from 'component/publish/shared/publishFormErrors';
import PublishVisibility from 'component/publish/shared/publishVisibility';
import PublishPost from 'component/publish/post/publishPost';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import * as PUBLISH_MODES from 'constants/publish_types';
import Spinner from 'component/spinner';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
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
type Props = {
  disabled: boolean;
};

function PostForm(props: Props) {
  const { disabled = false } = props;

  const dispatch = useAppDispatch();
  const formValues = useAppSelector((state) => selectPublishFormValues(state));
  const {
    tags,
    filePath: formFilePath,
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
  } = formValues;
  const myClaimForUri = useAppSelector((state) => selectMyClaimForUri(state));
  const permanentUrl = (myClaimForUri && myClaimForUri.permanent_url) || '';
  const isStillEditing = useAppSelector((state) => selectIsStillEditing(state));
  const filePath = useAppSelector((state) => selectPublishFormValue(state, 'filePath'));
  const publishSuccess = useAppSelector((state) => selectPublishFormValue(state, 'publishSuccess'));
  const publishError = useAppSelector((state) => selectPublishFormValue(state, 'publishError'));
  const modal = useAppSelector((state) => selectModal(state));
  const enablePublishPreview = useAppSelector((state) => selectClientSetting(state, SETTINGS.ENABLE_PUBLISH_PREVIEW));
  const activeChannelClaim = useAppSelector((state) => selectActiveChannelClaim(state));
  const incognito = useAppSelector((state) => selectIncognito(state));
  const isClaimingInitialRewards = useAppSelector((state) => selectIsClaimingInitialRewards(state));
  const hasClaimedInitialRewards = useAppSelector((state) => selectHasClaimedInitialRewards(state));
  const memberRestrictionStatus = useAppSelector((state) => selectMemberRestrictionStatus(state));

  const updatePublishForm = (value: UpdatePublishState) => dispatch(doUpdatePublishForm(value));
  const clearPublish = () => dispatch(doClearPublish());
  const resolveUri = (uri: string) => dispatch(doResolveUri(uri));
  const publish: DoPublishDesktop = (fp, preview) => dispatch(doPublishDesktop(fp, preview));
  const resetThumbnailStatus = () => dispatch(doResetThumbnailStatus());
  const checkAvailability = (n: string) => dispatch(doCheckPublishNameAvailability(n));
  const claimInitialRewards = () => dispatch(doClaimInitialRewards());
  const inEditMode = Boolean(editingURI);
  const mode = PUBLISH_MODES.POST;
  const [autoSwitchMode, setAutoSwitchMode] = React.useState(true);
  // Used to check if the url name has changed:
  // A new file needs to be provided
  const [prevName, setPrevName] = React.useState(false);
  // Used to check if the file has been modified by user
  const [fileEdited, setFileEdited] = React.useState(false);
  const [prevFileText, setPrevFileText] = React.useState('');
  const TAGS_LIMIT = 5;
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
  // TODO: formValidLessFile should be a selector
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
    !releaseTimeError &&
    !(uploadThumbnailStatus === THUMBNAIL_STATUSES.IN_PROGRESS);
  const isOverwritingExistingClaim = !editingURI && myClaimForUri;
  const formValid = isOverwritingExistingClaim
    ? false
    : editingURI && !filePath
      ? isStillEditing && formValidLessFile
      : formValidLessFile;
  const [previewing, setPreviewing] = React.useState(false);
  const formTitle = !editingURI ? __('Post an article') : __('Edit post');
  const isClear = !title && !name && !thumbnail;
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
  let submitLabel;

  if (isClaimingInitialRewards) {
    submitLabel = __('Claiming credits...');
  } else if (publishing) {
    if (isStillEditing || inEditMode) {
      submitLabel = __('Saving...');
    } else {
      submitLabel = __('Posting...');
    }
  } else if (previewing && !publishError) {
    submitLabel = <Spinner type="small" />;
  } else {
    if (isStillEditing || inEditMode) {
      submitLabel = __('Save');
    } else {
      submitLabel = __('Post');
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
      uri =
        name &&
        buildURI(
          {
            streamName: name,
            activeChannelName,
          },
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
      dispatch(doUpdatePublishForm({
        uri,
      }));
    }
  }, [name, activeChannelName, dispatch]);
  // because publish editingUri is channel_short/claim_long and we don't have that, resolve it.
  useEffect(() => {
    if (editingURI) {
      dispatch(doResolveUri(editingURI));
    }
  }, [editingURI, dispatch]);
  useEffect(() => {
    if (incognito) {
      dispatch(doUpdatePublishForm({
        channel: undefined,
        channelId: undefined,
      }));
    } else if (activeChannelName) {
      dispatch(doUpdatePublishForm({
        channel: activeChannelName,
        channelId: activeChannelId,
      }));
    }
  }, [activeChannelName, activeChannelId, incognito, dispatch]);

  // @if TARGET='web'
  function createWebFile() {
    if (fileText) {
      const fileName = name || title;

      if (fileName) {
        return new File([fileText], `${fileName}.md`, {
          type: 'text/markdown',
        });
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
          updatePublishForm({
            filePath: outputFile,
          });
          runPublish = true;
        }
      } else {
        // Only metadata has changed.
        runPublish = true;
      }
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

  // Update mode on editing
  useEffect(() => {
    if (autoSwitchMode && editingURI && myClaimForUri) {
      // Change publish mode to "post" if editing content type is markdown
      if (fileMimeType === 'text/markdown' && mode !== PUBLISH_MODES.POST) {
        // Prevent forced mode
        setAutoSwitchMode(false);
      }
    }
  }, [autoSwitchMode, editingURI, fileMimeType, myClaimForUri, mode, setAutoSwitchMode]);

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
    uploadThumbnailStatus === THUMBNAIL_STATUSES.IN_PROGRESS ||
    !(uploadThumbnailStatus === THUMBNAIL_STATUSES.MANUAL || uploadThumbnailStatus === THUMBNAIL_STATUSES.COMPLETE) ||
    thumbnailError ||
    previewing;
  // Editing claim uri
  return (
    <div className="card-stack">
      <h1 className="page__title page__title--margin">
        <Icon icon={ICONS.POST} />
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
          <div className="publish-row publish-row--no-margin">
            <PublishPost
              inEditMode={inEditMode}
              uri={permanentUrl}
              mode={mode}
              fileMimeType={fileMimeType}
              disabled={disabled || publishing}
              inProgress={isInProgress}
              setPrevFileText={setPrevFileText}
            />
          </div>
        }
      />

      {!publishing && (
        <div
          className={classnames({
            'card--disabled': formDisabled,
          })}
        >
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

          <h2
            className="card__title"
            style={{
              marginTop: 'var(--spacing-l)',
            }}
          >
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
              </div>
            }
          />

          <PublishAdditionalOptions disabled={formDisabled} />
        </div>
      )}
      <section>
        <div className="section__actions publish__actions">
          <Button
            button="primary"
            onClick={handlePublish}
            label={submitLabel}
            disabled={isFormIncomplete || !formValid}
          />
          <ChannelSelector disabled={isFormIncomplete} isPublishMenu />
        </div>
        <p className="help">
          {!formDisabled && !formValid ? (
            <PublishFormErrors title={title} mode={mode} />
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
  );
}

export default PostForm;
