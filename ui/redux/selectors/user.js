import { createSelector } from 'reselect';

export const selectState = (state) => state.user || {};

export const selectAuthenticationIsPending = (state) => selectState(state).authenticationIsPending;
export const selectUserIsPending = (state) => selectState(state).userIsPending;
export const selectUser = (state) => selectState(state).user;
export const selectEmailAlreadyExists = (state) => selectState(state).emailAlreadyExists;
export const selectEmailDoesNotExist = (state) => selectState(state).emailDoesNotExist;
export const selectResendingVerificationEmail = (state) => selectState(state).resendingVerificationEmail;

export const selectUserEmail = createSelector(selectUser, (user) =>
  user ? user.primary_email || user.latest_claimed_email : null
);

export const selectUserPhone = createSelector(selectUser, (user) => (user ? user.phone_number : null));

export const selectUserCountryCode = createSelector(selectUser, (user) => (user ? user.country_code : null));

export const selectEmailToVerify = createSelector(
  selectState,
  selectUserEmail,
  (state, userEmail) => state.emailToVerify || userEmail
);

export const selectPhoneToVerify = createSelector(
  selectState,
  selectUserPhone,
  (state, userPhone) => state.phoneToVerify || userPhone
);

export const selectYoutubeChannels = createSelector(selectUser, (user) => (user ? user.youtube_channels : null));

export const selectUserIsRewardApproved = createSelector(selectUser, (user) => user && user.is_reward_approved);

export const selectEmailNewIsPending = (state) => selectState(state).emailNewIsPending;

export const selectEmailNewErrorMessage = createSelector(selectState, (state) => {
  const error = state.emailNewErrorMessage;
  return typeof error === 'object' && error !== null ? error.message : error;
});

export const selectPasswordExists = (state) => selectState(state).passwordExistsForUser;
export const selectPasswordResetIsPending = (state) => selectState(state).passwordResetPending;
export const selectPasswordResetSuccess = (state) => selectState(state).passwordResetSuccess;

export const selectPasswordResetError = createSelector(selectState, (state) => {
  const error = state.passwordResetError;
  return typeof error === 'object' && error !== null ? error.message : error;
});

export const selectPasswordSetIsPending = (state) => selectState(state).passwordSetPending;
export const selectPasswordSetSuccess = (state) => selectState(state).passwordSetSuccess;

export const selectPasswordSetError = createSelector(selectState, (state) => {
  const error = state.passwordSetError;
  return typeof error === 'object' && error !== null ? error.message : error;
});

export const selectPhoneNewErrorMessage = (state) => selectState(state).phoneNewErrorMessage;
export const selectEmailVerifyIsPending = (state) => selectState(state).emailVerifyIsPending;
export const selectEmailVerifyErrorMessage = (state) => selectState(state).emailVerifyErrorMessage;
export const selectPhoneNewIsPending = (state) => selectState(state).phoneNewIsPending;
export const selectPhoneVerifyIsPending = (state) => selectState(state).phoneVerifyIsPending;
export const selectPhoneVerifyErrorMessage = (state) => selectState(state).phoneVerifyErrorMessage;
export const selectIdentityVerifyIsPending = (state) => selectState(state).identityVerifyIsPending;
export const selectIdentityVerifyErrorMessage = (state) => selectState(state).identityVerifyErrorMessage;

export const selectUserVerifiedEmail = createSelector(selectUser, (user) => user && user.has_verified_email);

export const selectUserIsVerificationCandidate = createSelector(
  selectUser,
  (user) => user && (!user.has_verified_email || !user.is_identity_verified)
);

export const selectAccessToken = (state) => selectState(state).accessToken;
export const selectUserInviteStatusIsPending = (state) => selectState(state).inviteStatusIsPending;
export const selectUserInvitesRemaining = (state) => selectState(state).invitesRemaining;
export const selectUserInvitees = (state) => selectState(state).invitees;

export const selectUserInviteStatusFailed = createSelector(
  selectUserInvitesRemaining,
  () => selectUserInvitesRemaining === null
);

export const selectUserInviteNewIsPending = (state) => selectState(state).inviteNewIsPending;
export const selectUserInviteNewErrorMessage = (state) => selectState(state).inviteNewErrorMessage;
export const selectUserInviteReferralLink = (state) => selectState(state).referralLink;

export const selectUserInviteReferralCode = createSelector(selectState, (state) =>
  state.referralCode ? state.referralCode[0] : ''
);

export const selectYouTubeImportPending = (state) => selectState(state).youtubeChannelImportPending;
export const selectYouTubeImportError = (state) => selectState(state).youtubeChannelImportErrorMessage;
export const selectSetReferrerPending = (state) => selectState(state).referrerSetIsPending;
export const selectSetReferrerError = (state) => selectState(state).referrerSetError;

export const selectYouTubeImportVideosComplete = createSelector(selectState, (state) => {
  const total = state.youtubeChannelImportTotal;
  const complete = state.youtubeChannelImportComplete || 0;

  if (total) {
    return [complete, total];
  }
});

export const makeSelectUserPropForProp = (prop) => createSelector(selectUser, (user) => (user ? user[prop] : null));
