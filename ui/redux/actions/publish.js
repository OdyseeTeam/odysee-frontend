// @flow
import * as ERRORS from 'constants/errors';
import * as RENDER_MODES from 'constants/file_render_modes';
import * as MODALS from 'constants/modal_types';
import * as ACTIONS from 'constants/action_types';
import * as PAGES from 'constants/pages';
import { NO_FILE, PAYWALL } from 'constants/publish';
import * as PUBLISH_TYPES from 'constants/publish_types';
import { batchActions } from 'util/batch-actions';
import { THUMBNAIL_CDN_SIZE_LIMIT_BYTES, WEB_PUBLISH_SIZE_LIMIT_GB } from 'config';
import { doCheckPendingClaims } from 'redux/actions/claims';
import { selectProtectedContentMembershipsForContentClaimId } from 'redux/selectors/memberships';
import { doSaveMembershipRestrictionsForContent, doMembershipContentforStreamClaimId } from 'redux/actions/memberships';
import {
  makeSelectClaimForUri,
  selectMyActiveClaims,
  selectMyClaims,
  selectMyChannelClaims,
  selectReflectingById,
} from 'redux/selectors/claims';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import {
  selectPublishFormValue,
  selectPublishFormValues,
  selectIsStillEditing,
  selectMemberRestrictionStatus,
} from 'redux/selectors/publish';
import { doError } from 'redux/actions/notifications';
import { push } from 'connected-react-router';
import analytics from 'analytics';
import { doOpenModal, doSetActiveChannel, doSetIncognito } from 'redux/actions/app';
import { CC_LICENSES, COPYRIGHT, OTHER, NONE, PUBLIC_DOMAIN } from 'constants/licenses';
import { IMG_CDN_PUBLISH_URL } from 'constants/cdn_urls';
import * as THUMBNAIL_STATUSES from 'constants/thumbnail_upload_statuses';
import { sanitizeName } from 'util/lbryURI';
import { getVideoBitrate, resolvePublishPayload } from 'util/publish';
import { parsePurchaseTag, parseRentalTag, TO_SECONDS } from 'util/stripe';
import Lbry from 'lbry';
// import LbryFirst from 'extras/lbry-first/lbry-first';
import { isClaimNsfw, getChannelIdFromClaim, isStreamPlaceholderClaim } from 'util/claim';
import { MEMBERS_ONLY_CONTENT_TAG, SCHEDULED_TAGS, VISIBILITY_TAGS } from 'constants/tags';

const PUBLISH_PATH_MAP = Object.freeze({
  file: PAGES.UPLOAD,
  post: PAGES.POST,
  livestream: PAGES.LIVESTREAM,
});

function resolveClaimTypeForAnalytics(claim) {
  if (!claim) {
    return 'undefined_claim';
  }

  switch (claim.value_type) {
    case 'stream':
      if (claim.value) {
        if (!claim.value.source) {
          return 'livestream';
        } else {
          return claim.value.stream_type;
        }
      } else {
        return 'stream';
      }
    default:
      // collection, channel, repost, undefined
      return claim.value_type;
  }
}

