import React from 'react';
import classnames from 'classnames';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import * as REACTION_TYPES from 'constants/reactions';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectMyReactionForUri } from 'redux/selectors/reactions';
import {
  doFetchReactions as doFetchReactionsAction,
  doReactionLike as doReactionLikeAction,
  doReactionDislike as doReactionDislikeAction,
} from 'redux/actions/reactions';
import { makeSelectTagInClaimOrChannelForUri } from 'redux/selectors/claims';
import {
  DISABLE_SLIMES_VIDEO_TAG,
  DISABLE_SLIMES_ALL_TAG,
  DISABLE_REACTIONS_ALL_TAG,
  DISABLE_REACTIONS_VIDEO_TAG,
} from 'constants/tags';
type Props = {
  uri: string;
  claimId: string | null | undefined;
};

const FloatingReactions = ({ uri, claimId }: Props) => {
  const dispatch = useAppDispatch();
  const myReaction = useAppSelector((state) => selectMyReactionForUri(state, uri));
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
  const doReactionLike = (uri: string) => dispatch(doReactionLikeAction(uri));
  const doReactionDislike = (uri: string) => dispatch(doReactionDislikeAction(uri));
  const [optimisticReaction, setOptimisticReaction] = React.useState(undefined);
  const [fireButtonGlow, setFireButtonGlow] = React.useState(false);
  const fireButtonGlowTimeout = React.useRef(null);
  const [slimeButtonGlow, setSlimeButtonGlow] = React.useState(false);
  const slimeButtonGlowTimeout = React.useRef(null);
  React.useEffect(() => {
    if (claimId) dispatch(doFetchReactionsAction(claimId));
  }, [claimId, dispatch]);
  React.useEffect(() => {
    setOptimisticReaction(undefined);
  }, [myReaction]);
  const effectiveReaction = optimisticReaction !== undefined ? optimisticReaction : myReaction;
  const isFireActive = effectiveReaction === REACTION_TYPES.LIKE;
  const isSlimeActive = effectiveReaction === REACTION_TYPES.DISLIKE;
  if (disableReactions) return null;
  return (
    <div className="floating-player__reactions">
      <div className="floating-player__reaction">
        <Button
          onClick={() => {
            setOptimisticReaction(isFireActive ? null : REACTION_TYPES.LIKE);

            if (!isFireActive) {
              setFireButtonGlow(false);
              clearTimeout(fireButtonGlowTimeout.current);
              requestAnimationFrame(() => {
                setFireButtonGlow(true);
                fireButtonGlowTimeout.current = setTimeout(() => setFireButtonGlow(false), 2000);
              });
            }

            doReactionLike(uri);
          }}
          icon={isFireActive ? ICONS.FIRE_ACTIVE : ICONS.FIRE}
          iconSize={14}
          requiresAuth
          authSrc="filereaction_like"
          className={classnames('button--file-action button-like', {
            'button--fire': isFireActive,
            'button--fire-glow-pulse': fireButtonGlow,
          })}
          label={
            isFireActive ? (
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
      </div>

      {!disableSlimes && (
        <div className="floating-player__reaction">
          <Button
            onClick={() => {
              setOptimisticReaction(isSlimeActive ? null : REACTION_TYPES.DISLIKE);

              if (!isSlimeActive) {
                setSlimeButtonGlow(false);
                clearTimeout(slimeButtonGlowTimeout.current);
                requestAnimationFrame(() => {
                  setSlimeButtonGlow(true);
                  slimeButtonGlowTimeout.current = setTimeout(() => setSlimeButtonGlow(false), 3000);
                });
              }

              doReactionDislike(uri);
            }}
            icon={isSlimeActive ? ICONS.SLIME_ACTIVE : ICONS.SLIME}
            iconSize={14}
            requiresAuth
            authSrc="filereaction_dislike"
            className={classnames('button--file-action button-dislike', {
              'button--slime': isSlimeActive,
              'button--slime-glow-pulse': slimeButtonGlow,
            })}
            label={
              isSlimeActive ? (
                <>
                  <div className="button__slime-stain" />
                  <div className="button__slime-drop1" />
                  <div className="button__slime-drop2" />
                </>
              ) : null
            }
          />
        </div>
      )}
    </div>
  );
};

export default FloatingReactions;
