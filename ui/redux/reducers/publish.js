// @flow
import { handleActions } from 'util/redux-utils';
import { buildURI } from 'util/lbryURI';
import { serializeFileObj } from 'util/file';
import {
  tusLockAndNotify,
  tusUnlockAndNotify,
  tusRemoveAndNotify,
  tusClearRemovedUploads,
  tusClearLockedUploads,
} from 'util/tus';
import * as ACTIONS from 'constants/action_types';
import * as PAGES from 'constants/pages';
import * as THUMBNAIL_STATUSES from 'constants/thumbnail_upload_statuses';
import { CHANNEL_ANONYMOUS } from 'constants/claim';
import { PAYWALL } from 'constants/publish';
import * as PUBLISH_TYPES from 'constants/publish_types';

// This is the old key formula. Retain it for now to allow users to delete
// any pending uploads. Can be removed from January 2022 onwards.
const getOldKeyFromParam = (params) => `${params.name}#${params.channel || 'anonymous'}`;

// @see 'flow-typed/publish.js' for documentation
const defaultState: PublishState = {
  type: 'file',
  liveCreateType: 'new_placeholder',
  liveEditType: 'use_replay',
  editingURI: undefined,
  claimToEdit: undefined,
  fileText: '',
  filePath: undefined,
  fileDur: 0,
  fileSize: 0,
  fileVid: false,
  fileMime: '',
  fileBitrate: 0,
  fileSizeTooBig: false,
  streamType: '',
  remoteFileUrl: undefined,
  paywall: PAYWALL.FREE,
  fee: {
    amount: 1,
    currency: 'LBC',
  },
  fiatPurchaseFee: { amount: 1, currency: 'USD' },
  fiatPurchaseEnabled: false,
  fiatRentalFee: { amount: 1, currency: 'USD' },
  fiatRentalExpiration: { value: 1, unit: 'weeks' },
  fiatRentalEnabled: false,
  title: '',
  thumbnail: '',
  thumbnail_url: '',
  thumbnailPath: '',
  uploadThumbnailStatus: THUMBNAIL_STATUSES.API_DOWN,
  thumbnailError: undefined,
  description: '',
  language: '',
  releaseTime: undefined,
  releaseTimeDisabled: false,
  releaseTimeError: undefined,
  nsfw: false,
  channel: CHANNEL_ANONYMOUS,
  channelId: '',
  channelClaimId: '',
  name: '',
  nameError: undefined,
  bid: 0.001,
  bidError: undefined,
  licenseType: 'None',
  otherLicenseDescription: 'All rights reserved',
  licenseUrl: '',
  tags: [],
  publishing: false,
  publishSuccess: false,
  publishError: undefined,
  optimize: false,
  useLBRYUploader: false,
  currentUploads: {},
  visibility: 'public',
  scheduledShow: false,
};

const PATHNAME_TO_PUBLISH_TYPE = {
  [`/$/${PAGES.UPLOAD}`]: 'file',
  [`/$/${PAGES.POST}`]: 'post',
  [`/$/${PAGES.LIVESTREAM}`]: 'livestream',
};

