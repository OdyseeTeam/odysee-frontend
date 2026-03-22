import * as PAGES from 'constants/pages';
import * as SETTINGS from 'constants/settings';
import React from 'react';
import classnames from 'classnames';
import { useLocation, useNavigate } from 'react-router-dom';
import UserEmailNew from 'component/userEmailNew';
import UserEmailVerify from 'component/userEmailVerify';
import UserFirstChannel from 'component/userFirstChannel';
import UserChannelFollowIntro from 'component/userChannelFollowIntro';
import UserTagFollowIntro from 'component/userTagFollowIntro';
import YoutubeSync from 'page/youtubeSync';
import { DEFAULT_BID_FOR_FIRST_CHANNEL } from 'component/userFirstChannel/view';
import { YOUTUBE_STATUSES } from 'lbryinc';
import REWARDS from 'rewards';
import UserVerify from 'component/userVerify';
import Spinner from 'component/spinner';
import useFetched from 'effects/use-fetched';
import Confetti from 'react-confetti';
import usePrevious from 'effects/use-previous';
import { lazyImport } from 'util/lazyImport';
import { SHOW_TAGS_INTRO } from 'config';
import REWARD_TYPES from 'rewards';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { selectGetSyncIsPending, selectSyncHash, selectPrefsReady } from 'redux/selectors/sync';
import { doClaimRewardType } from 'redux/actions/rewards';
import { doSetClientSetting } from 'redux/actions/settings';
import { selectClaimedRewards, makeSelectIsRewardClaimPending } from 'redux/selectors/rewards';
import { selectUserIsPending, selectYoutubeChannels, selectEmailToVerify, selectUser } from 'redux/selectors/user';
import { selectMyChannelClaims, selectFetchingMyChannels, selectCreatingChannel } from 'redux/selectors/claims';
import { selectBalance } from 'redux/selectors/wallet';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectInterestedInYoutubeSync } from 'redux/selectors/app';
import { doToggleInterestedInYoutubeSync } from 'redux/actions/app';
const YoutubeTransferStatus = lazyImport(
  () =>
    import(
      'component/youtubeTransferStatus'
      /* webpackChunkName: "youtubeTransferStatus" */
    )
);
const REDIRECT_PARAM = 'redirect';
const REDIRECT_IMMEDIATELY_PARAM = 'immediate';
const STEP_PARAM = 'step';

function setSettingAndSync(
  setClientSetting: (setting: string, value: boolean, sync: boolean | null | undefined) => void,
  setting: string,
  value: boolean
) {
  setClientSetting(setting, value, true);
}

