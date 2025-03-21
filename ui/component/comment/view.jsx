/**
 * Comment component.
 *
 * Notes:
 * - Filtration is not done at this component level. Comments are filtered
 *   in the selector through `filterComments()`. This saves the need to handle
 *   it from the render loop, but also means we cannot render it differently
 *   (e.g. displaying as "Comment has been blocked") since the component doesn't
 *   see it.
 */

// @flow
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as KEYCODES from 'constants/keycodes';
import { COMMENT_HIGHLIGHTED } from 'constants/classnames';
import { INLINE_PLAYER_WRAPPER_CLASS } from 'constants/player';
import {
  SORT_BY,
  COMMENT_PAGE_SIZE_REPLIES,
  LINKED_COMMENT_QUERY_PARAM,
  THREAD_COMMENT_QUERY_PARAM,
  THRESHOLD_MS,
} from 'constants/comment';
import { FF_MAX_CHARS_IN_COMMENT } from 'constants/form-field';
import { SITE_NAME, SIMPLE_SITE, ENABLE_COMMENT_REACTIONS } from 'config';
import React, { useEffect, useState } from 'react';
import { parseURI } from 'util/lbryURI';
import DateTime from 'component/dateTime';
import Button from 'component/button';
import Expandable from 'component/common/expandable';
import MarkdownPreview from 'component/common/markdown-preview';
import CommentBadge from 'component/common/comment-badge';
import ChannelThumbnail from 'component/channelThumbnail';
import { Menu, MenuButton } from '@reach/menu-button';
import Icon from 'component/common/icon';
import { FormField, Form } from 'component/common/form';
import classnames from 'classnames';
import usePersistedState from 'effects/use-persisted-state';
import CommentReactions from 'component/commentReactions';
import CommentsReplies from 'component/commentsReplies';
import { useHistory } from 'react-router';
import CommentMenuList from 'component/commentMenuList';
import CreditAmount from 'component/common/credit-amount';
import OptimizedImage from 'component/optimizedImage';
import { getChannelFromClaim } from 'util/claim';
import { parseSticker } from 'util/comments';
import { useIsMobile } from 'effects/use-screensize';
import MembershipBadge from 'component/membershipBadge';
import Spinner from 'component/spinner';
import { lazyImport } from 'util/lazyImport';

const CommentCreate = lazyImport(() => import('component/commentCreate' /* webpackChunkName: "comments" */));

// ****************************************************************************
// ****************************************************************************

export type Props = {|
  comment: Comment,
  uri?: string,
  forceDisplayDeadComment?: boolean,
  linkedCommentId?: string,
  threadCommentId?: ?string,
  isTopLevel?: boolean,
  hideActions?: boolean,
  hideContextMenu?: boolean,
  supportDisabled?: boolean,
  setQuickReply?: (any) => void,
  quickReply?: any,
  threadLevel?: number,
  threadDepthLevel?: number,
  disabled?: boolean,
  updateUiFilteredComments?: (commentIds: Array<string>) => void,
|};

type StateProps = {|
  fetchedReplies: Array<Comment>,
  othersReacts: ?{ like: number, dislike: number },
  linkedCommentAncestors: { [string]: Array<string> },
  totalReplyPages: number,
  repliesFetching: boolean,
  claim: StreamClaim,
  authorTitle: ?string,
  channelAge?: any,
  myChannelIds: ?Array<string>,
  hasChannels: boolean,
  odyseeMembership: ?string,
  creatorMembership: ?string,
  commentingEnabled: boolean,
  playingUri: PlayingUri,
  stakedLevel: number,
  isCommenterChannelDeleted: boolean,
|};

type DispatchProps = {|
  doClearPlayingUri: () => void,
  doClearPlayingSource: () => void,
  updateComment: (string, string) => void,
  fetchReplies: (string, string, number, number, number) => void,
  doToast: (ToastParams) => void,
|};

// ****************************************************************************
// Comment
// ****************************************************************************