export const doPublishDesktop = (filePath: ?string | ?File, preview?: boolean) => {
  return (dispatch: Dispatch, getState: () => State) => {
    const publishPreviewFn = (publishPayload, previewResponse) => {
      dispatch(doOpenModal(MODALS.PUBLISH_PREVIEW, { publishPayload, previewResponse }));
    };

    const noFileParam = !filePath || filePath === NO_FILE;
    const state: State = getState();
    const editingUri = selectPublishFormValue(state, 'editingURI') || '';
    const remoteUrl = selectPublishFormValue(state, 'remoteFileUrl');

    const { memberRestrictionTierIds, name } = state.publish;
    const memberRestrictionStatus = selectMemberRestrictionStatus(state);

    const claim = makeSelectClaimForUri(editingUri)(state) || {};
    const hasSourceFile = claim.value && claim.value.source;
    const redirectToLivestream = noFileParam && !hasSourceFile && !remoteUrl;

    const publishSuccess = (successResponse, lbryFirstError) => {
      const state: State = getState();
      const myClaims = selectMyClaims(state);
      const pendingClaim = successResponse.outputs[0];

      const apiLogSuccessCb = (claimResult: ChannelClaim | StreamClaim) => {
        const channelClaimId = getChannelIdFromClaim(claimResult);

        // hit backend to save restricted memberships
        if (channelClaimId) {
          const tierIds = memberRestrictionStatus.isRestricting ? memberRestrictionTierIds : [];
          dispatch(doSaveMembershipRestrictionsForContent(channelClaimId, claimResult.claim_id, name, tierIds));
        }
      };

      analytics.apiLog.publish(pendingClaim, apiLogSuccessCb);

      const { permanent_url: url } = pendingClaim;
      const actions = [];

      // @if TARGET='app'
      actions.push(push(`/$/${PAGES.UPLOADS}`));
      // @endif

      actions.push({
        type: ACTIONS.PUBLISH_SUCCESS,
        data: {
          type: resolveClaimTypeForAnalytics(pendingClaim),
        },
      });

      // We have to fake a temp claim until the new pending one is returned by claim_list_mine
      // We can't rely on claim_list_mine because there might be some delay before the new claims are returned
      // Doing this allows us to show the pending claim immediately, it will get overwritten by the real one
      const isMatch = (claim) => claim.claim_id === pendingClaim.claim_id;
      const isEdit = myClaims.some(isMatch);

      actions.push(
        ({
          type: ACTIONS.UPDATE_PENDING_CLAIMS,
          data: {
            claims: [pendingClaim],
            options: {
              overrideTags: true,
              overrideSigningChannel: true,
            },
          },
        }: UpdatePendingClaimsAction)
      );

      // @if TARGET='app'
      actions.push({
        type: ACTIONS.ADD_FILES_REFLECTING,
        data: pendingClaim,
      });
      // @endif

      dispatch(batchActions(...actions));
      dispatch(
        doOpenModal(MODALS.PUBLISH, {
          uri: url,
          isEdit,
          filePath,
          lbryFirstError,
        })
      );
      dispatch(doCheckPendingClaims());
      // @if TARGET='app'
      dispatch(doCheckReflectingFiles());
      // @endif
      // @if TARGET='web'
      if (redirectToLivestream) {
        dispatch(doClearPublish());
        dispatch(push(`/$/${PAGES.LIVESTREAM}`));
      }
      // @endif
    };

    const publishFail = (error) => {
      const actions = [];
      actions.push({
        type: ACTIONS.PUBLISH_FAIL,
      });

      let message = typeof error === 'string' ? error : error.message;

      if (message.endsWith(ERRORS.SDK_FETCH_TIMEOUT)) {
        message = ERRORS.PUBLISH_TIMEOUT_BUT_LIKELY_SUCCESSFUL;

        if (memberRestrictionStatus.isRestricting) {
          message = ERRORS.RESTRICTED_CONTENT_PUBLISHING_FAILED;
        }
      }

      actions.push(doError({ message, cause: error.cause }));
      dispatch(batchActions(...actions));
    };

    if (preview) {
      dispatch(doPublish(publishSuccess, publishFail, publishPreviewFn));
      return;
    }

    // Redirect on web immediately because we have a file upload progress componenet
    // on the publishes page. This doesn't exist on desktop so wait until we get a response
    // from the SDK
    // @if TARGET='web'
    if (!redirectToLivestream) {
      dispatch(push(`/$/${PAGES.UPLOADS}`));
    }
    // @endif

    dispatch(doPublish(publishSuccess, publishFail));
  };
};

