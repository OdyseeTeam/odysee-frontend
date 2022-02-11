// @flow
import { ENABLE_CREATOR_REACTIONS, SIMPLE_SITE } from 'config';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as REACTION_TYPES from 'constants/reactions';
import React from 'react';
import classnames from 'classnames';
import Button from 'component/button';
import ChannelThumbnail from 'component/channelThumbnail';
import { useHistory } from 'react-router';
import { useIsMobile } from 'effects/use-screensize';

type Props = {
  uri: string,
  contentChannelUri: ?string, // if provided, skips resolving 'uri'
  commentId: string,
  // --- redux:
  myReacts: Array<string>,
  othersReacts: any,
  react: (string, string) => void,
  pendingCommentReacts: Array<string>,
  claimIsMine: boolean,
  claimsByUri: { [string]: Claim },
  myChannelClaimIds: ?Array<string>,
  activeChannelId: ?string,
  claim: ?ChannelClaim,
  doToast: ({ message: string }) => void,
  hideCreatorLike: boolean,
  resolve: (string) => void,
};

export default function CommentReactions(props: Props) {
  const {
    contentChannelUri,
    myReacts,
    othersReacts,
    commentId,
    react,
    claimIsMine,
    claimsByUri,
    myChannelClaimIds,
    uri,
    claim,
    activeChannelId,
    doToast,
    hideCreatorLike,
    resolve,
  } = props;
  const {
    push,
    location: { pathname },
  } = useHistory();

  const isMobile = useIsMobile();

  React.useEffect(() => {
    if (!claim && !contentChannelUri) {
      resolve(uri);
    }
  }, [claim, resolve, uri, contentChannelUri]);

  let canCreatorReact;
  let creatorThumbnail;

  if (contentChannelUri) {
    const contentChannelClaim = claimsByUri[contentChannelUri];
    const contentChannelId = contentChannelClaim?.claim_id;
    const channelIsMine = myChannelClaimIds && myChannelClaimIds.includes(contentChannelId);

    canCreatorReact = channelIsMine && contentChannelId === activeChannelId;
    creatorThumbnail = contentChannelClaim?.value?.thumbnail?.url;
  } else {
    canCreatorReact =
      claim &&
      claimIsMine &&
      (claim.value_type === 'channel'
        ? claim.claim_id === activeChannelId
        : claim.signing_channel && claim.signing_channel.claim_id === activeChannelId);
  }

  const authorUri =
    contentChannelUri ||
    (claim && claim.value_type === 'channel'
      ? claim.canonical_url
      : claim && claim.signing_channel && claim.signing_channel.canonical_url);

  const getCountForReact = (type) => {
    let count = 0;
    if (othersReacts && othersReacts[type]) {
      count += othersReacts[type];
    }
    if (myReacts && myReacts.includes(type)) {
      count += 1;
    }
    return count;
  };
  const shouldHide = !canCreatorReact && hideCreatorLike;
  const creatorLiked = getCountForReact(REACTION_TYPES.CREATOR_LIKE) > 0;
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
    push(`/$/${PAGES.CHANNEL_NEW}?redirect=${pathname}&lc=${commentId}`);
    doToast({ message: __('A channel is required to throw fire and slime') });
  }

  return (
    <>
      <Button
        requiresAuth={IS_WEB}
        title={__('Upvote')}
        icon={likeIcon}
        iconSize={isMobile && 12}
        className={classnames('comment__action', {
          'comment__action--active': myReacts && myReacts.includes(REACTION_TYPES.LIKE),
        })}
        onClick={handleCommentLike}
        label={<span className="comment__reaction-count">{getCountForReact(REACTION_TYPES.LIKE)}</span>}
      />
      <Button
        requiresAuth={IS_WEB}
        title={__('Downvote')}
        icon={dislikeIcon}
        iconSize={isMobile && 12}
        className={classnames('comment__action', {
          'comment__action--active': myReacts && myReacts.includes(REACTION_TYPES.DISLIKE),
        })}
        onClick={handleCommentDislike}
        label={<span className="comment__reaction-count">{getCountForReact(REACTION_TYPES.DISLIKE)}</span>}
      />

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
            <ChannelThumbnail
              xsmall
              uri={authorUri}
              thumbnailPreview={creatorThumbnail}
              hideStakedIndicator
              className="comment__creator-like"
              allowGifs
            />
          )}
        </Button>
      )}
    </>
  );
}