function CommentView(props: Props & StateProps & DispatchProps) {
  const {
    comment,
    myChannelIds,
    forceDisplayDeadComment = false,
    doClearPlayingUri,
    claim,
    uri,
    updateComment,
    fetchReplies,
    totalReplyPages,
    linkedCommentId,
    threadCommentId,
    linkedCommentAncestors,
    commentingEnabled,
    hasChannels,
    doToast,
    isTopLevel,
    hideActions,
    hideContextMenu,
    othersReacts,
    playingUri,
    stakedLevel,
    isCommenterChannelDeleted,
    supportDisabled,
    setQuickReply,
    quickReply,
    odyseeMembership,
    creatorMembership,
    fetchedReplies,
    repliesFetching,
    threadLevel = 0,
    threadDepthLevel = 0,
    doClearPlayingSource,
    authorTitle,
    channelAge,
    disabled,
    updateUiFilteredComments,
  } = props;

  const commentElemRef = React.useRef();

  const {
    channel_url: authorUri,
    channel_name: author,
    channel_id: channelId,
    comment_id: commentId,
    comment: message,
    is_fiat: isFiat,
    is_global_mod: isGlobalMod,
    is_moderator: isModerator,
    is_pinned: isPinned,
    support_amount: supportAmount,
    replies: numDirectReplies,
  } = comment;
  const claimName = authorTitle || author;

  const timePosted = comment.timestamp * 1000;
  const commentIsEdited = parseInt(comment.signing_ts) - comment.timestamp > THRESHOLD_MS.IS_EDITED / 1000;
  const commentIsMine = channelId && myChannelIds && myChannelIds.includes(channelId);

  const isMobile = useIsMobile();
  const ROUGH_HEADER_HEIGHT = isMobile ? 56 : 60; // @see: --header-height

  const lastThreadLevel = threadDepthLevel - 1;
  // Mobile: 0, 1, 2 -> new thread....., so each 3 comments
  const openNewThread = threadLevel > 0 && threadLevel % lastThreadLevel === 0;

  const {
    push,
    replace,
    location: { pathname, search },
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  const isLinkedComment = linkedCommentId && linkedCommentId === commentId;
  const isThreadComment = threadCommentId && threadCommentId === commentId;
  const isInLinkedCommentChain =
    linkedCommentId &&
    linkedCommentAncestors[linkedCommentId] &&
    linkedCommentAncestors[linkedCommentId].includes(commentId);
  const showRepliesOnMount = isThreadComment || isInLinkedCommentChain || (threadLevel === 0 && !!comment.replies);

  const [isReplying, setReplying] = React.useState(false);
  const [isEditing, setEditing] = useState(false);
  const [editedMessage, setCommentValue] = useState(message);
  const [charCount, setCharCount] = useState(editedMessage.length);
  const [showReplies, setShowReplies] = useState(showRepliesOnMount);
  const [page, setPage] = useState(showRepliesOnMount ? 1 : 0);
  const [advancedEditor] = usePersistedState('comment-editor-mode', false);
  const [displayDeadComment, setDisplayDeadComment] = React.useState(forceDisplayDeadComment);
  const likesCount = (othersReacts && othersReacts.like) || 0;
  const dislikesCount = (othersReacts && othersReacts.dislike) || 0;
  const totalLikesAndDislikes = likesCount + dislikesCount;
  const contentChannelClaim = getChannelFromClaim(claim);
  const commentByOwnerOfContent = contentChannelClaim && contentChannelClaim.permanent_url === authorUri;
  const slimedToDeath =
    !commentByOwnerOfContent && totalLikesAndDislikes >= 5 && dislikesCount / totalLikesAndDislikes > 0.8;
  const stickerFromMessage = parseSticker(message);

  const isSprout = channelAge && Math.round((new Date() - channelAge) / (1000 * 60 * 60 * 24)) < 7;

  let channelOwnerOfContent;
  try {
    if (uri) {
      const { channelName } = parseURI(uri);
      if (channelName) {
        channelOwnerOfContent = channelName;
      }
    }
  } catch (e) {}

  useEffect(() => {
    if (isEditing) {
      setCharCount(editedMessage.length);

      // a user will try and press the escape key to cancel editing their comment
      const handleEscape = (event) => {
        if (event.keyCode === KEYCODES.ESCAPE) {
          setEditing(false);
        }
      };

      window.addEventListener('keydown', handleEscape);

      // removes the listener so it doesn't cause problems elsewhere in the app
      return () => {
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [author, authorUri, editedMessage, isEditing, setEditing]);

  useEffect(() => {
    if (uri && page > 0) {
      fetchReplies(uri, commentId, page, COMMENT_PAGE_SIZE_REPLIES, SORT_BY.OLDEST);
    }
  }, [page, uri, commentId, fetchReplies]);

  function handleEditMessageChanged(event) {
    setCommentValue(!SIMPLE_SITE && advancedEditor ? event : event.target.value);
  }

  function handleEditComment(isEditing: boolean) {
    if (playingUri.source === 'comment' && commentElemRef.current) {
      const claimLink = commentElemRef.current.querySelector(`.${INLINE_PLAYER_WRAPPER_CLASS}`);

      if (isEditing && playingUri.sourceId === claimLink?.id) {
        doClearPlayingUri();
      } else {
        doClearPlayingSource();
      }
    }

    setEditing(isEditing);
  }

  function handleSubmit() {
    updateComment(commentId, editedMessage);
    if (setQuickReply) setQuickReply({ ...quickReply, comment_id: commentId, comment: editedMessage });
    setEditing(false);
    doClearPlayingSource();
  }

  function handleCommentReply() {
    if (!hasChannels) {
      push(`/$/${PAGES.CHANNEL_NEW}?redirect=${pathname}`);
      doToast({ message: __('A channel is required to comment on %SITE_NAME%', { SITE_NAME }) });
    } else {
      setReplying(!isReplying);
    }
    doClearPlayingSource();
  }

  function handleTimeClick() {
    urlParams.set(LINKED_COMMENT_QUERY_PARAM, commentId);
    replace(`${pathname}?${urlParams.toString()}`);
  }

  function handleOpenNewThread() {
    urlParams.set(LINKED_COMMENT_QUERY_PARAM, commentId);
    urlParams.set(THREAD_COMMENT_QUERY_PARAM, commentId);
    push({ pathname, search: urlParams.toString() });
  }

  const handleShowMore = React.useCallback(() => setPage((prev) => prev + 1), []);

  const linkedCommentRef = React.useCallback(
    (node) => {
      if (node) commentElemRef.current = node;
      if (node !== null && window.pendingLinkedCommentScroll) {
        delete window.pendingLinkedCommentScroll;

        const mobileChatElem = document.querySelector('.MuiPaper-root .card--enable-overflow');
        const elem = (isMobile && mobileChatElem) || window;

        if (elem) {
          // $FlowFixMe
          elem.scrollTo({
            // $FlowFixMe
            top: node.getBoundingClientRect().top + (mobileChatElem ? 0 : elem.scrollY) - ROUGH_HEADER_HEIGHT,
            left: 0,
            behavior: 'smooth',
          });
        }
      }
    },
    [ROUGH_HEADER_HEIGHT, isMobile]
  );

  if (isCommenterChannelDeleted) {
    if (updateUiFilteredComments) {
      const fetchedReplyIds = fetchedReplies.map((r) => r.comment_id);
      updateUiFilteredComments([...fetchedReplyIds, commentId]);
    }
    return null;
  }

  return (
    <li
      className={classnames('comment', {
        'comment--top-level': isTopLevel,
        'comment--reply': !isTopLevel,
      })}
      id={commentId}
    >
      <div className="comment__thumbnail-wrapper">
        {authorUri ? (
          <ChannelThumbnail uri={authorUri} xsmall className="comment__author-thumbnail" checkMembership={false} />
        ) : (
          <ChannelThumbnail xsmall className="comment__author-thumbnail" checkMembership={false} />
        )}

        {numDirectReplies > 0 && showReplies && (
          <Button className="comment__threadline" aria-label="Hide Replies" onClick={() => setShowReplies(false)} />
        )}
      </div>

      <div className="comment__content" ref={isLinkedComment || isThreadComment ? linkedCommentRef : commentElemRef}>
        <div
          className={classnames('comment__body-container', {
            [COMMENT_HIGHLIGHTED]: isLinkedComment || (isThreadComment && !linkedCommentId),
            'comment--slimed': slimedToDeath && !displayDeadComment,
          })}
        >
          <div className="comment__meta">
            <div className="comment__meta-information">
              {!author ? (
                <span className="comment__author">{__('Anonymous')}</span>
              ) : (
                <Menu>
                  <MenuButton
                    className={classnames('button--uri-indicator comment__author', {
                      'comment__author--creator': commentByOwnerOfContent,
                    })}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {claimName}
                  </MenuButton>

                  <CommentMenuList
                    uri={uri}
                    commentId={commentId}
                    authorUri={authorUri}
                    commentIsMine={commentIsMine}
                    isPinned={isPinned}
                    isTopLevel={isTopLevel}
                    isUserLabel
                    handleEditComment={() => handleEditComment(true)}
                    setQuickReply={setQuickReply}
                    className={classnames('comment__author', {
                      'comment__author--creator': commentByOwnerOfContent,
                    })}
                  />
                </Menu>
              )}
              {isSprout && <CommentBadge label={__('Sprout')} icon={ICONS.BADGE_SPROUT} size={14} />}
              {isGlobalMod && <CommentBadge label={__('Admin')} icon={ICONS.BADGE_ADMIN} />}
              {isModerator && <CommentBadge label={__('Moderator')} icon={ICONS.BADGE_MOD} />}
              {odyseeMembership && <MembershipBadge membershipName={odyseeMembership} linkPage />}
              {creatorMembership && <MembershipBadge membershipName={creatorMembership} linkPage uri={uri} />}
              <Button
                className="comment__time"
                onClick={handleTimeClick}
                label={
                  <>
                    <DateTime date={timePosted} timeAgo />
                    {commentIsEdited && <span className="comment__edited">{__('(edited)')}</span>}
                  </>
                }
              />

              {supportAmount > 0 && <CreditAmount isFiat={isFiat} amount={supportAmount} superChatLight size={12} />}

              {isPinned && (
                <span className="comment__pin">
                  <Icon icon={ICONS.PIN} size={14} />
                  {channelOwnerOfContent
                    ? __('Pinned by @%channel%', { channel: channelOwnerOfContent })
                    : __('Pinned by creator')}
                </span>
              )}
            </div>
            {!hideContextMenu && (
              <div className="comment__menu">
                <Menu>
                  <MenuButton className="menu__button">
                    <Icon size={18} icon={ICONS.MORE_VERTICAL} />
                  </MenuButton>
                  <CommentMenuList
                    uri={uri}
                    isTopLevel={isTopLevel}
                    isPinned={isPinned}
                    commentId={commentId}
                    authorUri={authorUri}
                    commentIsMine={commentIsMine}
                    handleEditComment={() => handleEditComment(true)}
                    supportAmount={supportAmount}
                    setQuickReply={setQuickReply}
                  />
                </Menu>
              </div>
            )}
          </div>
          <div>
            {isEditing ? (
              <Form onSubmit={handleSubmit}>
                <FormField
                  className="comment__edit-input"
                  type={!SIMPLE_SITE && advancedEditor ? 'markdown' : 'textarea'}
                  name="editing_comment"
                  value={editedMessage}
                  charCount={charCount}
                  onChange={handleEditMessageChanged}
                  textAreaMaxLength={FF_MAX_CHARS_IN_COMMENT}
                  handleSubmit={handleSubmit}
                />
                <div className="section__actions section__actions--no-margin">
                  <Button
                    button="primary"
                    type="submit"
                    label={__('Done')}
                    requiresAuth={IS_WEB}
                    disabled={message === editedMessage}
                  />
                  <Button button="link" label={__('Cancel')} onClick={() => handleEditComment(false)} />
                </div>
              </Form>
            ) : (
              <>
                <div className="comment__message">
                  {slimedToDeath && !displayDeadComment ? (
                    <div onClick={() => setDisplayDeadComment(true)} className="comment__dead">
                      {__('This comment was slimed to death. (Click to view)')} <Icon icon={ICONS.SLIME_ACTIVE} />
                    </div>
                  ) : stickerFromMessage ? (
                    <div className="sticker__comment">
                      <OptimizedImage src={stickerFromMessage.url} waitLoad loading="lazy" />
                    </div>
                  ) : (
                    <Expandable>
                      <MarkdownPreview
                        content={message}
                        promptLinks
                        parentCommentId={commentId}
                        stakedLevel={stakedLevel}
                        hasMembership={Boolean(odyseeMembership)}
                      />
                    </Expandable>
                  )}
                </div>

                {!hideActions && (
                  <div className={classnames('comment__actions', { 'comment__actions--disabled': disabled })}>
                    <Button
                      requiresAuth={IS_WEB}
                      label={commentingEnabled ? __('Reply') : __('Log in to reply')}
                      className="comment__action"
                      onClick={handleCommentReply}
                      icon={ICONS.REPLY}
                      iconSize={isMobile && 12}
                    />
                    {ENABLE_COMMENT_REACTIONS && <CommentReactions uri={uri} commentId={commentId} />}
                  </div>
                )}

                {numDirectReplies > 0 && !hideActions && (
                  <div className={classnames('comment__actions', { 'comment__actions--disabled': disabled })}>
                    {!showReplies ? (
                      openNewThread ? (
                        <Button
                          label={__('Continue Thread')}
                          button="link"
                          onClick={handleOpenNewThread}
                          iconRight={ICONS.ARROW_RIGHT}
                        />
                      ) : (
                        <Button
                          label={
                            numDirectReplies < 2
                              ? __('Show reply')
                              : __('Show %count% replies', { count: numDirectReplies })
                          }
                          button="link"
                          onClick={() => {
                            setShowReplies(true);
                            if (page === 0) {
                              setPage(1);
                            }
                          }}
                          iconRight={ICONS.DOWN}
                        />
                      )
                    ) : (
                      <Button
                        label={__('Hide replies')}
                        button="link"
                        onClick={() => setShowReplies(false)}
                        iconRight={ICONS.UP}
                      />
                    )}
                  </div>
                )}

                {isReplying && (
                  <CommentCreate
                    isReply
                    uri={uri}
                    parentId={commentId}
                    onDoneReplying={() => {
                      if (openNewThread) {
                        handleOpenNewThread();
                      } else {
                        setShowReplies(true);
                      }
                      setReplying(false);
                    }}
                    onCancelReplying={() => {
                      setReplying(false);
                    }}
                    supportDisabled={supportDisabled}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {showReplies &&
          (repliesFetching && (!fetchedReplies || fetchedReplies.length === 0) ? (
            <div className="empty empty--centered-tight">
              <Spinner type="small" />
            </div>
          ) : (
            <CommentsReplies
              threadLevel={threadLevel}
              uri={uri}
              parentId={commentId}
              linkedCommentId={linkedCommentId}
              threadCommentId={threadCommentId}
              numDirectReplies={numDirectReplies}
              onShowMore={handleShowMore}
              hasMore={page < totalReplyPages}
              threadDepthLevel={threadDepthLevel}
              updateUiFilteredComments={updateUiFilteredComments}
            />
          ))}
      </div>
    </li>
  );
}

export default CommentView;
