// @flow
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import Comment from 'component/comment';
import React from 'react';
import Spinner from 'component/spinner';

type Props = {
  fetchedReplies: Array<Comment>,
  resolvedReplies: Array<Comment>,
  uri: string,
  parentId: string,
  claimIsMine: boolean,
  myChannelIds: ?Array<string>,
  linkedCommentId?: string,
  userCanComment: boolean,
  threadDepth: number,
  numDirectReplies: number, // Total replies for parentId as reported by 'comment[replies]'. Includes blocked items.
  isFetchingByParentId: { [string]: boolean },
  hasMore: boolean,
  supportDisabled: boolean,
  doResolveUris: (Array<string>) => void,
  onShowMore?: () => void,
};

function CommentsReplies(props: Props) {
  const {
    uri,
    parentId,
    fetchedReplies,
    resolvedReplies,
    claimIsMine,
    myChannelIds,
    linkedCommentId,
    userCanComment,
    threadDepth,
    numDirectReplies,
    isFetchingByParentId,
    hasMore,
    supportDisabled,
    doResolveUris,
    onShowMore,
  } = props;

  const [isExpanded, setExpanded] = React.useState(true);
  const [commentsToDisplay, setCommentsToDisplay] = React.useState(fetchedReplies);
  const isResolvingReplies = fetchedReplies && resolvedReplies.length !== fetchedReplies.length;
  const alreadyResolved = !isResolvingReplies && resolvedReplies.length !== 0;
  const canDisplayComments = commentsToDisplay && commentsToDisplay.length === fetchedReplies.length;

  // Batch resolve comment channel urls
  React.useEffect(() => {
    if (!fetchedReplies || alreadyResolved) return;

    const urisToResolve = [];
    fetchedReplies.map(({ channel_url }) => channel_url !== undefined && urisToResolve.push(channel_url));

    if (urisToResolve.length > 0) doResolveUris(urisToResolve);
  }, [alreadyResolved, doResolveUris, fetchedReplies]);

  // Wait to only display topLevelComments after resolved or else
  // other components will try to resolve again, like channelThumbnail
  React.useEffect(() => {
    if (!isResolvingReplies) setCommentsToDisplay(fetchedReplies);
  }, [isResolvingReplies, fetchedReplies]);

  return !numDirectReplies ? null : (
    <div className="comment__replies-container">
      {!isExpanded ? (
        <div className="comment__actions--nested">
          <Button
            className="comment__action"
            label={__('Show Replies')}
            onClick={() => setExpanded(!isExpanded)}
            icon={isExpanded ? ICONS.UP : ICONS.DOWN}
          />
        </div>
      ) : (
        <div className="comment__replies">
          <Button className="comment__threadline" aria-label="Hide Replies" onClick={() => setExpanded(false)} />

          <ul className="comments--replies">
            {!isResolvingReplies &&
              commentsToDisplay &&
              commentsToDisplay.length > 0 &&
              commentsToDisplay.map((comment) => (
                <Comment
                  threadDepth={threadDepth}
                  uri={uri}
                  authorUri={comment.channel_url}
                  author={comment.channel_name}
                  claimId={comment.claim_id}
                  commentId={comment.comment_id}
                  key={comment.comment_id}
                  message={comment.comment}
                  timePosted={comment.timestamp * 1000}
                  claimIsMine={claimIsMine}
                  commentIsMine={comment.channel_id && myChannelIds && myChannelIds.includes(comment.channel_id)}
                  linkedCommentId={linkedCommentId}
                  commentingEnabled={userCanComment}
                  supportAmount={comment.support_amount}
                  numDirectReplies={comment.replies}
                  isModerator={comment.is_moderator}
                  isGlobalMod={comment.is_global_mod}
                  supportDisabled={supportDisabled}
                />
              ))}
          </ul>
        </div>
      )}
      {isExpanded && fetchedReplies && hasMore && (
        <div className="comment__actions--nested">
          <Button
            button="link"
            label={__('Show more')}
            onClick={() => onShowMore && onShowMore()}
            className="button--uri-indicator"
          />
        </div>
      )}
      {(isFetchingByParentId[parentId] || isResolvingReplies || !canDisplayComments) && (
        <div className="comment__replies-container">
          <div className="comment__actions--nested">
            <Spinner type="small" />
          </div>
        </div>
      )}
    </div>
  );
}

export default CommentsReplies;
