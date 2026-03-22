/* eslint-disable react/prop-types */
import React from 'react';
import { createPortal } from 'react-dom';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import classnames from 'classnames';
import * as REACTION_TYPES from 'constants/reactions';
import Counter from 'component/counter';
import ClaimCollectionAddButton from 'component/claimCollectionAddButton';
import ChannelThumbnail from 'component/channelThumbnail';
import Icon from 'component/common/icon';
import { useIsShortsMobile } from 'effects/use-screensize';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectMyReactionForUri, selectLikeCountForUri, selectDislikeCountForUri } from 'redux/selectors/reactions';
import { doFetchReactions, doReactionLike, doReactionDislike } from 'redux/actions/reactions';
import {
  selectClaimForUri,
  selectIsStreamPlaceholderForUri,
  selectClaimIsMine,
  selectScheduledStateForUri,
  makeSelectTagInClaimOrChannelForUri,
  selectIsUriUnlisted,
  selectPermanentUrlForUri,
  selectChannelForClaimUri,
  selectChannelTitleForUri,
} from 'redux/selectors/claims';
import { selectIsSubscribedForUri } from 'redux/selectors/subscriptions';
import { doChannelSubscribe, doChannelUnsubscribe } from 'redux/actions/subscriptions';
import {
  DISABLE_SLIMES_VIDEO_TAG,
  DISABLE_SLIMES_ALL_TAG,
  DISABLE_REACTIONS_ALL_TAG,
  DISABLE_REACTIONS_VIDEO_TAG,
} from 'constants/tags';
import { doOpenModal } from 'redux/actions/app';