export const doPublishResume = (publishPayload: FileUploadSdkParams) => (dispatch: Dispatch, getState: GetState) => {
  const publishSuccess = (successResponse, lbryFirstError) => {
    const state = getState();
    const myClaimIds: Set<string> = selectMyActiveClaims(state);

    const pendingClaim = successResponse.outputs[0];
    const { permanent_url: url } = pendingClaim;

    const { memberRestrictionTierIds, name } = state.publish;
    const memberRestrictionStatus = selectMemberRestrictionStatus(state);

    const apiLogSuccessCb = (claimResult: ChannelClaim | StreamClaim) => {
      const channelClaimId = getChannelIdFromClaim(claimResult);

      // hit backend to save restricted memberships
      if (channelClaimId) {
        const tierIds = memberRestrictionStatus.isRestricting ? memberRestrictionTierIds : [];
        dispatch(doSaveMembershipRestrictionsForContent(channelClaimId, claimResult.claim_id, name, tierIds));
      }
    };

    analytics.apiLog.publish(pendingClaim, apiLogSuccessCb);

    // We have to fake a temp claim until the new pending one is returned by claim_list_mine
    // We can't rely on claim_list_mine because there might be some delay before the new claims are returned
    // Doing this allows us to show the pending claim immediately, it will get overwritten by the real one
    const isEdit = myClaimIds.has(pendingClaim.claim_id);

    const actions = [];

    actions.push({
      type: ACTIONS.PUBLISH_SUCCESS,
      data: {
        type: resolveClaimTypeForAnalytics(pendingClaim),
      },
    });

    actions.push({
      type: ACTIONS.UPDATE_PENDING_CLAIMS,
      data: {
        claims: [pendingClaim],
      },
    });

    dispatch(batchActions(...actions));

    dispatch(
      doOpenModal(MODALS.PUBLISH, {
        uri: url,
        isEdit,
        lbryFirstError,
      })
    );

    dispatch(doCheckPendingClaims());
  };

  const publishFail = (error) => {
    const actions = [];
    actions.push({
      type: ACTIONS.PUBLISH_FAIL,
    });
    actions.push(doError({ message: error.message, cause: error.cause }));
    dispatch(batchActions(...actions));
  };

  dispatch(doPublish(publishSuccess, publishFail, null, publishPayload));
};

export const doResetThumbnailStatus = () => (dispatch: Dispatch) => {
  dispatch({
    type: ACTIONS.UPDATE_PUBLISH_FORM,
    data: {
      thumbnailPath: '',
      thumbnailError: undefined,
    },
  });

  return dispatch({
    type: ACTIONS.UPDATE_PUBLISH_FORM,
    data: {
      uploadThumbnailStatus: THUMBNAIL_STATUSES.READY,
      thumbnail: '',
    },
  });
};

export const doBeginPublish = (type: PublishType, name: string = '', customPath: string = '') => {
  return (dispatch: Dispatch) => {
    assert(PUBLISH_PATH_MAP[type], 'invalid type', type);

    dispatch(doClearPublish());

    dispatch({
      type: ACTIONS.UPDATE_PUBLISH_FORM,
      data: {
        ...(name ? { name } : {}),
      },
    });

    if (customPath) {
      dispatch(push(customPath));
    } else {
      const path = PUBLISH_PATH_MAP[type] || PUBLISH_PATH_MAP.file;
      dispatch(push(`/$/${path}`));
    }
  };
};

export const doClearPublish = () => (dispatch: Dispatch) => {
  dispatch({ type: ACTIONS.CLEAR_PUBLISH });
  return dispatch(doResetThumbnailStatus());
};

export const doUpdatePublishForm = (publishFormValue: UpdatePublishState) => (dispatch: Dispatch) =>
  dispatch({
    type: ACTIONS.UPDATE_PUBLISH_FORM,
    data: { ...publishFormValue },
  });

