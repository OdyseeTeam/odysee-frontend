// @flow
import React from 'react';
import classnames from 'classnames';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import * as REACTION_TYPES from 'constants/reactions';
import { formatNumberWithCommas } from 'util/number';

type Props = {
  uri: string,
  claimId: string,
  navigateUrl: string,
  onPrevious: ?() => void,
  onNext: ?() => void,
  likeCount: number,
  dislikeCount: number,
  myReaction: ?string,
  doFetchReactions: (claimId: string) => void,
  doReactionLike: (uri: string) => void,
  doReactionDislike: (uri: string) => void,
  autoPlayNextShort: boolean,
  doToggleShortsAutoplay: () => void,
  doSetShortsSidePanel: (isOpen: boolean) => void,
};

const FloatingShortsActions = ({
  uri,
  claimId,
  navigateUrl,
  onPrevious,
  onNext,
  likeCount,
  dislikeCount,
  myReaction,
  doFetchReactions,
  doReactionLike,
  doReactionDislike,
  autoPlayNextShort,
  doToggleShortsAutoplay,
  doSetShortsSidePanel,
}: Props) => {
  React.useEffect(() => {
    if (claimId) doFetchReactions(claimId);
  }, [claimId, doFetchReactions]);

  return (
    <>
      <div className="content__shorts-floating-nav">
        <div className="shorts-floating-action">
          <Button
            onClick={onPrevious}
            icon={ICONS.UP}
            iconSize={16}
            title={__('Previous Short')}
            disabled={!onPrevious}
          />
        </div>

        <div className="shorts-floating-action">
          <Button onClick={onNext} icon={ICONS.DOWN} iconSize={16} title={__('Next Short')} disabled={!onNext} />
        </div>
      </div>

      <div className="content__shorts-floating-actions">
        <div className="shorts-floating-action">
          <Button
            onClick={() => doReactionLike(uri)}
            icon={myReaction === REACTION_TYPES.LIKE ? ICONS.FIRE_ACTIVE : ICONS.FIRE}
            iconSize={14}
            requiresAuth
            authSrc="filereaction_like"
            className={classnames('button--file-action button-like', {
              'button--fire': myReaction === REACTION_TYPES.LIKE,
            })}
            label={
              myReaction === REACTION_TYPES.LIKE ? (
                <>
                  <div className="button__fire-glow" />
                  <div className="button__fire-particle1" />
                  <div className="button__fire-particle2" />
                  <div className="button__fire-particle3" />
                  <div className="button__fire-particle4" />
                  <div className="button__fire-particle5" />
                  <div className="button__fire-particle6" />
                </>
              ) : null
            }
          />
          {Number.isInteger(likeCount) && (
            <span className="shorts-floating-action__count">{formatNumberWithCommas(likeCount, 0)}</span>
          )}
        </div>

        <div className="shorts-floating-action">
          <Button
            onClick={() => doReactionDislike(uri)}
            icon={myReaction === REACTION_TYPES.DISLIKE ? ICONS.SLIME_ACTIVE : ICONS.SLIME}
            iconSize={14}
            requiresAuth
            authSrc="filereaction_dislike"
            className={classnames('button--file-action button-dislike', {
              'button--slime': myReaction === REACTION_TYPES.DISLIKE,
            })}
            label={
              myReaction === REACTION_TYPES.DISLIKE ? (
                <>
                  <div className="button__slime-stain" />
                  <div className="button__slime-drop1" />
                  <div className="button__slime-drop2" />
                </>
              ) : null
            }
          />
          {Number.isInteger(dislikeCount) && (
            <span className="shorts-floating-action__count">{formatNumberWithCommas(dislikeCount, 0)}</span>
          )}
        </div>

        <div className="shorts-floating-action">
          <Button navigate={navigateUrl} onClick={() => doSetShortsSidePanel(true)} icon={ICONS.INFO} iconSize={14} />
        </div>

        <div className="shorts-floating-action">
          <Button
            className={classnames('button-bubble', {
              'button-bubble--active': autoPlayNextShort,
            })}
            onClick={doToggleShortsAutoplay}
            icon={ICONS.AUTOPLAY_NEXT}
            iconSize={16}
          />
        </div>
      </div>
    </>
  );
};

export default FloatingShortsActions;