export const publishReducer = handleActions(
  {
    // eslint-disable-next-line no-useless-computed-key
    ['@@router/LOCATION_CHANGE']: (state, action) => {
      const { location } = action.payload;
      const { pathname } = location || {};
      const type: ?PublishType = PATHNAME_TO_PUBLISH_TYPE[pathname];

      // `type` used to be set in doBeginPublish, but it gets un-synchronized
      // when doing `POP`, F5, or direct URL access.
      // Since the "Submit" button is currently tied to the current page
      // (i.e. no floating Publish forms), and that all 3 forms share the same
      // states, we need `type` to always be correct as the reference variable
      // for the rest of the logic here.

      if (type && type !== state.type) {
        return { ...state, type };
      } else {
        return state;
      }
    },
    [ACTIONS.UPDATE_PUBLISH_FORM]: (state: PublishState, action: DoUpdatePublishForm): PublishState => {
      const { data } = action;
      const auto = {};

      // --- Resolve PublishState based on the incoming changes ---------------
      // data -> incoming changes (partial PublishState)
      // state -> current PublishState
      // auto -> any related states that needs to be adjusted per new input
      // ----------------------------------------------------------------------

      const getValue = (stateName: string) => (data.hasOwnProperty(stateName) ? data[stateName] : state[stateName]);

      // -- releaseTimeDisabled
      if (data.hasOwnProperty('visibility')) {
        switch (data.visibility) {
          case 'public':
          case 'scheduled':
            auto.releaseTimeDisabled = false;
            break;
          case 'private':
          case 'unlisted':
            auto.releaseTimeDisabled = false; // true;
            break;
          default:
            assert(null, `unhandled visibility: "${data.visibility}"`);
            auto.releaseTimeDisabled = false;
            break;
        }
      }

      // -- channel
      const channel = data.hasOwnProperty('channel') ? data.channel : state.channel;
      if (channel === undefined) {
        auto.visibility = 'public';
      }

      // -- releaseTimeError
      // Note: `releaseTime === undefined` means "use original"
      const currentTs = Date.now() / 1000;
      const visibility = getValue('visibility');
      const releaseTime = getValue('releaseTime');
      const isEditing = Boolean(getValue('editingURI'));
      const isLivestream = getValue('type') === PUBLISH_TYPES.LIVESTREAM;

      auto.releaseTimeError = '';

      switch (visibility) {
        case 'public':
        case 'private':
        case 'unlisted':
          if (releaseTime && releaseTime - 30 > currentTs && !isLivestream) {
            auto.releaseTimeError = 'Cannot set to a future date.';
          }
          break;
        case 'scheduled':
          if (releaseTime) {
            if (releaseTime + 5 < currentTs) {
              auto.releaseTimeError = 'Please set to a future date.';
            }
          } else {
            if (isEditing) {
              assert(state.claimToEdit?.value?.release_time, 'scheduled claim without release_time');
              // -- No need to enforce elapsed date when editing --
              // const originalTs = state.claimToEdit?.value?.release_time || 0;
              // if (originalTs < currentTs) {
              //   auto.releaseTimeError = 'Please set to a future date.';
              // }
            } else {
              auto.releaseTimeError = 'Set a scheduled release date.';
            }
          }
          break;
        default:
          assert(null, `unhandled visibility: "${visibility}"`);
          break;
      }

      // -- remoteFileUrl
      if (!data.hasOwnProperty('remoteFileUrl')) {
        const nonReplayChosen = data.hasOwnProperty('liveEditType') && data.liveEditType !== 'use_replay';
        const activeChanChanged = data.hasOwnProperty('channelClaimId') && data.channelClaimId !== state.channelClaimId;

        if (nonReplayChosen || activeChanChanged) {
          // Purge remoteFileUrl selection on these cases.
          auto.remoteFileUrl = undefined;
        }
      }

      // Finalize
      return { ...state, ...data, ...auto };
    },
    [ACTIONS.CLEAR_PUBLISH]: (state: PublishState): PublishState => ({
      ...defaultState,
      type: state.type,
      uri: undefined,
      channel: state.channel,
      bid: state.bid,
      optimize: state.optimize,
      language: state.language,
      currentUploads: state.currentUploads,
    }),
    [ACTIONS.PUBLISH_START]: (state: PublishState): PublishState => ({
      ...state,
      publishing: true,
      publishSuccess: false,
    }),
    [ACTIONS.PUBLISH_FAIL]: (state: PublishState): PublishState => ({
      ...state,
      publishing: false,
    }),
    [ACTIONS.PUBLISH_SUCCESS]: (state: PublishState): PublishState => ({
      ...state,
      publishing: false,
      publishSuccess: true,
    }),
    [ACTIONS.DO_PREPARE_EDIT]: (state: PublishState, action) => {
      const { ...publishData } = action.data;
      const { channel, name, uri } = publishData;

      // The short uri is what is presented to the user
      // The editingUri is the full uri with claim id
      const shortUri = buildURI({
        channelName: channel,
        streamName: name,
      });

      return {
        ...defaultState,
        ...publishData,
        editingURI: uri,
        uri: shortUri,
        currentUploads: state.currentUploads,
      };
    },
    [ACTIONS.UPDATE_UPLOAD_ADD]: (state: PublishState, action) => {
      const { file, params, uploader } = action.data;
      const currentUploads = Object.assign({}, state.currentUploads);

      currentUploads[params.guid] = {
        file,
        fileFingerprint: file ? serializeFileObj(file) : undefined, // TODO: get hash instead?
        progress: '0',
        params,
        uploader,
        resumable: !(uploader instanceof XMLHttpRequest),
      };

      return { ...state, currentUploads };
    },
    [ACTIONS.UPDATE_UPLOAD_PROGRESS]: (state: PublishState, action) => {
      const { guid, progress, status } = action.data;
      const key = guid;
      const currentUploads = Object.assign({}, state.currentUploads);

      if (guid === 'force--update') {
        return { ...state, currentUploads };
      } else if (guid === 'refresh--lock') {
        // Re-lock all uploads that are in progress under our tab.
        const uploadKeys = Object.keys(currentUploads);
        uploadKeys.forEach((k) => {
          if (currentUploads[k].uploader) {
            tusLockAndNotify(k);
          }
        });
      }

      if (!currentUploads[key]) {
        if (status === 'error' || status === 'conflict') {
          return { ...state, publishError: true };
        } else {
          return state;
        }
      }

      if (progress) {
        currentUploads[key].progress = progress;
        delete currentUploads[key].status;

        if (currentUploads[key].uploader.url) {
          // TUS has finally obtained an upload url from the server...
          if (!currentUploads[key].params.uploadUrl) {
            // ... Stash that to check later when resuming.
            // Ignoring immutable-update requirement (probably doesn't matter to the GUI).
            currentUploads[key].params.uploadUrl = currentUploads[key].uploader.url;
          }

          // ... lock this tab as the active uploader.
          tusLockAndNotify(key);
        }
      } else if (status) {
        currentUploads[key].status = status;

        switch (status) {
          case 'error':
          case 'conflict':
            delete currentUploads[key].uploader;
            break;
          case 'notify_ok':
            currentUploads[key].sdkRan = true;
            break;
          default:
            // Nothing to do for the rest
            break;
        }
      }

      return { ...state, currentUploads };
    },
    [ACTIONS.UPDATE_UPLOAD_REMOVE]: (state: PublishState, action) => {
      const { guid, params } = action.data;
      const key = guid || getOldKeyFromParam(params);

      if (state.currentUploads[key]) {
        const currentUploads = Object.assign({}, state.currentUploads);
        delete currentUploads[key];
        tusUnlockAndNotify(key);
        tusRemoveAndNotify(key);

        return { ...state, currentUploads };
      }

      return state;
    },
    [ACTIONS.REHYDRATE]: (state: PublishState, action) => {
      if (action && action.payload && action.payload.publish) {
        const newPublish = {
          ...action.payload.publish,
          filePath: undefined, // File is not serializable, so can't rehydrate.
          remoteFileUrl: undefined, // Clear for now until the component is able to re-populate on load.
        };

        // Cleanup for 'publish::currentUploads'
        if (newPublish.currentUploads) {
          const uploadKeys = Object.keys(newPublish.currentUploads);
          if (uploadKeys.length > 0) {
            // Clear uploader and corrupted params
            uploadKeys.forEach((key) => {
              const params = newPublish.currentUploads[key].params;
              if (!params || Object.keys(params).length === 0) {
                // The intended payload for the API is corrupted, so no point
                // retaining. Remove from the pending-uploads list.
                delete newPublish.currentUploads[key];
              } else {
                // The data is still good, so we can resume upload. We just need
                // to delete the previous reference of the tus-uploader (no
                // longer functional, will be re-created). An empty 'uploader'
                // also tells the GUI that we just rebooted.
                delete newPublish.currentUploads[key].uploader;
              }
            });
          } else {
            tusClearRemovedUploads();
          }

          tusClearLockedUploads();
        }

        return newPublish;
      }

      return state;
    },
  },
  defaultState
);