export const doUpdateTitle = (title: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const { name, claimToEdit } = state.publish;

  const regexInvalidURI =
    /[ =&#:$@%?;/\\\n"<>%{}|^~[\]`\u{0000}-\u{0008}\u{000b}-\u{000c}\u{000e}-\u{001F}\u{D800}-\u{DFFF}\u{FFFE}-\u{FFFF}]/gu;

  const publishFormValue = { name, title };

  // Keep the name matching the title, if the name was already matching
  let newName = title.replace(regexInvalidURI, '-');
  if (!claimToEdit && (name === newName.slice(0, -1) || newName === name.slice(0, -1) || !title || !name)) {
    publishFormValue.name = newName;
  }

  dispatch({
    type: ACTIONS.UPDATE_PUBLISH_FORM,
    data: { ...publishFormValue },
  });
};

export const doUpdateFile = (file: WebFile, clearName: boolean = true) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const { name, title } = state.publish;
    const isStillEditing = selectIsStillEditing(state);

    if (!file) {
      // This also handles the case of trying to select another file but canceling half way.
      if (isStillEditing || !clearName) {
        dispatch({
          type: ACTIONS.UPDATE_PUBLISH_FORM,
          data: { filePath: '' },
        });
      } else {
        dispatch({
          type: ACTIONS.UPDATE_PUBLISH_FORM,
          data: { filePath: '', name: '' },
        });
      }
      // TODO: Shouldn't it clear the other file-related attributes too?
      return;
    }

    assert(typeof file !== 'string');

    const contentType = file.type && file.type.split('/');
    const isVideo = contentType ? contentType[0] === 'video' : false;
    const isMp4 = contentType ? contentType[1] === 'mp4' : false;

    let isTextPost = false;
    if (contentType && contentType[0] === 'text') {
      isTextPost = contentType[1] === 'plain' || contentType[1] === 'markdown';
      // setCurrentFileType(contentType);
    } else if (file.name) {
      // If user's machine is missing a valid content type registration
      // for markdown content: text/markdown, file extension will be used instead
      const extension = file.name.split('.').pop();
      const MARKDOWN_FILE_EXTENSIONS = ['txt', 'md', 'markdown'];
      isTextPost = MARKDOWN_FILE_EXTENSIONS.includes(extension);
    }

    const formUpdates: UpdatePublishState = {
      fileSize: file.size,
      fileMime: file.type,
      fileVid: isVideo,
      fileBitrate: 0,
      fileSizeTooBig: false,
    };

    // --- Async data ---
    if (isVideo) {
      if (isMp4) {
        window.URL = window.URL || window.webkitURL;
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          dispatch({
            type: ACTIONS.UPDATE_PUBLISH_FORM,
            data: { fileDur: video.duration, fileBitrate: getVideoBitrate(file.size, video.duration) },
          });
          window.URL.revokeObjectURL(video.src);
        };
        video.onerror = () => {
          dispatch({
            type: ACTIONS.UPDATE_PUBLISH_FORM,
            data: { fileDur: 0, fileBitrate: 0 },
          });
        };
        video.src = window.URL.createObjectURL(file);
      } else {
        formUpdates.fileDur = 0;
      }
    } else {
      formUpdates.fileDur = 0;

      if (isTextPost) {
        const reader = new FileReader();
        reader.addEventListener('load', (event: ProgressEvent) => {
          // See: https://github.com/facebook/flow/issues/3470
          if (event.target instanceof FileReader) {
            const text = event.target.result;
            dispatch({ type: ACTIONS.UPDATE_PUBLISH_FORM, data: { fileText: text } });
            // setPublishMode(PUBLISH_MODES.POST);
          }
        });
        reader.readAsText(file);
        // setCurrentFileType('text/markdown');
      }
    }

    // --- File Size ---
    // @if TARGET='web'
    // we only need to enforce file sizes on 'web'
    const TV_PUBLISH_SIZE_LIMIT_BYTES = WEB_PUBLISH_SIZE_LIMIT_GB * 1073741824;
    if (file.size && Number(file.size) > TV_PUBLISH_SIZE_LIMIT_BYTES) {
      formUpdates.fileSizeTooBig = true;
    }
    // @endif

    // --- Name and title ---
    // Strip off extension and replace invalid characters
    const fileName = name || (file.name && file.name.substr(0, file.name.lastIndexOf('.'))) || '';

    if (!title) {
      formUpdates.title = fileName; // Autofill only if empty title.
    }

    if (!isStillEditing) {
      formUpdates.name = sanitizeName(fileName);
    }

    // --- File Path ---
    // If electron, we'll set filePath to the path string because SDK is handling publishing.
    // File.path will be undefined from web due to browser security, so it will default to the File Object.
    formUpdates.filePath = file.path || file;

    // --- Finalize ---
    dispatch({ type: ACTIONS.UPDATE_PUBLISH_FORM, data: formUpdates });
  };
};

