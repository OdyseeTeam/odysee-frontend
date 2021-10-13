// @flow
import * as ICONS from 'constants/icons';
import React from 'react';
import Comment from 'component/comment';
import Button from 'component/button';
import Spinner from 'component/spinner';

type Props = {
  fetchedReplies: Array<any>,
  uri: string,
  parentId: string,
  claimIsMine: boolean,
  myChannels: ?Array<ChannelClaim>,
  linkedCommentId?: string,
  commentingEnabled: boolean,
  threadDepth: number,
  numDirectReplies: number, // Total replies for parentId as reported by 'comment[replies]'. Includes blocked items.
  isFetchingByParentId: { [string]: boolean },
  onShowMore?: () => void,
  hasMore: boolean,
  supportDisabled: boolean,
};

function CommentsReplies(props: Props) {
  const {
    uri,
    parentId,
    fetchedReplies,
    claimIsMine,
    myChannels,
    linkedCommentId,
    commentingEnabled,
    threadDepth,
    numDirectReplies,
    isFetchingByParentId,
    onShowMore,
    hasMore,
    supportDisabled,
  } = props;

  const [isExpanded, setExpanded] = React.useState(true);

  function showMore() {
    if (onShowMore) {
      onShowMore();
    }
  }

  // todo: implement comment_list --mine in SDK so redux can grab with selectCommentIsMine
  function isMyComment(channelId: string) {
    if (myChannels != null && channelId != null) {
      for (let i = 0; i < myChannels.length; i++) {
        if (myChannels[i].claim_id === channelId) {
          return true;
        }
      }
    }
    return false;
  }

  const displayedComments = fetchedReplies;

  return (
    Boolean(numDirectReplies) && (
      <div className="comment__replies-container">
        {Boolean(numDirectReplies) && !isExpanded && (
          <div className="comment__actions--nested">
            <Button
              className="comment__action"
              label={__('Show Replies')}
              onClick={() => setExpanded(!isExpanded)}
              icon={isExpanded ? ICONS.UP : ICONS.DOWN}
            />
          </div>
        )}
        {isExpanded && (
          <div>
            <div className="comment__replies">
              <Button className="comment__threadline" aria-label="Hide Replies" onClick={() => setExpanded(false)} />

              <ul className="comments--replies">
                {displayedComments &&
                  displayedComments.map((comment) => {
                    return (
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
                        commentIsMine={comment.channel_id && isMyComment(comment.channel_id)}
                        linkedCommentId={linkedCommentId}
                        commentingEnabled={commentingEnabled}
                        supportAmount={comment.support_amount}
                        numDirectReplies={comment.replies}
                        isModerator={comment.is_moderator}
                        isGlobalMod={comment.is_global_mod}
                        supportDisabled={supportDisabled}
                      />
                    );
                  })}
              </ul>
            </div>
          </div>
        )}
        {isExpanded && fetchedReplies && hasMore && (
          <div className="comment__actions--nested">
            <Button button="link" label={__('Show more')} onClick={showMore} className="button--uri-indicator" />
          </div>
        )}
        {isFetchingByParentId[parentId] && (
          <div className="comment__replies-container">
            <div className="comment__actions--nested">
              <Spinner type="small" />
            </div>
          </div>
        )}
      </div>
    )
  );
}

export default CommentsReplies;
