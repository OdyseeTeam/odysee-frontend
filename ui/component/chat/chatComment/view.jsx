// @flow
import 'scss/component/_livestream-comment.scss';

import { getStickerUrl } from 'util/comments';
import { Menu, MenuButton } from '@reach/menu-button';
import { parseURI } from 'util/lbryURI';
import * as ICONS from 'constants/icons';
import ChannelThumbnail from 'component/channelThumbnail';
import classnames from 'classnames';
import CommentBadge from 'component/common/comment-badge';
import CommentMenuList from 'component/commentMenuList';
import CreditAmount from 'component/common/credit-amount';
import DateTime from 'component/dateTime';
import Empty from 'component/common/empty';
import Icon from 'component/common/icon';
import MarkdownPreview from 'component/common/markdown-preview';
import OptimizedImage from 'component/optimizedImage';
import React from 'react';
import PremiumBadge from 'component/premiumBadge';
// import { string } from 'prop-types';

type Props = {
  comment: Comment,
  forceUpdate?: any,
  uri: string,
  // --- redux:
  claim: StreamClaim,
  // myChannelIds: ?Array<string>,
  stakedLevel: number,
  isMobile?: boolean,
  odyseeMembership: string,
  handleDismissPin?: () => void,
  restoreScrollPos?: () => void,
  handleCommentClick: (any) => void,
  claimsByUri: { [string]: any },
  authorTitle: string,
  activeChannelClaim?: any,
};

export default function ChatComment(props: Props) {
  const {
    comment,
    forceUpdate,
    uri,
    claim,
    // myChannelIds,
    stakedLevel,
    isMobile,
    handleDismissPin,
    restoreScrollPos,
    handleCommentClick,
    odyseeMembership,
    authorTitle,
    activeChannelClaim,
  } = props;

  const {
    channel_url: authorUri,
    comment_id: commentId,
    comment: message,
    is_fiat: isFiat,
    is_global_mod: isGlobalMod,
    is_moderator: isModerator,
    is_pinned: isPinned,
    removed,
    support_amount: supportAmount,
    timestamp,
  } = comment;

  const [hasUserMention, setUserMention] = React.useState(false);

  const isStreamer = claim && claim.signing_channel && claim.signing_channel.permanent_url === authorUri;
  const { claimName: authorName } = parseURI(authorUri || '');
  const claimName = authorTitle || authorName;
  const stickerUrlFromMessage = getStickerUrl(message);
  const isSticker = Boolean(stickerUrlFromMessage);
  const timePosted = timestamp * 1000;
  const commentIsMine = comment.channel_id && isMyComment(comment.channel_id);

  // todo: implement comment_list --mine in SDK so redux can grab with selectCommentIsMine
  function isMyComment(channelId: string) {
    // return myChannelIds ? myChannelIds.includes(channelId) : false;
    return activeChannelClaim && activeChannelClaim.claim_id === channelId;
  }

  function reduceUriToChannelName(uri: string = '') {
    try {
      return uri.substring(uri.indexOf('@'), uri.indexOf('#') + 2).replace('#', ':');
    } catch {
      return uri;
    }
  }

  // For every new <LivestreamComment /> component that is rendered on mobile view,
  // keep the scroll at the bottom (newest)
  React.useEffect(() => {
    if (isMobile && restoreScrollPos) {
      restoreScrollPos();
    }
  }, [isMobile, restoreScrollPos]);

  return (
    <li
      className={classnames('livestream__comment', {
        'livestream__comment--superchat': supportAmount > 0,
        'livestream__comment--sticker': isSticker,
        'livestream__comment--mentioned': hasUserMention,
        'livestream__comment--mobile': isMobile,
      })}
      onClick={() => handleCommentClick(comment && reduceUriToChannelName(comment.channel_url))}
    >
      {supportAmount > 0 && (
        <div className="livestreamComment__superchatBanner">
          <CreditAmount isFiat={isFiat} amount={supportAmount} superChat />
        </div>
      )}

      <div className="livestreamComment__body">
        {false && supportAmount > 0 && <ChannelThumbnail uri={authorUri} xsmall />}
        <ChannelThumbnail uri={authorUri} xsmall />

        <div className="livestreamComment__info">
          <Menu>
            <MenuButton
              className={classnames('button--uri-indicator comment__author', {
                'comment__author--creator': isStreamer,
              })}
              onClick={(e) => e.stopPropagation()}
            >
              {claimName}
            </MenuButton>

            <CommentMenuList
              uri={uri}
              commentId={commentId}
              authorUri={authorUri}
              authorName={comment && comment.channel_name}
              commentIsMine={commentIsMine}
              isPinned={isPinned}
              isTopLevel
              disableEdit
              disableRemove={comment.removed}
              isLiveComment
              handleDismissPin={handleDismissPin}
              setQuickReply={handleCommentClick}
            />
          </Menu>

          {isPinned && (
            <span className="comment__pin">
              <Icon icon={ICONS.PIN} size={14} />
              {__('Pinned')}
            </span>
          )}

          {isGlobalMod && <CommentBadge label={__('Admin')} icon={ICONS.BADGE_ADMIN} size={16} />}
          {isModerator && <CommentBadge label={__('Moderator')} icon={ICONS.BADGE_MOD} size={16} />}
          {isStreamer && <CommentBadge label={__('Streamer')} icon={ICONS.BADGE_STREAMER} size={16} />}
          <PremiumBadge membership={odyseeMembership} linkPage />

          {/* Use key to force timestamp update */}
          <DateTime date={timePosted} timeAgo key={forceUpdate} genericSeconds />

          {isSticker ? (
            <div className="sticker__comment">
              <OptimizedImage src={stickerUrlFromMessage} waitLoad loading="lazy" />
            </div>
          ) : (
            <div className="livestreamComment__text">
              {removed ? (
                <Empty text={__('[Removed]')} />
              ) : (
                <MarkdownPreview
                  content={message}
                  promptLinks
                  stakedLevel={stakedLevel}
                  disableTimestamps
                  setUserMention={setUserMention}
                  hasMembership={Boolean(odyseeMembership)}
                  isComment
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="livestreamComment__menu">
        <Menu>
          <MenuButton className="menu__button" onClick={(e) => e.stopPropagation()}>
            <Icon size={18} icon={ICONS.MORE_VERTICAL} />
          </MenuButton>

          <CommentMenuList
            uri={uri}
            commentId={commentId}
            authorUri={authorUri}
            authorName={comment && comment.channel_name}
            commentIsMine={commentIsMine}
            isPinned={isPinned}
            isTopLevel
            disableEdit
            disableRemove={comment.removed}
            isLiveComment
            handleDismissPin={handleDismissPin}
            setQuickReply={handleCommentClick}
          />
        </Menu>
      </div>
    </li>
  );
}
