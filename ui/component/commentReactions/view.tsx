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
type Props = {
  myReacts: Array<string>;
  disableReactions: boolean;
  disableSlimes: boolean;
  othersReacts: any;
  react: (arg0: string, arg1: string) => void;
  commentId: string;
  pendingCommentReacts: Array<string>;
  claimIsMine: boolean;
  activeChannelId: string | null | undefined;
  uri: string;
  claim: ChannelClaim | null | undefined;
  doToast: (arg0: { message: string }) => void;
  hideCreatorLike: boolean;
  resolve: (arg0: string) => void;
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
  const {
    myReacts,
    disableReactions,
    disableSlimes,
    othersReacts,
    react,
    commentId,
    claimIsMine,
    activeChannelId,
    uri,
    claim,
    doToast,
    hideCreatorLike,
    resolve,
  } = props;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  React.useEffect(() => {
    if (!claim) {
      resolve(uri);
    }
  }, [claim, resolve, uri]);
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
      react(commentId, REACTION_TYPES.LIKE);
    } else {
      promptForChannel();
    }
  }

  function handleCommentDislike() {
    if (activeChannelId) {
      react(commentId, REACTION_TYPES.DISLIKE);
    } else {
      promptForChannel();
    }
  }

  function promptForChannel() {
    navigate(`/$/${PAGES.CHANNEL_NEW}?redirect=${pathname}&lc=${commentId}`);
    doToast({
      message: __('A channel is required to throw fire and slime'),
    });
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
          onClick={() => react(commentId, REACTION_TYPES.CREATOR_LIKE)}
        >
          {creatorLiked && (
            <ChannelThumbnail xsmall uri={authorUri} hideStakedIndicator className="comment__creator-like" allowGifs />
          )}
        </Button>
      )}
    </>
  );
}
