import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import classnames from 'classnames';
import * as REACTION_TYPES from 'constants/reactions';
import * as ICONS from 'constants/icons';
import RatioBar from 'component/ratioBar';
import FileActionButton from 'component/common/file-action-button';
import Counter from 'component/counter';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectMyReactionForUri, selectLikeCountForUri, selectDislikeCountForUri } from 'redux/selectors/reactions';
import { doFetchReactions, doReactionLike, doReactionDislike } from 'redux/actions/reactions';
import {
  selectClaimForUri,
  selectIsStreamPlaceholderForUri,
  selectClaimIsMine,
  selectScheduledStateForUri,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { DISABLE_SLIMES_VIDEO_TAG, DISABLE_SLIMES_ALL_TAG } from 'constants/tags';
const LIVE_REACTION_FETCH_MS = 1000 * 45;
type Props = {
  uri: string;
};
export default function FileReactions(props: Props) {
  const { uri } = props;
  const dispatch = useAppDispatch();

  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const claimId = claim?.claim_id;
  const myReaction = useAppSelector((state) => selectMyReactionForUri(state, uri));
  const likeCount = useAppSelector((state) => selectLikeCountForUri(state, uri));
  const dislikeCount = useAppSelector((state) => selectDislikeCountForUri(state, uri));
  const isLivestreamClaim = useAppSelector((state) => selectIsStreamPlaceholderForUri(state, uri));
  const scheduledState = useAppSelector((state) => selectScheduledStateForUri(state, uri));
  const disableSlimes = useAppSelector(
    (state) =>
      makeSelectTagInClaimOrChannelForUri(uri, DISABLE_SLIMES_ALL_TAG)(state) ||
      makeSelectTagInClaimOrChannelForUri(uri, DISABLE_SLIMES_VIDEO_TAG)(state)
  );

  const doFetchReactions_ = (...args: Parameters<typeof doFetchReactions>) => dispatch(doFetchReactions(...args));
  const doReactionLike_ = (...args: Parameters<typeof doReactionLike>) => dispatch(doReactionLike(...args));
  const doReactionDislike_ = (...args: Parameters<typeof doReactionDislike>) => dispatch(doReactionDislike(...args));
  React.useEffect(() => {
    function fetchReactions() {
      doFetchReactions_(claimId);
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
  }, [claimId, doFetchReactions_, isLivestreamClaim]);
  return (
    <div
      className={classnames('ratio-wrapper', {
        'ratio-wrapper--disabled': scheduledState === 'scheduled',
        'ratio-wrapper--no-slime': disableSlimes,
      })}
    >
      <LikeButton myReaction={myReaction} reactionCount={likeCount} onClick={() => doReactionLike_(uri)} />
      {!disableSlimes && (
        <DislikeButton myReaction={myReaction} reactionCount={dislikeCount} onClick={() => doReactionDislike_(uri)} />
      )}
      <RatioBar likeCount={likeCount} dislikeCount={disableSlimes ? 0 : dislikeCount} />
    </div>
  );
}
const Placeholder = <Skeleton variant="text" animation="wave" className="reaction-count-placeholder" />;
type ButtonProps = {
  myReaction: string | null | undefined;
  reactionCount: number;
  onClick: () => void;
};

const LikeButton = (props: ButtonProps) => {
  const { myReaction, reactionCount, onClick } = props;
  return (
    <FileActionButton
      title={__('I like this')}
      requiresAuth
      authSrc="filereaction_like"
      className={classnames('button--file-action button-like', {
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
          {Number.isInteger(reactionCount) ? <Counter value={reactionCount} precision={0} /> : Placeholder}
        </>
      }
      iconSize={18}
      icon={myReaction === REACTION_TYPES.LIKE ? ICONS.FIRE_ACTIVE : ICONS.FIRE}
      onClick={onClick}
    />
  );
};

const DislikeButton = (props: ButtonProps) => {
  const { myReaction, reactionCount, onClick } = props;
  return (
    <FileActionButton
      requiresAuth
      authSrc={'filereaction_dislike'}
      title={__('I dislike this')}
      className={classnames('button--file-action button-dislike', {
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
          {Number.isInteger(reactionCount) ? <Counter value={reactionCount} precision={0} /> : Placeholder}
        </>
      }
      iconSize={18}
      icon={myReaction === REACTION_TYPES.DISLIKE ? ICONS.SLIME_ACTIVE : ICONS.SLIME}
      onClick={onClick}
    />
  );
};
