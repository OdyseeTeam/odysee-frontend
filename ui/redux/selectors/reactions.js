import * as REACTION_TYPES from 'constants/reactions';
import { selectClaimForUri } from 'redux/selectors/claims';

const selectState = (state) => state.reactions || {};

export const selectReactionsById = (state) => selectState(state).reactionsById;
export const selectFetchingReactions = (state) => selectState(state).fetchingReactions;
export const selectReactionsForClaimId = (state, claimId) => {
  const reactionsById = selectReactionsById(state);
  return claimId ? reactionsById[claimId] : {};
};

export const selectMyReactionForClaimId = (state, claimId) => {
  const reactions = selectReactionsForClaimId(state, claimId);

  if (!claimId || !reactions || !reactions.my_reactions) {
    return undefined;
  }

  const myReactions = reactions.my_reactions[claimId];
  if (!myReactions) return undefined;

  if (myReactions[REACTION_TYPES.LIKE]) {
    return REACTION_TYPES.LIKE;
  } else if (myReactions[REACTION_TYPES.DISLIKE]) {
    return REACTION_TYPES.DISLIKE;
  } else {
    return undefined;
  }
};

export const selectLikeCountForClaimId = (state, claimId) => {
  const reactions = selectReactionsForClaimId(state, claimId);

  if (!claimId || !reactions || !reactions.my_reactions || !reactions.others_reactions) {
    return undefined;
  }

  let count = 0;

  if (reactions.others_reactions && reactions.others_reactions[claimId]) {
    count += reactions.others_reactions[claimId][REACTION_TYPES.LIKE] || 0;
  }
  if (reactions.my_reactions && reactions.my_reactions[claimId]) {
    count += reactions.my_reactions[claimId][REACTION_TYPES.LIKE] || 0;
  }

  return count;
};

export const selectDislikeCountForClaimId = (state, claimId) => {
  const reactions = selectReactionsForClaimId(state, claimId);

  if (!claimId || !reactions || !reactions.my_reactions || !reactions.others_reactions) {
    return undefined;
  }

  let count = 0;

  if (reactions.others_reactions && reactions.others_reactions[claimId]) {
    count += reactions.others_reactions[claimId][REACTION_TYPES.DISLIKE] || 0;
  }
  if (reactions.my_reactions && reactions.my_reactions[claimId]) {
    count += reactions.my_reactions[claimId][REACTION_TYPES.DISLIKE] || 0;
  }

  return count;
};

export const selectReactionsForUri = (state, uri) => {
  const claim = selectClaimForUri(state, uri);
  return claim ? selectReactionsForClaimId(state, claim.claim_id) : {};
};

export const selectMyReactionForUri = (state, uri) => {
  const claim = selectClaimForUri(state, uri);
  return claim ? selectMyReactionForClaimId(state, claim.claim_id) : undefined;
};

export const selectLikeCountForUri = (state, uri) => {
  const claim = selectClaimForUri(state, uri);
  return claim ? selectLikeCountForClaimId(state, claim.claim_id) : undefined;
};

export const selectDislikeCountForUri = (state, uri) => {
  const claim = selectClaimForUri(state, uri);
  return claim ? selectDislikeCountForClaimId(state, claim.claim_id) : undefined;
};
