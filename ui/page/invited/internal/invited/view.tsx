import { SITE_NAME } from 'config';
import * as PAGES from 'constants/pages';
import React from 'react';
import Button from 'component/button';
import ClaimPreview from 'component/claimPreview';
import Card from 'component/common/card';
import { buildURI, parseURI } from 'util/lbryURI';
import { ERRORS } from 'lbryinc';
import { formatLbryUrlForWeb } from 'util/url';
import ContentTab from 'page/claim/internal/claimPageComponent/internal/channelPage/tabs/contentTab';
import I18nMessage from 'component/i18nMessage';
import Spinner from 'component/spinner';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectUserVerifiedEmail, selectReferrer, selectSetReferrerError } from 'redux/selectors/user';
import { doClaimRefereeReward } from 'redux/actions/rewards';
import { selectHasUnclaimedRefereeReward } from 'redux/selectors/rewards';
import { doUserSetReferrerForUri } from 'redux/actions/user';
import { selectIsSubscribedForUri } from 'redux/selectors/subscriptions';
import { selectChannelTitleForUri } from 'redux/selectors/claims';
import { doChannelSubscribe } from 'redux/actions/subscriptions';
type Props = {
  referrerUri: string | null | undefined;
};

function Invited(props: Props) {
  const { referrerUri } = props;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const userHasVerifiedEmail = useAppSelector(selectUserVerifiedEmail);
  const referrerSet = useAppSelector(selectReferrer);
  const referrerSetError = useAppSelector(selectSetReferrerError);
  const hasUnclaimedRefereeReward = useAppSelector(selectHasUnclaimedRefereeReward);
  const isSubscribed = useAppSelector((state) => selectIsSubscribedForUri(state, referrerUri));
  const channelTitle = useAppSelector((state) => selectChannelTitleForUri(state, referrerUri));
  const {
    isChannel: referrerIsChannel,
    channelName: referrerChannelName,
    channelClaimId: referrerChannelClaimId,
    streamName: referrerStreamName,
    streamClaimId: referrerStreamClaimId,
  } = referrerUri ? parseURI(referrerUri) : {};
  const redirectPath =
    formatLbryUrlForWeb(
      buildURI({
        channelName: referrerChannelName,
        channelClaimId: referrerChannelClaimId,
        streamName: referrerStreamName,
        streamClaimId: referrerStreamClaimId,
      })
    ) || '/';
  const referrerCode = getReferrerCodeFromCurrentPath();

  function handleDone() {
    navigate(redirectPath);
  }

  function getReferrerCodeFromCurrentPath() {
    const splitUriArray = pathname.split('/');
    return splitUriArray[splitUriArray.length - 1];
  }

  // always follow if it's a channel
  React.useEffect(() => {
    if (referrerIsChannel && !isSubscribed && userHasVerifiedEmail && referrerUri) {
      let channelName;

      try {
        const { claimName } = parseURI(referrerUri);
        channelName = claimName;
      } catch (e) {}

      if (channelName) {
        dispatch(
          doChannelSubscribe({
            channelName: channelName,
            uri: referrerUri,
          })
        );
      }
    }
  }, [referrerUri, isSubscribed, dispatch, userHasVerifiedEmail, referrerIsChannel]);
  React.useEffect(() => {
    if (referrerSet === undefined && userHasVerifiedEmail) {
      dispatch(doClaimRefereeReward());
    }
  }, [dispatch, userHasVerifiedEmail, referrerSet]);
  React.useEffect(() => {
    const referrer = referrerUri || referrerCode;

    if (referrerSet === undefined && referrer) {
      dispatch(doUserSetReferrerForUri(referrer));
    }
  }, [referrerUri, referrerCode, dispatch, referrerSet]);
  const cardProps = React.useMemo(
    () => ({
      body: <ClaimPreview uri={referrerUri} type="small" />,
    }),
    [referrerUri]
  );
  const cardChildren = React.useMemo(
    () =>
      referrerIsChannel && (
        <div className="claim-preview--channel">
          <div className="section">
            <ContentTab uri={referrerUri} defaultPageSize={3} defaultInfiniteScroll={false} />
          </div>
        </div>
      ),
    [referrerIsChannel, referrerUri]
  );

  // Case 1: Loading
  if (referrerSet === undefined && referrerUri) {
    return (
      <div className="main--empty">
        <Spinner />
      </div>
    );
  }

  // Case 2: Already claimed reward
  if (referrerSetError === ERRORS.ALREADY_CLAIMED) {
    return (
      <Card
        {...cardProps}
        title={__('Whoa!')}
        subtitle={
          referrerIsChannel
            ? __("You've already claimed your referrer, but we've followed this channel for you.")
            : __('You already claimed your credit.')
        }
        actions={<Button button="primary" label={__('Done!')} onClick={handleDone} />}
      >
        {cardChildren}
      </Card>
    );
  }

  // Case 3: No reward to claim (referrer claim is null/deleted, or invite is invalid)
  if (!referrerSet || (referrerSetError && hasUnclaimedRefereeReward)) {
    return (
      <Card
        {...cardProps}
        title={__('Welcome!')}
        subtitle={__('Something went wrong with your invite link.')}
        actions={
          <>
            <p className="error__text">{__('Not a valid invite')}</p>

            <div className="section__actions">
              <Button
                button="primary"
                label={userHasVerifiedEmail ? __('Verify') : __('Sign up')}
                navigate={
                  userHasVerifiedEmail ? `/$/${PAGES.REWARDS_VERIFY}` : `/$/${PAGES.AUTH}?redirect=/$/${PAGES.REWARDS}`
                }
              />
              <Button button="link" label={__('Explore')} onClick={handleDone} />
            </div>
          </>
        }
      >
        {cardChildren}
      </Card>
    );
  }

  const SignUpButton = (buttonProps: any) => (
    <Button
      button="link"
      label={userHasVerifiedEmail ? __('Finish verification') : __('Sign up')}
      navigate={
        userHasVerifiedEmail
          ? `/$/${PAGES.REWARDS_VERIFY}?redirect=/$/${PAGES.INVITE}${redirectPath}`
          : `/$/${PAGES.AUTH}?redirect=/$/${PAGES.INVITE}${redirectPath}`
      }
      {...buttonProps}
    />
  );

  // Case 4: Reward can be claimed
  return (
    <Card
      {...cardProps}
      title={
        referrerIsChannel
          ? __('%channel_name% invites you to the party!', {
              channel_name: channelTitle,
            })
          : __("You're invited!")
      }
      subtitle={
        referrerIsChannel ? (
          <I18nMessage
            tokens={{
              channel_name: channelTitle,
              signup_link: <SignUpButton />,
              site_name: SITE_NAME,
            }}
          >
            %channel_name% is waiting for you on %site_name%. %signup_link% to follow them.
          </I18nMessage>
        ) : (
          <I18nMessage
            tokens={{
              signup_link: <SignUpButton />,
            }}
          >
            Content freedom and a present are waiting for you. %signup_link% to claim it.
          </I18nMessage>
        )
      }
      actions={
        <div className="section__actions">
          <SignUpButton button="primary" />
          <Button button="link" label={__('Skip')} onClick={handleDone} />
        </div>
      }
    >
      {cardChildren}
    </Card>
  );
}

export default Invited;
