import { ENABLE_CREATOR_REACTIONS, SIMPLE_SITE } from 'config';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as REACTION_TYPES from 'constants/reactions';
import React from 'react';
import classnames from 'classnames';
import Button from 'component/button';
import ChannelThumbnail from 'component/channelThumbnail';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile } from 'effects/use-screensize';
import { selectClaimIsMine, selectClaimForUri, makeSelectTagInClaimOrChannelForUri } from 'redux/selectors/claims';
import { doResolveUri } from 'redux/actions/claims';
import { doToast } from 'redux/actions/notifications';
import { selectMyReactsForComment, selectOthersReactsForComment } from 'redux/selectors/comments';
import { doCommentReact } from 'redux/actions/comments';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import {
  DISABLE_REACTIONS_ALL_TAG,
  DISABLE_SLIMES_ALL_TAG,
  DISABLE_SLIMES_COMMENTS_TAG,
  DISABLE_REACTIONS_COMMENTS_TAG,
} from 'constants/tags';
import { useAppSelector, useAppDispatch } from 'redux/hooks';

type Props = {
  commentId: string;
  uri: string;
  hideCreatorLike: boolean;
};

function getCountForReaction(type: string, othersReacts: any, myReacts: Array<string>) {
  let count = 0;

  if (othersReacts && othersReacts[type]) {
    count += othersReacts[type];
  }

  if (myReacts && myReacts.includes(type)) {
    count += 1;
  }

  return count;
}

export default function CommentReactions(props: Props) {
  const { commentId, uri, hideCreatorLike } = props;

  const dispatch = useAppDispatch();
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  const activeChannelId = activeChannelClaim && activeChannelClaim.claim_id;
  const reactionKey = activeChannelId ? `${commentId}:${activeChannelId}` : commentId;
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const disableReactions = useAppSelector(
    (state) =>
      makeSelectTagInClaimOrChannelForUri(uri, DISABLE_REACTIONS_ALL_TAG)(state) ||
      makeSelectTagInClaimOrChannelForUri(uri, DISABLE_REACTIONS_COMMENTS_TAG)(state)
  );
  const disableSlimes = useAppSelector(
    (state) =>
      makeSelectTagInClaimOrChannelForUri(uri, DISABLE_SLIMES_ALL_TAG)(state) ||
      makeSelectTagInClaimOrChannelForUri(uri, DISABLE_SLIMES_COMMENTS_TAG)(state)
  );
  const claimIsMine = useAppSelector((state) => selectClaimIsMine(state, claim));
  const myReacts = useAppSelector((state) => selectMyReactsForComment(state, reactionKey));
  const othersReacts = useAppSelector((state) => selectOthersReactsForComment(state, reactionKey));
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  React.useEffect(() => {
    if (!claim) {
      dispatch(doResolveUri(uri));
    }
  }, [claim, dispatch, uri]);
  const canCreatorReact =
    claim &&
    claimIsMine &&
    (claim.value_type === 'channel'
      ? claim.claim_id === activeChannelId
      : claim.signing_channel && claim.signing_channel.claim_id === activeChannelId);
  const authorUri =
    claim && claim.value_type === 'channel'
      ? claim.canonical_url
      : claim && claim.signing_channel && claim.signing_channel.canonical_url;

  const shouldHide = !canCreatorReact && hideCreatorLike;
  const creatorLiked = getCountForReaction(REACTION_TYPES.CREATOR_LIKE, othersReacts, myReacts) > 0;
  const likeIcon = SIMPLE_SITE
    ? myReacts && myReacts.includes(REACTION_TYPES.LIKE)
      ? ICONS.FIRE_ACTIVE
      : ICONS.FIRE
    : ICONS.UPVOTE;
  const dislikeIcon = SIMPLE_SITE
    ? myReacts && myReacts.includes(REACTION_TYPES.DISLIKE)
      ? ICONS.SLIME_ACTIVE
      : ICONS.SLIME
    : ICONS.DOWNVOTE;

  function handleCommentLike() {
    if (activeChannelId) {
      dispatch(doCommentReact(commentId, REACTION_TYPES.LIKE));
    } else {
      promptForChannel();
    }
  }

  function handleCommentDislike() {
    if (activeChannelId) {
      dispatch(doCommentReact(commentId, REACTION_TYPES.DISLIKE));
    } else {
      promptForChannel();
    }
  }

  function promptForChannel() {
    navigate(`/$/${PAGES.CHANNEL_NEW}?redirect=${pathname}&lc=${commentId}`);
    dispatch(
      doToast({
        message: __('A channel is required to throw fire and slime'),
      })
    );
  }

  return (
    <>
      {!disableReactions && (
        <>
          <Button
            requiresAuth={IS_WEB}
            title={__('Upvote')}
            icon={likeIcon}
            iconSize={isMobile && 12}
            className={classnames('comment__action button-like', {
              'comment__action--active': myReacts && myReacts.includes(REACTION_TYPES.LIKE),
            })}
            onClick={handleCommentLike}
            label={
              <span className="comment__reaction-count">
                {getCountForReaction(REACTION_TYPES.LIKE, othersReacts, myReacts)}
              </span>
            }
          />
          {!disableSlimes && (
            <Button
              requiresAuth={IS_WEB}
              title={__('Downvote')}
              icon={dislikeIcon}
              iconSize={isMobile && 12}
              className={classnames('comment__action button-dislike', {
                'comment__action--active': myReacts && myReacts.includes(REACTION_TYPES.DISLIKE),
              })}
              onClick={handleCommentDislike}
              label={
                <span className="comment__reaction-count">
                  {getCountForReaction(REACTION_TYPES.DISLIKE, othersReacts, myReacts)}
                </span>
              }
            />
          )}
        </>
      )}

      {!shouldHide && ENABLE_CREATOR_REACTIONS && (canCreatorReact || creatorLiked) && (
        <Button
          disabled={!canCreatorReact || !claimIsMine}
          requiresAuth={IS_WEB}
          title={claimIsMine ? __('You loved this') : __('Creator loved this')}
          icon={creatorLiked ? ICONS.CREATOR_LIKE : ICONS.SUBSCRIBE}
          className={classnames('comment__action comment__action--creator-like')}
          onClick={() => dispatch(doCommentReact(commentId, REACTION_TYPES.CREATOR_LIKE))}
        >
          {creatorLiked && (
            <ChannelThumbnail xsmall uri={authorUri} hideStakedIndicator className="comment__creator-like" allowGifs />
          )}
        </Button>
      )}
    </>
  );
}
