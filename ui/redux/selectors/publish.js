// @flow
import { createSelector } from 'reselect';
import { createCachedSelector } from 're-reselect';
import { parseURI, buildURI, sanitizeName } from 'util/lbryURI';
import {
  selectClaimsById,
  selectMyClaimsWithoutChannels,
  selectResolvingUris,
  selectClaimsByUri,
  selectCollectionClaimPublishUpdateMetadataForId,
} from 'redux/selectors/claims';
import { CHANNEL_ANONYMOUS } from 'constants/claim';
import { SCHEDULED_LIVESTREAM_TAG } from 'constants/tags';
import {
  selectCollectionForId,
  selectClaimIdsForCollectionId,
  selectIsCollectionPrivateForId,
  selectCollectionHasEditsForId,
  selectCollectionHasUnsavedEditsForId,
  selectCollectionTitleForId,
} from 'redux/selectors/collections';
import { selectActiveChannelClaimId, selectIncognito } from 'redux/selectors/app';
import { selectMembershipsListByCreatorId } from 'redux/selectors/memberships';
import { filterMembershipTiersWithPerk, getRestrictivePerkName } from 'util/memberships';

const selectState = (state) => state.publish || {};

export const selectIsStillEditing = createSelector(selectState, (publishState) => {
  const { editingURI, uri } = publishState;

  if (!editingURI || !uri) {
    return false;
  }

  const { isChannel: currentIsChannel, streamName: currentClaimName, channelName: currentContentName } = parseURI(uri);
  const { isChannel: editIsChannel, streamName: editClaimName, channelName: editContentName } = parseURI(editingURI);

  // Depending on the previous/current use of a channel, we need to compare different things
  // ex: going from a channel to anonymous, the new uri won't return contentName, so we need to use claimName
  const currentName = currentIsChannel ? currentContentName : currentClaimName;
  const editName = editIsChannel ? editContentName : editClaimName;
  return currentName === editName;
});

export const selectPublishFormValues = createSelector(
  selectState,
  (state) => state.settings,
  selectIsStillEditing,
  (publishState, settingsState, isStillEditing) => {
    // === TODO: FIX_LANGUAGE_STATE ===
    // This is not the best place to transform the language state, as it causes
    // a new object to be returned each time. This selector should be 1:1 with
    // the store.
    // -- Alternative --
    // Leave the 'language' state as undefined and display that as "Default"
    // in the View. Later, when creating the SDK payload, do the logic below.

    const { languages, ...formValues } = publishState;
    const language = languages && languages.length && languages[0];
    const { clientSettings } = settingsState;
    const { language: languageSet } = clientSettings;

    let actualLanguage;
    // Sets default if editing a claim with a set language
    if (!language && isStillEditing && languageSet) {
      actualLanguage = languageSet;
    } else {
      actualLanguage = language || languageSet || 'en';
    }

    return { ...formValues, language: actualLanguage };
  }
);

export const selectPublishFormValue = (state: State, item: string) => selectState(state)[item];

export const selectMyClaimForUri = createCachedSelector(
  selectPublishFormValues,
  selectIsStillEditing,
  selectClaimsById,
  selectMyClaimsWithoutChannels,
  (state, caseSensitive) => caseSensitive,
  ({ editingURI, uri }, isStillEditing, claimsById, myClaims, caseSensitive = true) => {
    let { channelName: contentName, streamName: claimName } = parseURI(uri);
    const { streamClaimId: editClaimId } = parseURI(editingURI);

    // If isStillEditing
    // They clicked "edit" from the file page
    // They haven't changed the channel/name after clicking edit
    // Get the claim so they can edit without re-uploading a new file
    if (isStillEditing) {
      return claimsById[editClaimId];
    } else {
      if (caseSensitive) {
        return myClaims.find((claim) =>
          !contentName ? claim.name === claimName : claim.name === contentName || claim.name === claimName
        );
      } else {
        contentName = contentName ? contentName.toLowerCase() : contentName;
        claimName = claimName ? claimName.toLowerCase() : claimName;

        return myClaims.find((claim) => {
          const n = claim && claim.name ? claim.name.toLowerCase() : null;
          return !contentName ? n === claimName : n === contentName || n === claimName;
        });
      }
    }
  }
)((state, caseSensitive = true) => `selectMyClaimForUri-${caseSensitive ? '1' : '0'}`);

export const selectIsResolvingPublishUris = createSelector(
  selectState,
  selectResolvingUris,
  ({ uri, name }, resolvingUris) => {
    if (uri) {
      const isResolvingUri = resolvingUris.includes(uri);
      const { isChannel } = parseURI(uri);

      let isResolvingShortUri;
      if (isChannel && name) {
        const shortUri = buildURI({ streamName: name });
        isResolvingShortUri = resolvingUris.includes(shortUri);
      }

      return isResolvingUri || isResolvingShortUri;
    }

    return false;
  }
);

export const selectTakeOverAmount = createSelector(
  selectState,
  selectMyClaimForUri,
  selectClaimsByUri,
  ({ name }, myClaimForUri, claimsByUri) => {
    if (!name) {
      return null;
    }

    // We only care about the winning claim for the short uri
    const shortUri = buildURI({ streamName: name });
    const claimForShortUri = claimsByUri[shortUri];

    if (!myClaimForUri && claimForShortUri) {
      return claimForShortUri.meta.effective_amount;
    } else if (myClaimForUri && claimForShortUri) {
      // https://github.com/lbryio/lbry/issues/1476
      // We should check the current effective_amount on my claim to see how much additional lbc
      // is needed to win the claim. Currently this is not possible during a takeover.
      // With this, we could say something like, "You have x lbc in support, if you bid y additional LBC you will control the claim"
      // For now just ignore supports. We will just show the winning claim's bid amount
      return claimForShortUri.meta.effective_amount || claimForShortUri.amount;
    }

    return null;
  }
);