export const doUploadThumbnail =
  (filePath?: string, thumbnailBlob?: File, fsAdapter?: any, fs?: any, path?: any, cb?: (string) => void) =>
  (dispatch: Dispatch) => {
    let thumbnail, fileExt, fileName, fileType, stats, size;

    const uploadError = (error = '') => {
      dispatch(
        batchActions(
          {
            type: ACTIONS.UPDATE_PUBLISH_FORM,
            data: {
              uploadThumbnailStatus: THUMBNAIL_STATUSES.READY,
              thumbnail: '',
              nsfw: false,
            },
          },
          doError(error)
        )
      );
    };

    dispatch({
      type: ACTIONS.UPDATE_PUBLISH_FORM,
      data: { thumbnailError: undefined },
    });

    const doUpload = (data) => {
      return fetch(IMG_CDN_PUBLISH_URL, {
        method: 'POST',
        body: data,
      })
        .then((res) => res.text())
        .then((text) => {
          try {
            return text.length ? JSON.parse(text) : {};
          } catch {
            throw new Error(text);
          }
        })
        .then((json) => {
          if (json.type !== 'success') {
            return uploadError(
              json.message || __('There was an error in the upload. The format or extension might not be supported.')
            );
          }

          if (cb) {
            cb(json.message);
          }

          return dispatch({
            type: ACTIONS.UPDATE_PUBLISH_FORM,
            data: {
              uploadThumbnailStatus: THUMBNAIL_STATUSES.COMPLETE,
              thumbnail: json.message,
            },
          });
        })
        .catch((err) => {
          let message = err.message;

          // This sucks but ¯\_(ツ)_/¯
          if (message === 'Failed to fetch') {
            // message = __('Thumbnail upload service may be down, try again later.');
            message = __(
              'Thumbnail upload service may be down, try again later. Some plugins like AdGuard Français may be blocking the service. If using Brave, go to brave://adblock and disable it, or turn down shields.'
            );
          }

          const userInput = [fileName, fileExt, fileType, thumbnail, size];
          uploadError({ message, cause: `${userInput.join(' | ')}` });
        });
    };

    dispatch({
      type: ACTIONS.UPDATE_PUBLISH_FORM,
      data: { uploadThumbnailStatus: THUMBNAIL_STATUSES.IN_PROGRESS },
    });

    if (fsAdapter && fsAdapter.readFile && filePath) {
      fsAdapter.readFile(filePath, 'base64').then((base64Image) => {
        fileExt = 'png';
        fileName = 'thumbnail.png';
        fileType = 'image/png';

        const data = new FormData();
        // $FlowFixMe
        data.append('file-input', { uri: 'file://' + filePath, type: fileType, name: fileName });
        data.append('upload', 'Upload');
        return doUpload(data);
      });
    } else {
      if (filePath && fs && path) {
        thumbnail = fs.readFileSync(filePath);
        fileExt = path.extname(filePath);
        fileName = path.basename(filePath);
        stats = fs.statSync(filePath);
        size = stats.size;
        fileType = `image/${fileExt.slice(1)}`;
      } else if (thumbnailBlob) {
        fileExt = `.${thumbnailBlob.type && thumbnailBlob.type.split('/')[1]}`;
        fileName = thumbnailBlob.name;
        fileType = thumbnailBlob.type;
        size = thumbnailBlob.size;
      } else {
        return null;
      }

      if (size && size >= THUMBNAIL_CDN_SIZE_LIMIT_BYTES) {
        const maxSizeMB = THUMBNAIL_CDN_SIZE_LIMIT_BYTES / (1024 * 1024);
        uploadError(__('Thumbnail size over %max_size%MB, please edit and reupload.', { max_size: maxSizeMB }));
        return;
      }

      const data = new FormData();
      const file = thumbnailBlob || (thumbnail && new File([thumbnail], fileName, { type: fileType }));
      // $FlowFixMe
      data.append('file-input', file);
      data.append('upload', 'Upload');
      return doUpload(data);
    }
  };

