// @flow
import React from 'react';
import { createPortal } from 'react-dom';
import classnames from 'classnames';
import Button from 'component/button';
import ChannelThumbnail from 'component/channelThumbnail';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import * as REACTION_TYPES from 'constants/reactions';
import Skeleton from '@mui/material/Skeleton';
import { formatNumberWithCommas } from 'util/number';

type Props = {
  uri: string,
  likeCount: number,
  dislikeCount: number,
  myReaction: ?string,
  doReactionLike: (uri: string) => void,
  doReactionDislike: (uri: string) => void,
  onCommentsClick: () => void,
  onShareClick: () => void,
  onInfoButtonClick: () => void,
  autoPlayNextShort: boolean,
  doToggleShortsAutoplay: () => void,
  isUnlisted: ?boolean,
  channelUrl: ?string,
  isSubscribed: boolean,
  channelPermanentUrl: ?string,
  doChannelSubscribe: (sub: {}) => void,
  doChannelUnsubscribe: (sub: {}) => void,
};

const MobileActions = ({
  uri,
  likeCount,
  dislikeCount,
  myReaction,
  doReactionLike,
  doReactionDislike,
  onCommentsClick,
  onShareClick,
  onInfoButtonClick,
  autoPlayNextShort,
  doToggleShortsAutoplay,
  isUnlisted,
  channelUrl,
  isSubscribed,
  channelPermanentUrl,
  doChannelSubscribe,
  doChannelUnsubscribe,
}: Props) => {
  const [optimisticReaction, setOptimisticReaction] = React.useState(undefined);
  const [fireButtonGlow, setFireButtonGlow] = React.useState(false);
  const fireButtonGlowTimeout = React.useRef(null);
  const [slimeButtonGlow, setSlimeButtonGlow] = React.useState(false);
  const slimeButtonGlowTimeout = React.useRef(null);
  const [fireEffect, setFireEffect] = React.useState(false);
  const fireEffectTimeout = React.useRef(null);
  const [slimeEffect, setSlimeEffect] = React.useState(false);
  const slimeEffectTimeout = React.useRef(null);
  const [avatarHover, setAvatarHover] = React.useState(false);

  React.useEffect(() => {
    setOptimisticReaction(undefined);
  }, [myReaction]);

  const effectiveReaction = optimisticReaction !== undefined ? optimisticReaction : myReaction;
  const isFireActive = effectiveReaction === REACTION_TYPES.LIKE;
  const isSlimeActive = effectiveReaction === REACTION_TYPES.DISLIKE;

  const Placeholder = <Skeleton variant="text" animation="wave" className="reaction-count-placeholder" />;

  return (
    <>
      {fireEffect &&
        createPortal(
          <div className="shorts-mobile-flames">
            {Array.from({ length: 50 }, (_, i) => (
              <div
                key={i}
                className="shorts-mobile-flames__particle"
                style={{
                  left: `calc(${(i / 50) * 100}% - 35px)`,
                  animationDelay: `${Math.random()}s`,
                }}
              />
            ))}
          </div>,
          // $FlowFixMe
          document.body
        )}

      {/* $FlowFixMe */}
      {slimeEffect && createPortal(<div className="shorts-mobile-slime" />, document.body)}

      <div className="shorts-mobile-panel__actions">
        <div className="shorts-mobile-panel__action-item">
          <Button
            onClick={() => {
              setOptimisticReaction(isFireActive ? null : REACTION_TYPES.LIKE);
              if (!isFireActive) {
                setFireButtonGlow(false);
                setFireEffect(false);
                clearTimeout(fireButtonGlowTimeout.current);
                clearTimeout(fireEffectTimeout.current);
                requestAnimationFrame(() => {
                  setFireButtonGlow(true);
                  setFireEffect(true);
                  fireButtonGlowTimeout.current = setTimeout(() => setFireButtonGlow(false), 2000);
                  fireEffectTimeout.current = setTimeout(() => setFireEffect(false), 2000);
                });
              }
              doReactionLike(uri);
            }}
            icon={isFireActive ? ICONS.FIRE_ACTIVE : ICONS.FIRE}
            iconSize={16}
            title={__('I Like This')}
            requiresAuth
            authSrc="filereaction_like"
            className={classnames('shorts-mobile-panel__action-button button--file-action button-like', {
              'button--fire': isFireActive,
              'button--fire-glow-pulse': fireButtonGlow,
            })}
          />
          <span className="shorts-mobile-panel__count">
            {Number.isInteger(likeCount) ? formatNumberWithCommas(likeCount, 0) : Placeholder}
          </span>
        </div>

        <div className="shorts-mobile-panel__action-item">
          <Button
            requiresAuth
            authSrc={'filereaction_dislike'}
            title={__('I dislike this')}
            className={classnames('shorts-mobile-panel__action-button button--file-action button-dislike', {
              'button--slime': isSlimeActive,
              'button--slime-glow-pulse': slimeButtonGlow,
            })}
            iconSize={16}
            icon={isSlimeActive ? ICONS.SLIME_ACTIVE : ICONS.SLIME}
            onClick={() => {
              setOptimisticReaction(isSlimeActive ? null : REACTION_TYPES.DISLIKE);
              if (!isSlimeActive) {
                setSlimeButtonGlow(false);
                setSlimeEffect(false);
                clearTimeout(slimeButtonGlowTimeout.current);
                clearTimeout(slimeEffectTimeout.current);
                requestAnimationFrame(() => {
                  setSlimeButtonGlow(true);
                  setSlimeEffect(true);
                  slimeButtonGlowTimeout.current = setTimeout(() => setSlimeButtonGlow(false), 3000);
                  slimeEffectTimeout.current = setTimeout(() => setSlimeEffect(false), 3000);
                });
              }
              doReactionDislike(uri);
            }}
          />
          <span className="shorts-mobile-panel__count">
            {Number.isInteger(dislikeCount) ? formatNumberWithCommas(dislikeCount, 0) : Placeholder}
          </span>
        </div>

        {channelUrl && (
          <div
            className="shorts-mobile-panel__action-item"
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            onClick={(e) => {
              e.stopPropagation();
              const sub = { channelName: channelUrl.split('/').pop(), uri: channelPermanentUrl };
              if (isSubscribed) {
                doChannelUnsubscribe(sub);
              } else {
                doChannelSubscribe(sub);
              }
            }}
          >
            <div className="shorts-mobile-panel__avatar-wrapper">
              <ChannelThumbnail key={channelUrl} uri={channelUrl} hideStakedIndicator />
              <div
                className={classnames('shorts-mobile-panel__subscribe-icon', {
                  'shorts-mobile-panel__subscribe-icon--active': isSubscribed,
                })}
              >
                <Icon
                  icon={
                    isSubscribed && avatarHover
                      ? ICONS.UNSUBSCRIBE
                      : isSubscribed || avatarHover
                      ? ICONS.SUBSCRIBED
                      : ICONS.SUBSCRIBE
                  }
                  size={10}
                />
              </div>
            </div>
            <span className="shorts-mobile-panel__count">{isSubscribed ? __('Following') : __('Follow')}</span>
          </div>
        )}

        <div className="shorts-mobile-panel__action-item">
          <Button
            className="shorts-mobile-panel__action-button"
            onClick={onCommentsClick}
            icon={ICONS.COMMENTS_LIST}
            iconSize={16}
          />
          <span className="shorts-mobile-panel__count">{__('Comments')}</span>
        </div>

        <div className="shorts-mobile-panel__action-item">
          <Button
            className="shorts-mobile-panel__action-button"
            onClick={onShareClick}
            icon={ICONS.SHARE}
            iconSize={16}
            title={isUnlisted ? __('Get a sharable link for your unlisted content') : __('Share')}
          />
          <span className="shorts-mobile-panel__count">{__('Share')}</span>
        </div>

        <div className="shorts-mobile-panel__action-item">
          <Button
            className="shorts-mobile-panel__action-button"
            onClick={onInfoButtonClick}
            icon={ICONS.INFO}
            iconSize={16}
          />
          <span className="shorts-mobile-panel__count">{__('Details')}</span>
        </div>

        <div className="shorts-mobile-panel__action-item">
          <Button
            className={classnames('shorts-mobile-panel__action-button button-bubble', {
              'button-bubble--active': autoPlayNextShort,
            })}
            requiresAuth={IS_WEB}
            title={__('Autoplay Next')}
            onClick={doToggleShortsAutoplay}
            icon={ICONS.AUTOPLAY_NEXT}
            iconSize={24}
          />
          <span className="shorts-mobile-panel__count">{__('Auto Next')}</span>
        </div>
      </div>
    </>
  );
};

export default MobileActions;
