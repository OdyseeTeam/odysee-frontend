import React from 'react';
import ChatComment from 'component/chat/chatComment';
import Spinner from 'component/spinner';
import { useAppSelector } from 'redux/hooks';
import { selectIsFetchingComments } from 'redux/selectors/comments';
import { selectIsUriResolving } from 'redux/selectors/claims';
import { VIEW_MODES } from 'component/chat/view';

// 30 sec timestamp refresh timer
const UPDATE_TIMESTAMP_MS = 30 * 1000;
type Props = {
  comments: Array<Comment>;
  uri: string;
  isMobile?: boolean;
  viewMode: string;
  restoreScrollPos?: () => void;
  setResolvingSuperChats?: (arg0: boolean) => void;
  setHoverLock: (arg0: boolean) => void;
  handleCommentClick?: (arg0: string) => void;
  isCompact: string;
};
export default function ChatComments(props: Props) {
  const {
    comments,
    uri,
    isMobile,
    viewMode,
    restoreScrollPos,
    setResolvingSuperChats,
    setHoverLock,
    handleCommentClick,
    isCompact,
  } = props;

  const fetchingComments = useAppSelector(selectIsFetchingComments);
  const resolvingSuperchats = useAppSelector((state) =>
    Boolean(
      viewMode === VIEW_MODES.SUPERCHAT &&
      comments &&
      comments.some(({ channel_url }) => selectIsUriResolving(state, channel_url))
    )
  );
  const [forceUpdate, setForceUpdate] = React.useState(0);
  React.useEffect(() => {
    if (setResolvingSuperChats) setResolvingSuperChats(resolvingSuperchats);
  }, [resolvingSuperchats, setResolvingSuperChats]);
  const now = new Date();
  const shouldRefreshTimestamp =
    comments &&
    comments.some((comment) => {
      const { timestamp } = comment;
      const timePosted = timestamp * 1000;
      // 1000 * 60 seconds * 60 minutes === less than an hour old
      return now - timePosted < 1000 * 60 * 60;
    });
  // Refresh timestamp on timer
  React.useEffect(() => {
    if (shouldRefreshTimestamp) {
      const timer = setTimeout(() => {
        setForceUpdate(Date.now());
      }, UPDATE_TIMESTAMP_MS);
      return () => clearTimeout(timer);
    } // forceUpdate will re-activate the timer or else it will only refresh once
  }, [shouldRefreshTimestamp, forceUpdate]);

  if (resolvingSuperchats) {
    return (
      <div className="main--empty">
        <Spinner />
      </div>
    );
  }

  /* top to bottom comment display */
  if (!fetchingComments && comments && comments.length > 0) {
    const commentProps = {
      uri,
      forceUpdate,
    };
    return isMobile ? (
      <div className="livestream__comments--mobile">
        {comments
          .slice(0)
          .toReversed()
          .map((comment) => (
            <ChatComment
              {...commentProps}
              comment={comment}
              key={comment.comment_id}
              isMobile
              restoreScrollPos={restoreScrollPos}
              handleCommentClick={handleCommentClick}
              isCompact={isCompact}
            />
          ))}
      </div>
    ) : (
      <div
        className="livestream__comments"
        onMouseEnter={() => setHoverLock(true)}
        onMouseLeave={() => setHoverLock(false)}
      >
        {comments.map((comment) => (
          <ChatComment
            {...commentProps}
            comment={comment}
            key={comment.comment_id}
            handleCommentClick={handleCommentClick}
            isCompact={isCompact}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="main--empty"
      style={{
        flex: 1,
      }}
    />
  );
}