export const doPrepareEdit = (claim: StreamClaim, uri: string, claimType: string) => {
  assert(claim, 'doPrepareEdit: claim must not be null', { uri, claimType });

  return async (dispatch: Dispatch, getState: GetState) => {
    const { name, amount, value = {} } = claim;
    const channelName = (claim && claim.signing_channel && claim.signing_channel.name) || null;
    const channelId = (claim && claim.signing_channel && claim.signing_channel.claim_id) || null;

    const {
      author,
      description,
      // use same values as default state
      // fee will be undefined for free content
      fee = {
        amount: '0',
        currency: 'LBC',
      },
      languages,
      license,
      license_url: licenseUrl,
      thumbnail,
      title,
      tags,
      stream_type,
    } = value;

    let state = getState();

    const isPostClaim = makeSelectFileRenderModeForUri(claim?.permanent_url)(state) === RENDER_MODES.MARKDOWN;
    const isLivestreamClaim = isStreamPlaceholderClaim(claim);
    const type: PublishType = isLivestreamClaim
      ? PUBLISH_TYPES.LIVESTREAM
      : isPostClaim
      ? PUBLISH_TYPES.POST
      : PUBLISH_TYPES.FILE;

    const liveCreateType: ?LiveCreateType = isLivestreamClaim ? 'edit_placeholder' : undefined;
    const liveEditType: ?LiveEditType = isLivestreamClaim ? 'update_only' : undefined; // Reverted #2801

    // $FlowFixMe (TODO: Lots of undefined states)
    const publishData: UpdatePublishState = {
      type,
      ...(liveCreateType ? { liveCreateType } : {}),
      ...(liveEditType ? { liveEditType } : {}),
      claim_id: claim.claim_id,
      name,
      bid: Number(amount),
      author,
      description,
      fee,
      languages,
      thumbnail: thumbnail ? thumbnail.url : null,
      title,
      uri,
      uploadThumbnailStatus: thumbnail ? THUMBNAIL_STATUSES.MANUAL : undefined,
      licenseUrl,
      nsfw: isClaimNsfw(claim),
      tags: tags ? tags.map((tag) => ({ name: tag })) : [],
      streamType: stream_type,
      claimToEdit: { ...claim },
    };

    // Make sure custom licenses are mapped properly
    // If the license isn't one of the standard licenses, map the custom license and description/url
    if (!CC_LICENSES.some(({ value }) => value === license)) {
      if (!license || license === NONE || license === PUBLIC_DOMAIN) {
        publishData.licenseType = license;
      } else if (license && !licenseUrl && license !== NONE) {
        publishData.licenseType = COPYRIGHT;
      } else {
        publishData.licenseType = OTHER;
      }

      // $FlowFixMe (I think this field shouldn't be populated if `license` doesn't exist.
      publishData.otherLicenseDescription = license;
    } else {
      publishData.licenseType = license;
    }

    if (channelName) {
      publishData['channel'] = channelName;
    }

    if (channelId) {
      publishData.channelId = channelId;
    }

    // Fill purchase/rental details from the claim
    const rental = parseRentalTag(tags);
    const purchasePrice = parsePurchaseTag(tags);

    if (rental || purchasePrice) {
      publishData['paywall'] = PAYWALL.FIAT;
    } else if (fee.amount && Number(fee.amount) > 0) {
      publishData['paywall'] = PAYWALL.SDK;
    } else {
      publishData['paywall'] = PAYWALL.FREE;
    }

    if (rental) {
      publishData.fiatRentalEnabled = true;
      publishData.fiatRentalFee = {
        amount: rental.price,
        currency: 'USD', // TODO: hardcode until we have a direction on currency
      };
      publishData.fiatRentalExpiration = {
        // Don't know which unit the user picked since we store it as 'seconds'
        // in the tag. Just convert back to days for now.
        value: rental.expirationTimeInSeconds / TO_SECONDS['days'],
        unit: 'days',
      };
    }

    if (purchasePrice) {
      publishData.fiatPurchaseEnabled = true;
      publishData.fiatPurchaseFee = {
        amount: purchasePrice,
        currency: 'USD', // TODO: hardcode until we have a direction on currency
      };
    }

    // == Tag derivations ==
    const publishDataTags = new Set(publishData.tags && publishData.tags.map((tag) => tag.name));

    // -- Membership restrictions
    if (publishDataTags.has(MEMBERS_ONLY_CONTENT_TAG)) {
      if (channelId) {
        // Repopulate membership restriction IDs
        let protectedMembershipIds: Array<number> = selectProtectedContentMembershipsForContentClaimId(
          state,
          claim.claim_id
        );

        if (protectedMembershipIds === undefined) {
          await dispatch(doMembershipContentforStreamClaimId(claim.claim_id));
          state = getState();
          protectedMembershipIds = selectProtectedContentMembershipsForContentClaimId(state, claim.claim_id);
        }

        if (protectedMembershipIds && protectedMembershipIds.length > 0) {
          publishData.memberRestrictionOn = true;
          publishData.memberRestrictionTierIds = protectedMembershipIds;
        } else {
          publishData.memberRestrictionOn = false;
          publishData.memberRestrictionTierIds = [];
        }
      } else {
        // ??
        if (publishData.tags) {
          publishData.tags = publishData.tags.filter((tag) => tag.name === MEMBERS_ONLY_CONTENT_TAG);
        } else {
          publishData.tags = [];
        }
      }
    }

    // -- Visibility restrictions
    if (tags) {
      if (tags.includes(VISIBILITY_TAGS.UNLISTED)) {
        publishData.visibility = 'unlisted';
      } else if (tags.includes(VISIBILITY_TAGS.PRIVATE)) {
        publishData.visibility = 'private';
      } else if (tags.includes(SCHEDULED_TAGS.HIDE)) {
        publishData.visibility = 'scheduled';
        publishData.scheduledShow = false;
      } else if (tags.includes(SCHEDULED_TAGS.SHOW)) {
        publishData.visibility = 'scheduled';
        publishData.scheduledShow = true;
      } else {
        publishData.visibility = 'public';
      }
    } else {
      publishData.visibility = 'public';
    }

    if (publishData.channelId) {
      dispatch(doSetActiveChannel(publishData.channelId, false));
      dispatch(doSetIncognito(false));
    } else {
      dispatch(doSetIncognito(true));
    }

    dispatch({ type: ACTIONS.DO_PREPARE_EDIT, data: publishData });
    dispatch(push(`/$/${PUBLISH_PATH_MAP[type]}`));
  };
};

