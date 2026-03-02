// @flow
import React from 'react';
import classnames from 'classnames';
import Button from 'component/button';
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
}: Props) => {
  const Placeholder = <Skeleton variant="text" animation="wave" className="reaction-count-placeholder" />;

  return (
    <div className="shorts-mobile-panel__actions">
      <div className="shorts-mobile-panel__action-item">
        <Button
          onClick={() => doReactionLike(uri)}
          icon={myReaction === REACTION_TYPES.LIKE ? ICONS.FIRE_ACTIVE : ICONS.FIRE}
          iconSize={16}
          title={__('I Like This')}
          requiresAuth
          authSrc="filereaction_like"
          className={classnames('shorts-mobile-panel__action-button button--file-action button-like', {
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
            'button--slime': myReaction === REACTION_TYPES.DISLIKE,
          })}
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
          onClick={() => doReactionDislike(uri)}
        />
        <span className="shorts-mobile-panel__count">
          {Number.isInteger(dislikeCount) ? formatNumberWithCommas(dislikeCount, 0) : Placeholder}
        </span>
      </div>

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
  );
};

export default MobileActions;
