import { ESTIMATED_FEE, MINIMUM_PUBLISH_BID } from 'constants/claim';
import { COPYRIGHT, OTHER } from 'constants/licenses';
import { PAYWALL } from 'constants/publish';
import * as PUBLISH from 'constants/publish';
import {
  LBRY_FIRST_TAG,
  MEMBERS_ONLY_CONTENT_TAG,
  PURCHASE_TAG,
  PURCHASE_TAG_OLD,
  RENTAL_TAG,
  RENTAL_TAG_OLD,
  SCHEDULED_LIVESTREAM_TAG,
  SCHEDULED_TAGS,
  VISIBILITY_TAGS,
} from 'constants/tags';
import { isStreamPlaceholderClaim } from 'util/claim';
import { creditsToString } from 'util/format-credits';
import { TO_SECONDS } from 'util/stripe';

export function getVideoBitrate(size, duration) {
  const s = Number(size);
  const d = Number(duration);
  if (s && d) {
    return (s * 8) / d;
  } else {
    return 0;
  }
}

export function handleBidChange(bid, amount, balance, setBidError, setParam) {
  const totalAvailableBidAmount = (parseFloat(amount) || 0.0) + (parseFloat(balance) || 0.0);

  setParam({ bid: bid });

  if (bid <= 0.0 || isNaN(bid)) {
    setBidError(__('Deposit cannot be 0'));
  } else if (totalAvailableBidAmount < bid) {
    setBidError(
      __('Deposit cannot be higher than your available balance: %balance%', { balance: totalAvailableBidAmount })
    );
  } else if (totalAvailableBidAmount - bid < ESTIMATED_FEE) {
    setBidError(__('Please decrease your deposit to account for transaction fees'));
  } else if (bid < MINIMUM_PUBLISH_BID) {
    setBidError(__('Your deposit must be higher'));
  } else {
    setBidError('');
  }
}

// TODO remove this or better decide whether app should delete languages[2+]
// This was added because a previous update setting was duplicating language codes
export function dedupeLanguages(languages) {
  if (languages.length <= 1) {
    return languages;
  } else if (languages.length === 2) {
    if (languages[0] !== languages[1]) {
      return languages;
    } else {
      return [languages[0]];
    }
  } else if (languages.length > 2) {
    const newLangs = [];
    languages.forEach((l) => {
      if (!newLangs.includes(l)) {
        newLangs.push(l);
      }
    });
    return newLangs;
  }
}

export function handleLanguageChange(index, code, languageParam, setParams, params) {
  let langs = [...languageParam];
  if (index === 0) {
    if (code === PUBLISH.LANG_NONE) {
      // clear all
      langs = [];
    } else {
      langs[0] = code;
      if (langs[0] === langs[1]) {
        langs.length = 1;
      }
    }
  } else {
    if (code === PUBLISH.LANG_NONE || code === langs[0]) {
      langs.splice(1, 1);
    } else {
      langs[index] = code;
    }
  }
  setParams(params ? { ...params, languages: langs } : { languages: langs });
}