export const doPublish =
  (success: Function, fail: Function, previewFn?: Function, payload?: FileUploadSdkParams) =>
  (dispatch: Dispatch, getState: GetState) => {
    if (!previewFn) {
      dispatch({ type: ACTIONS.PUBLISH_START });
    }

    const state = getState();
    const myClaimForUri = state.publish.claimToEdit;
    const myChannels = selectMyChannelClaims(state);
    // const myClaims = selectMyClaimsWithoutChannels(state);
    // get redux publish form
    const publishData = selectPublishFormValues(state);
    const { memberRestrictionTierIds, name } = publishData;
    const memberRestrictionStatus = selectMemberRestrictionStatus(state);

    const publishPayload =
      payload ||
      resolvePublishPayload(publishData, myClaimForUri, myChannels, memberRestrictionStatus, Boolean(previewFn));

    const { channel_id: channelClaimId } = publishPayload;

    const existingClaimId = myClaimForUri?.claim_id || '';

    // hit backend to save restricted memberships
    // hit the backend immediately to save the data, we will overwrite it if publish succeeds
    if (channelClaimId && !previewFn) {
      dispatch(
        doSaveMembershipRestrictionsForContent(
          channelClaimId,
          existingClaimId,
          name,
          memberRestrictionStatus.isRestricting ? memberRestrictionTierIds : [],
          existingClaimId ? undefined : true
        )
      );
    }

    if (previewFn) {
      const ESTIMATE_PUBLISH_COST = false;

      if (ESTIMATE_PUBLISH_COST) {
        const payloadSnapshot = { ...publishPayload }; // Lbry alters the payload, so make copy for previewFn
        return Lbry.publish(publishPayload).then((previewResponse: PublishResponse) => {
          // $FlowIgnore
          return previewFn(payloadSnapshot, previewResponse);
        }, fail);
      } else {
        return previewFn(publishPayload, null);
      }
    }

    return Lbry.publish(publishPayload).then((response: PublishResponse) => {
      // TODO: Restore LbryFirst
      // if (!useLBRYUploader) {
      return success(response);
      // }

      // publishPayload.permanent_url = response.outputs[0].permanent_url;
      //
      // return LbryFirst.upload(publishPayload)
      //   .then(() => {
      //     // Return original publish response so app treats it like a normal publish
      //     return success(response);
      //   })
      //   .catch((error) => {
      //     return success(response, error);
      //   });
    }, fail);
  };