// ****************************************************************************
// selectValidTierIdsForCurrentForm
// ****************************************************************************

/**
 * Based on the current publish form state, return the list of relevant
 * restrictive Tier IDs that the creator can enable for the claim being
 * published.
 *
 * @return ?Array<number>
 */
export const selectValidTierIdsForCurrentForm = createSelector(
  (state: State) => state.publish.type,
  (state: State) => state.publish.liveCreateType,
  (state: State) => state.publish.liveEditType,
  (state: State) => state.publish.channelId,
  selectIncognito,
  selectMembershipsListByCreatorId,
  (type, liveCreateType, liveEditType, channelId, incognito, tiersByCreatorId) => {
    if (incognito || !channelId) {
      return undefined;
    }

    const perkName = getRestrictivePerkName(type, liveCreateType, liveEditType);
    const tiers: CreatorMemberships = tiersByCreatorId[channelId] || [];
    const validTiers = filterMembershipTiersWithPerk(tiers, perkName);
    return validTiers.map((tier) => tier?.membership_id);
  }
);

// ****************************************************************************
// selectMemberRestrictionStatus
// ****************************************************************************

export const selectMemberRestrictionStatus = createSelector(
  (state: State) => state.publish.memberRestrictionOn,
  (state: State) => state.publish.memberRestrictionTierIds,
  (state: State) => state.publish.visibility,
  (state: State) => state.publish.channelId,
  selectIncognito,
  selectMembershipsListByCreatorId,
  selectValidTierIdsForCurrentForm,
  (memberRestrictionOn, memberRestrictionTierIds, visibility, channelId, incognito, tiersByCreatorId, validTierIds) => {
    const isUnlisted = visibility === 'unlisted';
    const hasTiers = Boolean(tiersByCreatorId[channelId]);
    const hasTiersWithRestrictions = validTierIds ? validTierIds.length > 0 : false;
    const isApplicable = !isUnlisted && !incognito && hasTiers && hasTiersWithRestrictions;
    const enabled = memberRestrictionOn;
    const hasSelectedTiers = memberRestrictionTierIds.length > 0;
    const isSelectionValid = !enabled || (enabled && hasSelectedTiers);

    const status: MemberRestrictionStatus = {
      isApplicable: isApplicable,
      isSelectionValid: isSelectionValid,
      isRestricting: isApplicable && enabled && hasSelectedTiers,
      details: {
        isUnlisted: isUnlisted,
        isAnonymous: incognito,
        hasTiers: hasTiers,
        hasTiersWithRestrictions: hasTiersWithRestrictions,
      },
    };

    return status;
  }
);

// ****************************************************************************
// TUS/Upload
// ****************************************************************************

export const selectCurrentUploads = (state: State) => selectState(state).currentUploads;

export const selectUploadCount = createSelector(
  selectCurrentUploads,
  (currentUploads) => currentUploads && Object.keys(currentUploads).length
);

// ****************************************************************************
// ****************************************************************************

export const selectIsScheduled = (state: State) =>
  selectState(state).tags.some((t) => t.name === SCHEDULED_LIVESTREAM_TAG);

export const selectCollectionClaimUploadParamsForId = (state: State, collectionId: string) => {
  const isPrivate = selectIsCollectionPrivateForId(state, collectionId);
  const collection = selectCollectionForId(state, collectionId);
  const collectionTitle = selectCollectionTitleForId(state, collectionId);
  const collectionClaimIds = selectClaimIdsForCollectionId(state, collectionId);
  const claims = collectionClaimIds && collectionClaimIds.filter(Boolean);
  const activeChannelId = selectActiveChannelClaimId(state);

  const privateCollectionParams = {
    title: collectionTitle,
    description: collection.description,
    thumbnail_url: collection.thumbnail?.url,
    claims,
  };

  if (isPrivate) {
    const collectionPublishCreateParams: CollectionPublishCreateParams = {
      ...privateCollectionParams,
      bid: 0.0001,
      channel_id: activeChannelId,
      name: sanitizeName(collectionTitle),
      tags: [],
    };

    return collectionPublishCreateParams;
  }

  const collectionClaimMetadata = selectCollectionClaimPublishUpdateMetadataForId(state, collectionId);

  // $FlowFixMe please
  const collectionClaimUploadParams: CollectionPublishCreateParams & CollectionPublishUpdateParams = {
    channel_id: activeChannelId,
    ...(collectionClaimMetadata || {}),
  };

  const hasEdits = selectCollectionHasEditsForId(state, collectionId);
  const hasUnSavedEdits = selectCollectionHasUnsavedEditsForId(state, collectionId);

  if (hasEdits || hasUnSavedEdits) {
    // $FlowFixMe please
    Object.assign(collectionClaimUploadParams, privateCollectionParams);
  }

  return collectionClaimUploadParams;
};

export const selectIsNonPublicVisibilityAllowed = (state: State) => {
  const channel = selectPublishFormValue(state, 'channel');
  return channel && channel !== CHANNEL_ANONYMOUS;
};
