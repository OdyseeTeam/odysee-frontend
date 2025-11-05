// @flow
import React from 'react';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import classnames from 'classnames';
import * as MODALS from 'constants/modal_types';
import * as REACTION_TYPES from 'constants/reactions';
import Skeleton from '@mui/material/Skeleton';
import { formatNumberWithCommas } from 'util/number';

type Props = {
  hasPlaylist: boolean,
  onNext: () => void,
  onPrevious: () => void,
  isLoading?: boolean,
  currentIndex?: number,
  totalVideos?: number,
  isAtStart?: boolean,
  isAtEnd?: boolean,
  autoPlayNextShort: boolean,
  doToggleShortsAutoplay: () => void,
  uri: string,
  // redux
  claimId?: string,
  likeCount: number,
  dislikeCount: number,
  myReaction: ?string,
  isLivestreamClaim?: boolean,
  scheduledState: ClaimScheduledState,
  disableSlimes: boolean,
  doFetchReactions: (claimId: ?string) => void,
  doReactionLike: (uri: string) => void,
  doReactionDislike: (uri: string) => void,
  onCommentsClick: () => void,
  webShareable: boolean,
  collectionId?: string,
  isUnlisted: ?boolean,
  doOpenModal: (id: string, modalProps: any) => void,
};

const LIVE_REACTION_FETCH_MS = 1000 * 45;

const ShortsActions = React.memo<Props>(
  ({
    uri,
    claimId,
    myReaction,
    likeCount,
    dislikeCount,
    isLivestreamClaim,
    scheduledState,
    disableSlimes,
    doFetchReactions,
    doReactionLike,
    doReactionDislike,
    hasPlaylist,
    onNext,
    onPrevious,
    isLoading,
    currentIndex = -1,
    totalVideos = 0,
    isAtStart,
    isAtEnd,
    autoPlayNextShort,
    onCommentsClick,
    doToggleShortsAutoplay,
    webShareable,
    collectionId,
    isUnlisted,
    doOpenModal,
  }: Props) => {
    const handleShareClick = React.useCallback(() => {
      doOpenModal(MODALS.SOCIAL_SHARE, { uri, webShareable, collectionId });
    }, [doOpenModal, uri, webShareable, collectionId]);

    React.useEffect(() => {
      function fetchReactions() {
        doFetchReactions(claimId);
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
    }, [claimId, doFetchReactions, isLivestreamClaim]);
    const Placeholder = <Skeleton variant="text" animation="wave" className="reaction-count-placeholder" />;

    return (
      <div className="shorts-page__navigation">
        <>
          <Button
            className="shorts-page__actions-button shorts-page__actions-button--previous"
            onClick={onPrevious}
            icon={ICONS.UP}
            iconSize={24}
            title={__('Previous Short')}
            disabled={isLoading || isAtStart || !hasPlaylist}
          />
          <Button
            className="shorts-page__actions-button shorts-page__actions-button--next"
            onClick={onNext}
            icon={ICONS.DOWN}
            iconSize={24}
            title={__('Next Short')}
            disabled={isLoading || isAtEnd || !hasPlaylist}
          />
          <Button
            className="shorts-page__actions-button shorts-page__actions-button--comments"
            onClick={onCommentsClick}
            icon={ICONS.COMMENTS_LIST}
            iconSize={20}
            title={__('Comments')}
            disabled={isLoading || !hasPlaylist}
          />
          <Button
            className="shorts-page__actions-button shorts-page__actions-button--share"
            onClick={handleShareClick}
            icon={ICONS.SHARE}
            iconSize={20}
            title={isUnlisted ? __('Get a sharable link for your unlisted content') : __('Share')}
            disabled={isLoading || !hasPlaylist}
          />
          {/* <Button
              className="shorts-page__actions-button shorts-page__actions-button--share"
              onClick={onNext}
              icon={ICONS.SUPPORT}
              iconSize={20}
              title={__('Next Short')}
              disabled={isLoading || isAtEnd}
            /> */}
          <div className="fire-and-count">
            <Button
              onClick={() => doReactionLike(uri)}
              icon={myReaction === REACTION_TYPES.LIKE ? ICONS.FIRE_ACTIVE : ICONS.FIRE}
              iconSize={20}
              title={__('I Like This')}
              disabled={isLoading || !hasPlaylist}
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
            {Number.isInteger(likeCount) ? <span>{formatNumberWithCommas(likeCount, 0)}</span> : Placeholder}
          </div>
          <div className="slime-and-count">
            <Button
              requiresAuth
              authSrc={'filereaction_dislike'}
              title={__('I dislike this')}
              className={classnames('shorts-page__actions-button button--file-action button-dislike', {
                'button--slime': myReaction === REACTION_TYPES.DISLIKE,
              })}
              disabled={isLoading || !hasPlaylist}
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
              iconSize={20}
              icon={myReaction === REACTION_TYPES.DISLIKE ? ICONS.SLIME_ACTIVE : ICONS.SLIME}
              onClick={() => doReactionDislike(uri)}
            />
            {Number.isInteger(dislikeCount) ? <span>{formatNumberWithCommas(dislikeCount, 0)}</span> : Placeholder}
          </div>
          <Button
            className={classnames('shorts-page__actions-button button-bubble', {
              'button-bubble--active': autoPlayNextShort,
            })}
            isShorts
            requiresAuth={IS_WEB}
            title={__('Autoplay Next')}
            onClick={doToggleShortsAutoplay}
            icon={ICONS.AUTOPLAY_NEXT}
            iconSize={24}
            disabled={isLoading || !hasPlaylist}
          />
        </>
      </div>
    );
  }
);

export default ShortsActions;