function UserSignUp() {
  const dispatch = useAppDispatch();
  const emailToVerify = useAppSelector(selectEmailToVerify);
  const user = useAppSelector(selectUser);
  const channels = useAppSelector(selectMyChannelClaims);
  const claimedRewards = useAppSelector(selectClaimedRewards);
  const claimingReward = useAppSelector((state) =>
    makeSelectIsRewardClaimPending()(state, { reward_type: REWARD_TYPES.TYPE_CONFIRM_EMAIL })
  );
  const balance = useAppSelector(selectBalance);
  const fetchingChannels = useAppSelector(selectFetchingMyChannels);
  const youtubeChannels = useAppSelector(selectYoutubeChannels);
  const userFetchPending = useAppSelector(selectUserIsPending);
  const syncEnabled = useAppSelector((state) => selectClientSetting(state, SETTINGS.ENABLE_SYNC));
  const followingAcknowledged = useAppSelector((state) => selectClientSetting(state, SETTINGS.FOLLOWING_ACKNOWLEDGED));
  const tagsAcknowledged = useAppSelector((state) => selectClientSetting(state, SETTINGS.TAGS_ACKNOWLEDGED));
  const rewardsAcknowledged = useAppSelector((state) => selectClientSetting(state, SETTINGS.REWARDS_ACKNOWLEDGED));
  const syncingWallet = useAppSelector(selectGetSyncIsPending);
  const hasSynced = Boolean(useAppSelector(selectSyncHash));
  const creatingChannel = useAppSelector(selectCreatingChannel);
  const interestedInYoutubeSync = useAppSelector(selectInterestedInYoutubeSync);
  const prefsReady = useAppSelector(selectPrefsReady);

  const claimConfirmEmailReward = React.useCallback(
    () => dispatch(doClaimRewardType(REWARD_TYPES.TYPE_CONFIRM_EMAIL, { notifyError: false })),
    [dispatch]
  );
  const claimNewUserReward = React.useCallback(
    () => dispatch(doClaimRewardType(REWARD_TYPES.NEW_USER, { notifyError: false })),
    [dispatch]
  );
  const setClientSetting = React.useCallback(
    (setting, value, pushToPrefs) => dispatch(doSetClientSetting(setting, value, pushToPrefs)),
    [dispatch]
  );
  const navigate = useNavigate();
  const { search, pathname } = useLocation();
  const urlParams = new URLSearchParams(search);
  const redirect = urlParams.get(REDIRECT_PARAM);
  const step = urlParams.get(STEP_PARAM);
  const shouldRedirectImmediately = urlParams.get(REDIRECT_IMMEDIATELY_PARAM);
  const [initialSignInStep, setInitialSignInStep] = React.useState();
  const hasVerifiedEmail = user && user.has_verified_email;
  const rewardsApproved = user && user.is_reward_approved;
  const isIdentityVerified = user && user.is_identity_verified;
  const passwordSet = user && user.password_set;
  const hasFetchedReward = useFetched(claimingReward);
  const previousHasVerifiedEmail = usePrevious(hasVerifiedEmail);
  const channelCount = channels ? channels.length : 0;
  const hasClaimedEmailAward = claimedRewards.some((reward) => reward.reward_type === REWARDS.TYPE_CONFIRM_EMAIL);
  const hasYoutubeChannels = youtubeChannels && Boolean(youtubeChannels.length);
  const isYoutubeTransferComplete =
    hasYoutubeChannels &&
    youtubeChannels.every(
      (channel) =>
        channel.transfer_state === YOUTUBE_STATUSES.YOUTUBE_SYNC_COMPLETED_TRANSFER ||
        channel.sync_status === YOUTUBE_STATUSES.YOUTUBE_SYNC_ABANDONDED
    );
  // Complexity warning
  // We can't just check if we are currently fetching something
  // We may want to keep a component rendered while something is being fetched, instead of replacing it with the large spinner
  // The verbose variable names are an attempt to alleviate _some_ of the confusion from handling all edge cases that come from
  // reward claiming, channel creation, account syncing, and youtube transfer
  // The possible screens for the sign in flow
  const showEmail = !hasVerifiedEmail;
  const showEmailVerification = (emailToVerify && !hasVerifiedEmail) || (!hasVerifiedEmail && passwordSet);
  const showUserVerification =
    balance === 0 && hasVerifiedEmail && !rewardsApproved && !isIdentityVerified && !rewardsAcknowledged;
  const showChannelCreation =
    hasVerifiedEmail &&
    ((balance !== undefined &&
      balance !== null &&
      balance > DEFAULT_BID_FOR_FIRST_CHANNEL &&
      channelCount === 0 &&
      !hasYoutubeChannels) ||
      interestedInYoutubeSync);
  const showYoutubeTransfer = hasVerifiedEmail && hasYoutubeChannels && !isYoutubeTransferComplete;
  const showFollowIntro = step === 'channels' || (hasVerifiedEmail && !followingAcknowledged);
  const showTagsIntro = SHOW_TAGS_INTRO && (step === 'tags' || (hasVerifiedEmail && !tagsAcknowledged));
  const canHijackSignInFlowWithSpinner = hasVerifiedEmail && !showFollowIntro && !showTagsIntro && !rewardsAcknowledged;
  const showSpinnerForSync = syncingWallet && !hasSynced && balance === undefined;
  const isCurrentlyFetchingSomething = fetchingChannels || claimingReward || showSpinnerForSync || creatingChannel;
  const isWaitingForSomethingToFinish = (!hasFetchedReward && !hasClaimedEmailAward) || (syncEnabled && !hasSynced); // If the user has claimed the email award, we need to wait until the balance updates sometime in the future
  const showLoadingSpinner =
    canHijackSignInFlowWithSpinner && (isCurrentlyFetchingSomething || isWaitingForSomethingToFinish);

  React.useEffect(() => {
    if (previousHasVerifiedEmail === false && hasVerifiedEmail && prefsReady) {
      setSettingAndSync(setClientSetting, SETTINGS.FIRST_RUN_STARTED, true);
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [hasVerifiedEmail, previousHasVerifiedEmail, prefsReady]);
  React.useEffect(() => {
    // Don't claim the reward if sync is enabled until after a sync has been completed successfully
    // If we do it before, we could end up trying to sync a wallet with a non-zero balance which will fail to sync
    const delayForSync = syncEnabled && !hasSynced;

    if (hasVerifiedEmail && !hasClaimedEmailAward && !hasFetchedReward && !delayForSync) {
      claimConfirmEmailReward();
    }
  }, [
    hasVerifiedEmail,
    claimConfirmEmailReward,
    hasClaimedEmailAward,
    hasFetchedReward,
    syncEnabled,
    hasSynced,
    balance,
  ]);
  // Loop through this list from the end, until it finds a matching component
  // If it never finds one, assume the user has completed every step and redirect them
  const SIGN_IN_FLOW = [
    showEmail && (
      <UserEmailNew
        interestedInYoutubSync={interestedInYoutubeSync}
        doToggleInterestedInYoutubeSync={() => dispatch(doToggleInterestedInYoutubeSync())}
      />
    ),
    showEmailVerification && <UserEmailVerify />,
    showUserVerification && (
      <UserVerify
        onSkip={() => {
          setSettingAndSync(setClientSetting, SETTINGS.REWARDS_ACKNOWLEDGED, true);
        }}
      />
    ),
    showChannelCreation &&
      (interestedInYoutubeSync ? (
        <YoutubeSync inSignUpFlow doToggleInterestedInYoutubeSync={doToggleInterestedInYoutubeSync} />
      ) : (
        <UserFirstChannel doToggleInterestedInYoutubeSync={doToggleInterestedInYoutubeSync} />
      )),
    showFollowIntro && (
      <UserChannelFollowIntro
        onContinue={() => {
          if (urlParams.get('reset_scroll')) {
            urlParams.delete('reset_scroll');
            urlParams.append('reset_scroll', '2');
          }

          urlParams.delete(STEP_PARAM);
          setSettingAndSync(setClientSetting, SETTINGS.FOLLOWING_ACKNOWLEDGED, true);
          navigate(`${pathname}?${urlParams.toString()}`, { replace: true });
        }}
        onBack={() => {
          if (urlParams.get('reset_scroll')) {
            urlParams.delete('reset_scroll');
            urlParams.append('reset_scroll', '3');
          }

          setSettingAndSync(setClientSetting, SETTINGS.FOLLOWING_ACKNOWLEDGED, false);
          navigate(`${pathname}?${urlParams.toString()}`, { replace: true });
        }}
      />
    ),
    showTagsIntro && (
      <UserTagFollowIntro
        onContinue={() => {
          let url = `/$/${PAGES.AUTH}?reset_scroll=1&${STEP_PARAM}=channels`;

          if (redirect) {
            url += `&${REDIRECT_PARAM}=${redirect}`;
          }

          if (shouldRedirectImmediately) {
            url += `&${REDIRECT_IMMEDIATELY_PARAM}=true`;
          }

          navigate(url, { replace: true });
          setSettingAndSync(setClientSetting, SETTINGS.TAGS_ACKNOWLEDGED, true);
        }}
      />
    ),
    showYoutubeTransfer && (
      <div>
        <React.Suspense fallback={null}>
          <YoutubeTransferStatus />{' '}
          <Confetti
            recycle={false}
            style={{
              position: 'fixed',
            }}
          />
        </React.Suspense>
      </div>
    ),
    showLoadingSpinner && (
      <div className="main--empty">
        <Spinner />
      </div>
    ),
  ];

  function getSignInStep() {
    for (var i = SIGN_IN_FLOW.length - 1; i > -1; i--) {
      const Component = SIGN_IN_FLOW[i];

      if (Component) {
        // If we want to redirect immediately,
        // remember the first step so we can redirect once a new step has been reached
        // Ignore the loading step
        if (redirect && shouldRedirectImmediately) {
          if (!initialSignInStep) {
            setInitialSignInStep(i);
          } else if (i !== initialSignInStep && i !== SIGN_IN_FLOW.length - 1) {
            navigate(redirect, { replace: true });
          }
        }

        const scrollableSteps = [2, 4, 5];
        const isScrollable = scrollableSteps.includes(i);
        return [Component, isScrollable];
      }
    }

    return [undefined, false];
  }

  const [componentToRender, isScrollable] = getSignInStep();
  React.useEffect(() => {
    if (!componentToRender) {
      claimNewUserReward();
    }
  }, [componentToRender, claimNewUserReward]);

  if (!componentToRender) {
    navigate(redirect || '/', { replace: true });
  }

  return (
    <section
      className={classnames('main--contained', {
        'main--hoisted': isScrollable,
      })}
    >
      {componentToRender}
    </section>
  );
}

export default UserSignUp;