// @flow
export function resolvePublishPayload(
  publishData: UpdatePublishState,
  myClaimForUri: ?StreamClaim,
  myChannels: ?Array<ChannelClaim>,
  preview: boolean
) {
  const {
    type,
    liveCreateType,
    liveEditType,
    name,
    bid,
    filePath,
    description,
    language,
    releaseTime,
    licenseUrl,
    licenseType,
    otherLicenseDescription,
    thumbnail,
    channel,
    title,
    paywall,
    fee,
    tags,
    optimize,
    remoteFileUrl,
  } = publishData;

  // Handle scenario where we have a claim that has the same name as a channel we are publishing with.
  const myClaimForUriEditing = myClaimForUri && myClaimForUri.name === name ? myClaimForUri : null;

  let publishingLicense;
  switch (licenseType) {
    case COPYRIGHT:
    case OTHER:
      publishingLicense = otherLicenseDescription;
      break;
    default:
      publishingLicense = licenseType;
  }

  // get the claim id from the channel name, we will use that instead
  const namedChannelClaim = myChannels ? myChannels.find((myChannel) => myChannel.name === channel) : null;
  const channelId = namedChannelClaim ? namedChannelClaim.claim_id : '';

  const nowTimeStamp = Number(Math.round(Date.now() / 1000));
  const { claim_id: claimId } = myClaimForUri || {};

  const publishPayload: PublishParams = {
    name,
    title,
    description,
    locations: [],
    bid: creditsToString(bid),
    languages: [language],
    thumbnail_url: thumbnail,
    release_time: PAYLOAD.releaseTime(nowTimeStamp, releaseTime, myClaimForUriEditing, publishData) || nowTimeStamp,
    blocking: true,
    preview: false,
    ...(claimId ? { claim_id: claimId } : {}), // 'stream_update' support
    ...(optimize ? { optimize_file: true } : {}),
    ...(thumbnail ? { thumbnail_url: thumbnail } : {}),
    ...(channelId ? { channel_id: channelId } : {}),
    ...(licenseUrl ? { license_url: licenseUrl } : {}),
    ...(publishingLicense ? { license: publishingLicense } : {}),
  };

  const tagSet = new Set(tags.map((t) => t.name));

  PAYLOAD.tags.useLbryUploader(tagSet, publishData);
  PAYLOAD.tags.scheduledLivestream(tagSet, publishData, publishPayload.release_time, nowTimeStamp);
  PAYLOAD.tags.fiatPaywall(tagSet, publishData);
  PAYLOAD.tags.membershipRestrictions(tagSet, publishData, publishPayload.channel_id);
  PAYLOAD.tags.visibility(tagSet, publishData);

  publishPayload.tags = Array.from(tagSet);

  if (myClaimForUriEditing && myClaimForUriEditing.value && myClaimForUriEditing.value.locations) {
    // $FlowFixMe please
    publishPayload.locations = myClaimForUriEditing.value.locations;
  }

  if (paywall === PAYWALL.SDK && publishData.visibility === 'public') {
    if (fee && fee.currency && Number(fee.amount) > 0) {
      publishPayload.fee_currency = fee.currency;
      publishPayload.fee_amount = creditsToString(fee.amount);
    }
  }

  // Only pass file on new uploads, not metadata only edits.
  // The sdk will figure it out
  if (filePath) {
    if (
      type !== 'livestream' ||
      (type === 'livestream' && liveCreateType === 'edit_placeholder' && liveEditType === 'upload_replay')
    ) {
      // $FlowFixMe please
      publishPayload.file_path = filePath;
    }
  }

  if (remoteFileUrl) {
    if (
      type === 'livestream' &&
      (liveCreateType === 'choose_replay' || (liveCreateType === 'edit_placeholder' && liveEditType === 'use_replay'))
    ) {
      publishPayload.remote_url = remoteFileUrl;
    }
  }

  if (preview) {
    publishPayload.preview = true;
    publishPayload.optimize_file = false;
  }

  return publishPayload;
}

/**
 * Helper functions to resolve SDK's publish payload.
 */