// Calls file_list until any reflecting files are done
export const doCheckReflectingFiles = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  // $FlowFixMe: checkingReflector does not exist!
  const { checkingReflector } = state.claims;
  let reflectorCheckInterval;

  const checkFileList = async () => {
    const state = getState();
    const reflectingById = selectReflectingById(state);
    const ids = Object.keys(reflectingById);

    const newReflectingById = {};
    const promises = [];
    // TODO: just use file_list({claim_id: Array<claimId>})
    if (Object.keys(reflectingById).length) {
      ids.forEach((claimId) => {
        promises.push(Lbry.file_list({ claim_id: claimId }));
      });

      Promise.all(promises)
        .then((results) => {
          results.forEach((res) => {
            if (res.items[0]) {
              const fileListItem = res.items[0];
              const fileClaimId = fileListItem.claim_id;
              const {
                is_fully_reflected: done,
                uploading_to_reflector: uploading,
                reflector_progress: progress,
              } = fileListItem;
              if (uploading) {
                newReflectingById[fileClaimId] = {
                  fileListItem: fileListItem,
                  progress,
                  stalled: !done && !uploading,
                };
              }
            }
          });
        })
        .then(() => {
          dispatch({
            type: ACTIONS.UPDATE_FILES_REFLECTING,
            data: newReflectingById,
          });
          if (!Object.keys(newReflectingById).length) {
            dispatch({
              type: ACTIONS.TOGGLE_CHECKING_REFLECTING,
              data: false,
            });
            clearInterval(reflectorCheckInterval);
          }
        });
    } else {
      dispatch({
        type: ACTIONS.TOGGLE_CHECKING_REFLECTING,
        data: false,
      });
      clearInterval(reflectorCheckInterval);
    }
  };
  // do it once...
  checkFileList();
  // then start the interval if it's not already started
  if (!checkingReflector) {
    dispatch({
      type: ACTIONS.TOGGLE_CHECKING_REFLECTING,
      data: true,
    });
    reflectorCheckInterval = setInterval(() => {
      checkFileList();
    }, 5000);
  }
};

export function doUpdateUploadAdd(
  file: File | string,
  params: { [key: string]: any },
  uploader: TusUploader | XMLHttpRequest,
  backend: UploadBackendVersion
) {
  return (dispatch: Dispatch, getState: GetState) => {
    dispatch({
      type: ACTIONS.UPDATE_UPLOAD_ADD,
      data: { file, params, uploader, backend },
    });
  };
}

export const doUpdateUploadProgress =
  (props: { guid: string, progress?: string, status?: UploadStatus }) => (dispatch: Dispatch) =>
    dispatch({
      type: ACTIONS.UPDATE_UPLOAD_PROGRESS,
      data: props,
    });

/**
 * doUpdateUploadRemove
 *
 * @param guid
 * @param params Optional. Retain to allow removal of old keys, which are
 *               derived from `name#channel` instead of using a guid.
 *               Can be removed after January 2022.
 * @returns {(function(Dispatch, GetState): void)|*}
 */
export function doUpdateUploadRemove(guid: string, params?: { [key: string]: any }) {
  return (dispatch: Dispatch, getState: GetState) => {
    dispatch({
      type: ACTIONS.UPDATE_UPLOAD_REMOVE,
      data: { guid, params },
    });
  };
}

// -- Flow exports --
export type DoPublishDesktop = typeof doPublishDesktop;
export type DoUpdateUploadRemove = typeof doUpdateUploadRemove;