type Props = {
  hasPlaylist: boolean;
  onNext: () => void;
  onPrevious: () => void;
  isLoading?: boolean;
  isAtStart?: boolean;
  isAtEnd?: boolean;
  autoPlayNextShort: boolean;
  doToggleShortsAutoplay: () => void;
  uri: string;
  onCommentsClick: () => void;
  collectionId?: string;
  handleShareClick: () => void;
  onInfoClick: () => void;
};
const LIVE_REACTION_FETCH_MS = 1000 * 45;
const ShortsActions = React.memo<Props>(
  ({
    uri,
    hasPlaylist,
    onNext,
    onPrevious,
    isLoading,
    isAtStart,
    isAtEnd,
    autoPlayNextShort,
    onCommentsClick,
    doToggleShortsAutoplay,
    handleShareClick,
    onInfoClick,
  }: Props) => {
    const dispatch = useAppDispatch();

    const claim = useAppSelector((state) => selectClaimForUri(state, uri));
    const claimId = claim?.claim_id;
    const channelUrl = uri ? useAppSelector((state) => selectChannelForClaimUri(state, uri, true)) : undefined;

    const myReaction = useAppSelector((state) => selectMyReactionForUri(state, uri));
    const likeCount = useAppSelector((state) => selectLikeCountForUri(state, uri));
    const dislikeCount = useAppSelector((state) => selectDislikeCountForUri(state, uri));
    const isLivestreamClaim = useAppSelector((state) => selectIsStreamPlaceholderForUri(state, uri));
    const claimIsMine = useAppSelector((state) => selectClaimIsMine(state, claim));
    const scheduledState = useAppSelector((state) => selectScheduledStateForUri(state, uri));
    const disableSlimes = useAppSelector(
      (state) =>
        makeSelectTagInClaimOrChannelForUri(uri, DISABLE_SLIMES_ALL_TAG)(state) ||
        makeSelectTagInClaimOrChannelForUri(uri, DISABLE_SLIMES_VIDEO_TAG)(state)
    );
    const disableReactions = useAppSelector(
      (state) =>
        makeSelectTagInClaimOrChannelForUri(uri, DISABLE_REACTIONS_ALL_TAG)(state) ||
        makeSelectTagInClaimOrChannelForUri(uri, DISABLE_REACTIONS_VIDEO_TAG)(state)
    );
    const isUnlisted = useAppSelector((state) => selectIsUriUnlisted(state, uri));
    const isSubscribed = useAppSelector((state) => (channelUrl ? selectIsSubscribedForUri(state, channelUrl) : false));
    const channelPermanentUrl = useAppSelector((state) =>
      channelUrl ? selectPermanentUrlForUri(state, channelUrl) : undefined
    );
    const channelTitle = useAppSelector((state) =>
      channelUrl ? selectChannelTitleForUri(state, channelUrl) : undefined
    );

    const [avatarHover, setAvatarHover] = React.useState(false);
    const followRef = React.useRef(null);
    const [countersZeroed, setCountersZeroed] = React.useState(false);
    const [fireEffect, setFireEffect] = React.useState(false);
    const fireEffectTimeout = React.useRef(null);
    const [slimeEffect, setSlimeEffect] = React.useState(false);
    const slimeEffectTimeout = React.useRef(null);
    React.useEffect(() => {
      const el = document.querySelector('.shorts__viewer') || document.querySelector('.content__cover--shorts');
      if (!el) return;
      const cls = el.classList.contains('shorts__viewer') ? 'shorts__viewer--fire-glow' : 'content__cover--fire-glow';

      if (fireEffect) {
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
      } else {
        el.classList.remove(cls);
      }
    }, [fireEffect]);
    React.useEffect(() => {
      const el = document.querySelector('.shorts__viewer') || document.querySelector('.content__cover--shorts');
      if (!el) return;
      const cls = el.classList.contains('shorts__viewer') ? 'shorts__viewer--slime-glow' : 'content__cover--slime-glow';

      if (slimeEffect) {
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
      } else {
        el.classList.remove(cls);
      }
    }, [slimeEffect]);
    React.useEffect(() => {
      setCountersZeroed(false);
    }, [claimId]);
    React.useEffect(() => {
      function fetchReactions() {
        dispatch(doFetchReactions(claimId));
      }

      let fetchInterval;

      if (claimId) {
        fetchReactions();

        if (isLivestreamClaim) {
          fetchInterval = setInterval(fetchReactions, LIVE_REACTION_FETCH_MS);
        }
      }

      return () => {
        if (fetchInterval) {
          clearInterval(fetchInterval);
        }
      };
    }, [claimId, dispatch, isLivestreamClaim]);
    const isMobile = useIsShortsMobile();
    const content = (
      <div
        className={classnames('shorts-page__navigation', {
          'shorts-page__navigation--mobile-desktop': isMobile,
        })}
      >
        <>
          <Button
            className="shorts-page__actions-button shorts-page__actions-button--info"
            onClick={onInfoClick}
            icon={ICONS.INFO}
            iconSize={20}
            title={__('Show Details')}
            disabled={!hasPlaylist}
          />
          <Button
            className="shorts-page__actions-button shorts-page__actions-button--previous"
            onClick={() => {
              setCountersZeroed(true);
              onPrevious();
            }}
            icon={ICONS.UP}
            iconSize={24}
            title={__('Previous Short')}
            disabled={isAtStart || !hasPlaylist}
          />
          <Button
            className="shorts-page__actions-button shorts-page__actions-button--next"
            onClick={() => {
              setCountersZeroed(true);
              onNext();
            }}
            icon={ICONS.DOWN}
            iconSize={24}
            title={__('Next Short')}
            disabled={isAtEnd || !hasPlaylist}
          />
          <div
            className={classnames('shorts-page__ratings', {
              'shorts-page__ratings--no-slime': disableSlimes,
            })}
            style={{
              ...(disableReactions
                ? {
                    visibility: 'hidden',
                    pointerEvents: 'none',
                  }
                : {}),
              '--ratings-gradient': (() => {
                if (!Number.isInteger(likeCount) || !Number.isInteger(dislikeCount)) return 'var(--color-border)';
                const total = likeCount + (disableSlimes ? 0 : dislikeCount);
                if (total === 0) return 'var(--color-border)';
                const likePercent = (likeCount / total) * 100;
                if (likePercent === 100) return 'var(--color-fire)';
                if (likePercent === 0) return 'var(--color-slime)';
                const fireStop = Math.max(0, likePercent - 15);
                const slimeStop = Math.min(100, likePercent + 15);
                return `linear-gradient(to bottom, var(--color-fire) ${fireStop}%, var(--color-slime) ${slimeStop}%)`;
              })(),
            }}
          >
            <div className="fire-and-count">
              <Button
                onClick={() => {
                  if (myReaction !== REACTION_TYPES.LIKE) {
                    setFireEffect(false);
                    clearTimeout(fireEffectTimeout.current);
                    requestAnimationFrame(() => {
                      setFireEffect(true);
                      fireEffectTimeout.current = setTimeout(() => setFireEffect(false), 2000);
                    });
                  }

                  dispatch(doReactionLike(uri));
                }}
                icon={myReaction === REACTION_TYPES.LIKE ? ICONS.FIRE_ACTIVE : ICONS.FIRE}
                iconSize={16}
                title={__('I Like This')}
                disabled={!hasPlaylist}
                requiresAuth
                authSrc="filereaction_like"
                className={classnames('shorts-page__actions-button button--file-action button-like', {
                  'button--fire': myReaction === REACTION_TYPES.LIKE,
                })}
                label={
                  <>
                    {myReaction === REACTION_TYPES.LIKE && (
                      <>
                        <div className="button__fire-glow" />
                        <div className="button__fire-particle1" />
                        <div className="button__fire-particle2" />
                        <div className="button__fire-particle3" />
                        <div className="button__fire-particle4" />
                        <div className="button__fire-particle5" />
                        <div className="button__fire-particle6" />
                      </>
                    )}
                  </>
                }
              />
              {countersZeroed ? (
                <span className="counter-inline">0</span>
              ) : (
                <Counter
                  key={'fire-' + (claimId || '')}
                  value={Number.isInteger(likeCount) ? likeCount : 0}
                  precision={0}
                  startFrom={0}
                />
              )}
            </div>
            <div
              className="slime-and-count"
              style={
                disableSlimes
                  ? {
                      visibility: 'hidden',
                    }
                  : undefined
              }
            >
              <Button
                requiresAuth
                authSrc={'filereaction_dislike'}
                title={__('I dislike this')}
                className={classnames('shorts-page__actions-button button--file-action button-dislike', {
                  'button--slime': myReaction === REACTION_TYPES.DISLIKE,
                })}
                disabled={!hasPlaylist}
                label={
                  <>
                    {myReaction === REACTION_TYPES.DISLIKE && (
                      <>
                        <div className="button__slime-stain" />
                        <div className="button__slime-drop1" />
                        <div className="button__slime-drop2" />
                      </>
                    )}
                  </>
                }
                iconSize={16}
                icon={myReaction === REACTION_TYPES.DISLIKE ? ICONS.SLIME_ACTIVE : ICONS.SLIME}
                onClick={() => {
                  if (myReaction !== REACTION_TYPES.DISLIKE) {
                    setSlimeEffect(false);
                    clearTimeout(slimeEffectTimeout.current);
                    requestAnimationFrame(() => {
                      setSlimeEffect(true);
                      slimeEffectTimeout.current = setTimeout(() => setSlimeEffect(false), 3000);
                    });
                  }

                  dispatch(doReactionDislike(uri));
                }}
              />
              {countersZeroed ? (
                <span className="counter-inline">0</span>
              ) : (
                <Counter
                  key={'slime-' + (claimId || '')}
                  value={Number.isInteger(dislikeCount) ? dislikeCount : 0}
                  precision={0}
                  startFrom={0}
                />
              )}
            </div>
          </div>
          {channelUrl ? (
            <div
              ref={followRef}
              className="shorts-actions__item"
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
              onClick={() => {
                const sub = {
                  channelName: channelUrl.split('/').pop(),
                  uri: channelPermanentUrl,
                };

                if (!isSubscribed && followRef.current) {
                  const container = followRef.current;
                  container.querySelectorAll('.shorts-heart-particle').forEach((el) => el.remove());
                  const badge = container.querySelector('.shorts-floating-action__subscribe');

                  if (badge) {
                    const containerRect = container.getBoundingClientRect();
                    const badgeRect = badge.getBoundingClientRect();
                    const cx = badgeRect.left - containerRect.left + badgeRect.width / 2;
                    const cy = badgeRect.top - containerRect.top;

                    for (let i = 0; i < 6; i++) {
                      const heart = document.createElement('span');
                      heart.textContent = '\u2764';
                      heart.className = 'shorts-heart-particle';
                      heart.style.left = cx + (Math.random() * 16 - 8) + 'px';
                      heart.style.top = cy + 'px';
                      heart.style.animationDelay = Math.random() * 0.4 + 's';
                      heart.style.fontSize = 10 + Math.random() * 8 + 'px';
                      container.appendChild(heart);
                    }
                  }
                }

                if (isSubscribed) {
                  dispatch(
                    doOpenModal(MODALS.CONFIRM, {
                      title: __('Unfollow %channel%?', {
                        channel: channelTitle || sub.channelName,
                      }),
                      onConfirm: (closeModal) => {
                        dispatch(doChannelUnsubscribe(sub));
                        closeModal();
                      },
                      labelOk: __('Unfollow'),
                    })
                  );
                } else {
                  dispatch(doChannelSubscribe(sub));
                }
              }}
            >
              <div className="shorts-floating-action shorts-floating-action--avatar">
                <ChannelThumbnail
                  key={channelUrl}
                  uri={channelUrl}
                  hideStakedIndicator
                  className="shorts-floating-action__avatar"
                />
                <div
                  className={classnames('shorts-floating-action__subscribe', {
                    'shorts-floating-action__subscribe--active': isSubscribed,
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
              <p>{isSubscribed ? __('Following') : __('Follow')}</p>
            </div>
          ) : (
            <div className="shorts-actions__item shorts-actions__item--placeholder" />
          )}

          <div className="shorts-actions__item">
            <Button
              className="shorts-page__actions-button shorts-page__actions-button--comments"
              onClick={onCommentsClick}
              icon={ICONS.COMMENTS_LIST}
              iconSize={16}
              title={__('Comments')}
              disabled={!hasPlaylist}
            />
            <p>{__('Comments')}</p>
          </div>

          <div className="shorts-actions__group">
            <div className="shorts-actions__item">
              <ClaimCollectionAddButton uri={uri} isShortsPage />
            </div>

            {!isUnlisted && (
              <div className="shorts-actions__item">
                <Button
                  className="shorts-page__actions-button"
                  onClick={() =>
                    dispatch(
                      doOpenModal(MODALS.REPOST, {
                        uri,
                      })
                    )
                  }
                  icon={ICONS.REPOST}
                  iconSize={16}
                  title={__('Repost this content')}
                  disabled={!hasPlaylist}
                  requiresChannel
                />
                <p>{__('Repost')}</p>
              </div>
            )}
          </div>
          <div className="shorts-actions__group shorts-actions__group--bottom">
            <div className="shorts-actions__item">
              <Button
                className="shorts-page__actions-button shorts-page__actions-button--share"
                onClick={handleShareClick}
                icon={ICONS.SHARE}
                iconSize={16}
                title={isUnlisted ? __('Get a sharable link for your unlisted content') : __('Share')}
                disabled={!hasPlaylist}
              />
              <p>{__('Share')}</p>
            </div>
            <div className="shorts-actions__item">
              <Button
                className={classnames('shorts-page__actions-button button-bubble', {
                  'button-bubble--active': autoPlayNextShort,
                })}
                title={__('Autoplay Next')}
                onClick={doToggleShortsAutoplay}
                icon={ICONS.AUTOPLAY_NEXT}
                iconSize={16}
                disabled={isLoading || !hasPlaylist}
              />
              <p>{__('Auto Next')}</p>
            </div>
          </div>
        </>
      </div>
    );
    const portalTarget =
      typeof document !== 'undefined'
        ? document.querySelector('.shorts__viewer') || document.querySelector('.content__cover--shorts')
        : null;
    const effectOverlays = portalTarget && (
      <>
        {fireEffect &&
          createPortal(
            <div className="shorts-viewer-flames">
              {Array.from(
                {
                  length: 50,
                },
                (_, i) => (
                  <div
                    key={i}
                    className="shorts-viewer-flames__particle"
                    style={{
                      left: `calc(${(i / 50) * 100}% - 35px)`,
                      animationDelay: `${Math.random()}s`,
                    }}
                  />
                )
              )}
            </div>,
            portalTarget
          )}
        {slimeEffect && createPortal(<div className="shorts-viewer-slime" />, portalTarget)}
      </>
    );

    if (isMobile && document.body) {
      return (
        <>
          {effectOverlays}
          {createPortal(content, document.body)}
        </>
      );
    }

    return (
      <>
        {effectOverlays}
        {content}
      </>
    );
  }
);
export default ShortsActions;