const PAYLOAD = {
  releaseTime: (nowTs: number, userEnteredTs: ?number, claimToEdit: ?StreamClaim, publishData: UpdatePublishState) => {
    const isEditing = Boolean(claimToEdit);
    const { liveEditType } = publishData;

    const past = {};

    if (isEditing && claimToEdit) {
      const tags = claimToEdit.value?.tags || [];
      past.wasHidden = tags.includes(VISIBILITY_TAGS.UNLISTED) || tags.includes(VISIBILITY_TAGS.PRIVATE);
      past.wasScheduled = tags.includes(SCHEDULED_TAGS.SHOW) || tags.includes(SCHEDULED_TAGS.HIDE);
      past.timestamp = claimToEdit.timestamp;
      past.release_time = claimToEdit.value?.release_time;
      past.creation_timestamp = claimToEdit.meta?.creation_timestamp;
      past.isStreamPlaceholder = isStreamPlaceholderClaim(claimToEdit);
    }

    switch (publishData.visibility) {
      case 'public':
      case 'private':
      case 'unlisted':
        if (isEditing) {
          if (past.isStreamPlaceholder) {
            assert(liveEditType === 'use_replay' || liveEditType === 'upload_replay' || liveEditType === 'update_only');

            if (liveEditType === 'use_replay' || liveEditType === 'upload_replay') {
              const originalTs = Number(past.release_time || past.timestamp);
              return originalTs > nowTs ? nowTs : originalTs;
            } else {
              return userEnteredTs === undefined ? nowTs : userEnteredTs;
            }
          }

          if (userEnteredTs === undefined) {
            return past.wasScheduled ? past.creation_timestamp : Number(past.release_time || past.timestamp);
          } else {
            return userEnteredTs;
          }
        } else {
          if (userEnteredTs === undefined) {
            return nowTs;
          } else {
            return userEnteredTs;
          }
        }

      case 'scheduled':
        if (isEditing) {
          if (userEnteredTs === undefined) {
            return past.wasHidden ? past.creation_timestamp : Number(past.release_time || past.timestamp);
          } else {
            return userEnteredTs;
          }
        } else {
          // The reducer enforces '>Now' through releaseTimeError, but double-check in case UI broke:
          assert(userEnteredTs, 'New scheduled publish cannot have undefined release time');
          return userEnteredTs;
        }

      default:
        assert(false, `unhandled: "${publishData.visibility}"`);
        break;
    }
  },

  tags: {
    useLbryUploader: (tagSet: Set<string>, publishData: UpdatePublishState) => {
      if (publishData.useLBRYUploader) {
        tagSet.add(LBRY_FIRST_TAG);
      }
    },

    scheduledLivestream: (tagSet: Set<string>, publishData: UpdatePublishState, releaseTime, nowTime) => {
      const { liveCreateType, liveEditType } = publishData;
      const isPlaceholderClaim =
        liveCreateType === 'new_placeholder' ||
        (liveCreateType === 'edit_placeholder' && liveEditType === 'update_only');

      if (isPlaceholderClaim && releaseTime && releaseTime > nowTime) {
        // Add internal scheduled tag if claim is a livestream and is being scheduled in the future.
        tagSet.add(SCHEDULED_LIVESTREAM_TAG);
      } else {
        // Clear it if the claim is converted to a regular video.
        tagSet.delete(SCHEDULED_LIVESTREAM_TAG);
      }
    },

    fiatPaywall: (tagSet: Set<string>, publishData: UpdatePublishState) => {
      const {
        paywall,
        fiatPurchaseEnabled,
        fiatPurchaseFee,
        fiatRentalEnabled,
        fiatRentalFee,
        fiatRentalExpiration,
        visibility,
      } = publishData;

      const refSet = new Set(tagSet);
      refSet.forEach((t) => {
        if (
          t === RENTAL_TAG ||
          t === PURCHASE_TAG ||
          t.startsWith(`${RENTAL_TAG}:`) ||
          t.startsWith(`${PURCHASE_TAG}:`) ||
          t.startsWith(RENTAL_TAG_OLD) ||
          t.startsWith(PURCHASE_TAG_OLD)
        ) {
          tagSet.delete(t);
        }
      });

      if (visibility !== 'public') {
        // Payment options disabled.
        return;
      }

      if (paywall === PAYWALL.FIAT) {
        // Purchase
        if (fiatPurchaseEnabled && fiatPurchaseFee?.currency && Number(fiatPurchaseFee.amount) > 0) {
          tagSet.add(PURCHASE_TAG);
          tagSet.add(`${PURCHASE_TAG}:${fiatPurchaseFee.amount.toFixed(2)}`);
        }

        // Rental
        if (
          fiatRentalEnabled &&
          fiatRentalFee?.currency &&
          Number(fiatRentalFee.amount) > 0 &&
          fiatRentalExpiration?.unit &&
          Number(fiatRentalExpiration.value) > 0
        ) {
          const seconds = fiatRentalExpiration.value * (TO_SECONDS[fiatRentalExpiration.unit] || 3600);
          tagSet.add(RENTAL_TAG);
          tagSet.add(`${RENTAL_TAG}:${fiatRentalFee.amount.toFixed(2)}:${seconds}`);
        }
      }
    },

    membershipRestrictions: (tagSet: Set<string>, publishData: UpdatePublishState, channel_id: ?string) => {
      tagSet.delete(MEMBERS_ONLY_CONTENT_TAG);

      if (publishData.visibility !== 'unlisted') {
        const membersOnly = publishData.memberRestrictionOn && publishData.memberRestrictionTierIds.length > 0;
        if (membersOnly && channel_id) {
          tagSet.add(MEMBERS_ONLY_CONTENT_TAG);
        }
      }
    },

    visibility: (tagSet: Set<string>, publishData: UpdatePublishState) => {
      const { visibility } = publishData;

      tagSet.delete(VISIBILITY_TAGS.PRIVATE);
      tagSet.delete(VISIBILITY_TAGS.UNLISTED);
      tagSet.delete(SCHEDULED_TAGS.SHOW);
      tagSet.delete(SCHEDULED_TAGS.HIDE);

      switch (visibility) {
        case 'public':
          break; // Nothing to do
        case 'private':
          tagSet.add(VISIBILITY_TAGS.PRIVATE);
          break;
        case 'unlisted':
          tagSet.add(VISIBILITY_TAGS.UNLISTED);
          break;
        case 'scheduled':
          tagSet.add(publishData.scheduledShow ? SCHEDULED_TAGS.SHOW : SCHEDULED_TAGS.HIDE);
          break;
        default:
          assert(false, `unhandled: "${visibility}"`);
          break;
      }
    },
  },
};
