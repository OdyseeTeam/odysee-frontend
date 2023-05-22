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
import * as THUMBNAIL_STATUSES from 'constants/thumbnail_upload_statuses';
import { CHANNEL_ANONYMOUS } from 'constants/claim';
import { PAYWALL } from 'constants/publish';

// This is the old key formula. Retain it for now to allow users to delete
// any pending uploads. Can be removed from January 2022 onwards.
const getOldKeyFromParam = (params) => `${params.name}#${params.channel || 'anonymous'}`;

// @see 'flow-typed/publish.js' for documentation
const defaultState: PublishState = {
  type: 'file',
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
  name: '',
  nameError: undefined,
  bid: 0.01,
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
  isLivestreamPublish: false,
  replaySource: 'keep',
  visibility: 'public',
  scheduledShow: false,
};

export const publishReducer = handleActions(
  {
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
      const currentTs = Date.now() / 1000;
      const visibility = getValue('visibility');
      const releaseTime = getValue('releaseTime');
      const isEditing = Boolean(getValue('editingURI'));
      const isLivestream = getValue('isLivestreamPublish');

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
              const originalTs = state.claimToEdit?.value?.release_time || 0;
              if (originalTs < currentTs) {
                auto.releaseTimeError = 'Please set to a future date.';
              }
            } else {
              auto.releaseTimeError = 'Set a scheduled release date.';
            }
          }
          break;
        default:
          assert(null, `unhandled visibility: "${visibility}"`);
          break;
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
        const newPublish = { ...action.payload.publish };

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
