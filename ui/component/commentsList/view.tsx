import {
  COMMENT_PAGE_SIZE_TOP_LEVEL,
  SORT_BY,
  LINKED_COMMENT_QUERY_PARAM,
  THREAD_COMMENT_QUERY_PARAM,
} from 'constants/comment';
import { ENABLE_COMMENT_REACTIONS } from 'config';
import { useIsMobile, useIsSmallScreen } from 'effects/use-screensize';
import { getCommentsListTitle } from 'util/comments';
import * as ICONS from 'constants/icons';
import * as REACTION_TYPES from 'constants/reactions';
import Button from 'component/button';
import Card from 'component/common/card';
import classnames from 'classnames';
import CommentView from 'component/comment';
import debounce from 'util/debounce';
import Empty from 'component/common/empty';
import React, { useEffect } from 'react';
import Spinner from 'component/spinner';
import usePersistedState from 'effects/use-persisted-state';
import { useLocation, useNavigate } from 'react-router-dom';
import CommentListMenu from './internal/commentListMenu';
import { lazyImport } from 'util/lazyImport';
import {
  selectClaimForUri,
  selectClaimIsMine,
  selectFetchingMyChannels,
  selectScheduledStateForUri,
  selectProtectedContentTagForUri,
} from 'redux/selectors/claims';
import {
  selectTopLevelCommentsForUri,
  selectTopLevelTotalPagesForUri,
  selectIsFetchingComments,
  selectIsFetchingTopLevelComments,
  selectIsFetchingReacts,
  selectTotalCommentsCountForUri,
  selectOthersReacts,
  selectMyReacts,
  selectCommentIdsForUri,
  selectCommentsEnabledSettingForChannelId,
  selectPinnedCommentsForUri,
  selectCommentForCommentId,
  selectCommentAncestorsForId,
} from 'redux/selectors/comments';
import { doCommentReset, doCommentList, doCommentById, doCommentReactList } from 'redux/actions/comments';
import { doPopOutInlinePlayer } from 'redux/actions/content';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { getChannelIdFromClaim } from 'util/claim';
import {
  doFetchOdyseeMembershipForChannelIds,
  doFetchChannelMembershipsForChannelIds,
} from 'redux/actions/memberships';
import { selectUserHasValidMembershipForCreatorId } from 'redux/selectors/memberships';
import { useAppSelector, useAppDispatch } from 'redux/hooks';

const DEBOUNCE_SCROLL_HANDLER_MS = 200;
const CommentCreate = lazyImport(
  () =>
    import(
      'component/commentCreate'
      /* webpackChunkName: "comments" */
    )
);

function scaleToDevicePixelRatio(value) {
  const devicePixelRatio = window.devicePixelRatio || 1.0;

  if (devicePixelRatio < 1.0) {
    return Math.ceil(value / devicePixelRatio);
  }

  return Math.ceil(value * devicePixelRatio);
}

// ****************************************************************************
// ****************************************************************************
export type Props = {
  uri: string;
  linkedCommentId?: string;
  commentsAreExpanded?: boolean;
  threadCommentId: string | null | undefined;
  notInDrawer?: boolean;
};

// ****************************************************************************
// CommentList
// ****************************************************************************

export default function CommentList(props: Props) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { uri, linkedCommentId, commentsAreExpanded, threadCommentId, notInDrawer } = props;

  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const channelId = getChannelIdFromClaim(claim);
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  const threadComment = useAppSelector((state) => selectCommentForCommentId(state, threadCommentId));
  const activeChannelId = activeChannelClaim && activeChannelClaim.claim_id;
  const allCommentIds = useAppSelector((state) => selectCommentIdsForUri(state, uri));
  const chatCommentsRestrictedToChannelMembers = Boolean(
    useAppSelector((state) => selectProtectedContentTagForUri(state, uri))
  );
  const claimId = claim && claim.claim_id;
  const claimIsMine = useAppSelector((state) => selectClaimIsMine(state, claim));
  const fetchingChannels = useAppSelector(selectFetchingMyChannels);
  const isAChannelMember = useAppSelector((state) => selectUserHasValidMembershipForCreatorId(state, channelId));
  const isFetchingComments = useAppSelector(selectIsFetchingComments);
  const isFetchingReacts = useAppSelector(selectIsFetchingReacts);
  const isFetchingTopLevelComments = useAppSelector(selectIsFetchingTopLevelComments);
  const linkedCommentAncestors = useAppSelector((state) => selectCommentAncestorsForId(state, linkedCommentId));
  const commentsEnabledSetting = useAppSelector((state) => selectCommentsEnabledSettingForChannelId(state, channelId));
  const myReactsByCommentId = useAppSelector(selectMyReacts);
  const othersReactsById = useAppSelector(selectOthersReacts);
  const pinnedComments = useAppSelector((state) => selectPinnedCommentsForUri(state, uri));
  const threadCommentAncestors = useAppSelector((state) => selectCommentAncestorsForId(state, threadCommentId));
  const topLevelComments = useAppSelector((state) => selectTopLevelCommentsForUri(state, uri));
  const topLevelTotalPages = useAppSelector((state) => selectTopLevelTotalPagesForUri(state, uri));
  const totalComments = useAppSelector((state) => selectTotalCommentsCountForUri(state, uri));
  const scheduledState = useAppSelector((state) => selectScheduledStateForUri(state, uri));
  const isMobile = useIsMobile();
  const isSmallScreen = useIsSmallScreen();
  const urlParams = new URLSearchParams(search);
  const isShortsParam = urlParams.get('view') === 'shorts';
  const currentFetchedPage = Math.ceil(topLevelComments.length / COMMENT_PAGE_SIZE_TOP_LEVEL);
  const spinnerRef = React.useRef();
  const commentListRef = React.useRef();
  const threadRedirect = React.useRef(false);
  const DEFAULT_SORT = ENABLE_COMMENT_REACTIONS ? SORT_BY.POPULARITY : SORT_BY.NEWEST;
  const [sort, setSort] = usePersistedState('comment-sort-by', DEFAULT_SORT);
  const [page, setPage] = React.useState(currentFetchedPage > 0 ? currentFetchedPage : 1);
  const [didInitialPageFetch, setInitialPageFetch] = React.useState(false);
  const hasDefaultExpansion = commentsAreExpanded || !isSmallScreen || isMobile;
  const [expandedComments, setExpandedComments] = React.useState(hasDefaultExpansion);
  const [debouncedUri, setDebouncedUri] = React.useState();
  const [uiFilteredComments, setUiFilteredComments] = React.useState([]);
  const updateUiFilteredComments = React.useCallback((commentIds) => {
    setUiFilteredComments((prevCommentIds) => {
      const newCommentIds = commentIds.filter((id) => !prevCommentIds.includes(id));
      return newCommentIds.length > 0 ? [...prevCommentIds, ...newCommentIds] : prevCommentIds;
    });
  }, []);
  const totalUnfilteredComments = totalComments > 0 ? totalComments - uiFilteredComments.length : totalComments;
  const totalFetchedComments = allCommentIds ? allCommentIds.length : 0;
  const moreBelow = page < topLevelTotalPages;
  const title = getCommentsListTitle(totalUnfilteredComments);
  const threadDepthLevel = isMobile || isShortsParam ? 3 : 10;
  let threadCommentParent;

  if (threadCommentAncestors) {
    threadCommentAncestors.some((ancestor, index) => {
      if (index >= threadDepthLevel - 1) return true;
      threadCommentParent = ancestor;
    });
  }

  const threadTopLevelComment = threadCommentAncestors && threadCommentAncestors[threadCommentAncestors.length - 1];
  // Display comments immediately if not fetching reactions
  // If not, wait to show comments until reactions are fetched
  const [readyToDisplayComments, setReadyToDisplayComments] = React.useState(
    Boolean(othersReactsById) || !ENABLE_COMMENT_REACTIONS
  );
  // get commenter claim ids for checking premium status
  const commenterClaimIds = React.useMemo(() => {
    return topLevelComments.map((comment) => comment.channel_id);
  }, [topLevelComments]);
  React.useEffect(() => {
    if (commenterClaimIds.length > 0 && channelId) {
      dispatch(doFetchOdyseeMembershipForChannelIds(commenterClaimIds));
      dispatch(doFetchChannelMembershipsForChannelIds(channelId, commenterClaimIds));
    } // todo: investigate why topLevelComments triggers a re-render even though the comments are the same
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keep commenterClaimIds.length instead
  }, [channelId, commenterClaimIds.length, dispatch]);
  const handleReset = React.useCallback(() => {
    if (claimId) dispatch(doCommentReset(claimId));
    setInitialPageFetch(false);
    setPage(1);
  }, [claimId, dispatch]);

  function refreshComments() {
    setInitialPageFetch(false);
    dispatch(doCommentList(uri, undefined, 1, COMMENT_PAGE_SIZE_TOP_LEVEL, sort, false));
    setPage(1);
    dispatch(
      doPopOutInlinePlayer({
        source: 'comment',
      })
    );
  }

  function changeSort(newSort) {
    if (sort !== newSort) {
      setSort(newSort);
      setInitialPageFetch(false);
      dispatch(doCommentList(uri, undefined, 1, COMMENT_PAGE_SIZE_TOP_LEVEL, newSort, false));
      setPage(1);
      dispatch(
        doPopOutInlinePlayer({
          source: 'comment',
        })
      );
    }
  }

  // If a linked comment is deep within a thread, redirect to it's own thread page
  // based on the set depthLevel (mobile/desktop)
  React.useEffect(() => {
    if (
      !threadCommentId &&
      linkedCommentId &&
      linkedCommentAncestors &&
      linkedCommentAncestors.length > threadDepthLevel - 1 &&
      !threadRedirect.current
    ) {
      const urlParams = new URLSearchParams(search);
      urlParams.set(THREAD_COMMENT_QUERY_PARAM, linkedCommentId);
      navigate({
        pathname,
        search: urlParams.toString(),
      });
      // to do it only once
      threadRedirect.current = true;
    }
  }, [linkedCommentAncestors, linkedCommentId, navigate, pathname, search, threadCommentId, threadDepthLevel]);
  // TODO: still have to change this to use the new check
  const notAuthedToChat = chatCommentsRestrictedToChannelMembers && !isAChannelMember && !claimIsMine;
  // set new page on scroll debounce and avoid setting the page after navigated uris
  useEffect(() => {
    if (debouncedUri && debouncedUri === uri) {
      setPage(page + 1);
      setDebouncedUri(undefined);
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- Only for comparing uri with debounced uri
  }, [debouncedUri, uri]);
  // Force comments reset
  useEffect(() => {
    if (page === 0) {
      handleReset();
    }
  }, [handleReset, page]);
  // Set page back to 1 on every claim switch
  useEffect(() => {
    setInitialPageFetch(false);
    return () => setPage(1); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);
  // When navigating to a new claim, the page will be 1 due to the above
  // and if there was already fetched top level comments, the fetched page will be higher
  // so set the current page as the fetched page to start fetching new pages from there
  useEffect(() => {
    if (page < currentFetchedPage) setPage(currentFetchedPage > 0 ? currentFetchedPage : 1); // eslint-disable-next-line react-hooks/exhaustive-deps -- Only on uri change
  }, [uri]);
  // Fetch linked/thread comment independently of pagination state
  useEffect(() => {
    if (threadCommentId) {
      dispatch(doCommentById(threadCommentId));
    }

    if (linkedCommentId) {
      dispatch(doCommentById(linkedCommentId));
    }
  }, [dispatch, linkedCommentId, threadCommentId]);
  // Fetch top-level comments
  useEffect(() => {
    const isInitialFetch = page === 1 && !didInitialPageFetch;
    const isNewPage = page !== 1 && page !== currentFetchedPage;
    // only one or the other should be true, if both are true it means
    // it will fetch the wrong page initially. needs Number so it's 0 or 1
    const hasRightFetchPage = Number(isInitialFetch) ^ Number(isNewPage);

    if (page !== 0 && hasRightFetchPage) {
      dispatch(doCommentList(uri, undefined, page, COMMENT_PAGE_SIZE_TOP_LEVEL, sort, false));
      if (page === 1) {
        setInitialPageFetch(true);
      }
    }
  }, [currentFetchedPage, didInitialPageFetch, dispatch, page, sort, uri]);
  React.useEffect(() => {
    if (threadCommentId) {
      refreshComments();
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [threadCommentId]);
  // Fetch reacts
  useEffect(() => {
    if (totalFetchedComments > 0 && ENABLE_COMMENT_REACTIONS && !fetchingChannels && !isFetchingReacts) {
      let idsForReactionFetch;

      if (!othersReactsById || !myReactsByCommentId) {
        idsForReactionFetch = allCommentIds;
      } else {
        idsForReactionFetch = allCommentIds.filter((commentId) => {
          const key = activeChannelId ? `${commentId}:${activeChannelId}` : commentId;
          return !othersReactsById[key] || (activeChannelId && !myReactsByCommentId[key]);
        });
      }

      if (idsForReactionFetch.length !== 0) {
        dispatch(doCommentReactList(idsForReactionFetch))
          .then(() => {
            setReadyToDisplayComments(true);
          })
          .catch(() => setReadyToDisplayComments(true));
      }
    }
  }, [
    activeChannelId,
    allCommentIds,
    dispatch,
    fetchingChannels,
    isFetchingReacts,
    myReactsByCommentId,
    othersReactsById,
    totalFetchedComments,
  ]);
  // Scroll to linked-comment
  useEffect(() => {
    if (linkedCommentId || threadCommentId) {
      window.pendingLinkedCommentScroll = true;
    } else {
      delete window.pendingLinkedCommentScroll;
    }
  }, [linkedCommentId, threadCommentId]);
  // Infinite scroll
  useEffect(() => {
    if (topLevelComments.length === 0) return;

    function shouldFetchNextPage(page, topLevelTotalPages, yPrefetchPx = 1000) {
      if (!spinnerRef || !spinnerRef.current) return false;
      const rect = spinnerRef.current.getBoundingClientRect();

      const windowH = window.innerHeight || document.documentElement.clientHeight;

      const windowW = window.innerWidth || document.documentElement.clientWidth;
      const isApproachingViewport = yPrefetchPx !== 0 && rect.top < windowH + scaleToDevicePixelRatio(yPrefetchPx);
      const isInViewport =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom >= 0 &&
        rect.right >= 0 &&
        rect.top <= windowH &&
        rect.left <= windowW;
      return (isInViewport || isApproachingViewport) && page < topLevelTotalPages;
    }

    const handleCommentScroll = debounce(() => {
      if (shouldFetchNextPage(page, topLevelTotalPages)) {
        setDebouncedUri(uri);
        setInitialPageFetch(true);
      }
    }, DEBOUNCE_SCROLL_HANDLER_MS);

    if (!didInitialPageFetch) {
      handleCommentScroll();
      setInitialPageFetch(true);
    }

    if (hasDefaultExpansion && !isFetchingComments && readyToDisplayComments && moreBelow) {
      const commentsInDrawer = Boolean(document.querySelector('.MuiDrawer-root .card--enable-overflow'));
      const scrollingElement = commentsInDrawer ? document.querySelector('.card--enable-overflow') : window;

      if (scrollingElement) {
        scrollingElement.addEventListener('scroll', handleCommentScroll);
        return () => scrollingElement.removeEventListener('scroll', handleCommentScroll);
      }
    }
  }, [
    topLevelComments,
    hasDefaultExpansion,
    didInitialPageFetch,
    isFetchingComments,
    isMobile,
    moreBelow,
    page,
    readyToDisplayComments,
    topLevelTotalPages,
    uri,
  ]);
  const commentProps = {
    isTopLevel: true,
    uri,
    linkedCommentId,
    threadCommentId,
    threadDepthLevel,
  };
  const actionButtonsProps = {
    uri,
    totalUnfilteredComments,
    sort,
    changeSort,
    handleRefresh: refreshComments,
  };

  if (scheduledState === 'scheduled') {
    // Not ready yet, so hide it.
    return null;
  }

  return (
    <Card
      className="card--enable-overflow comment__list"
      title={(!isMobile || notInDrawer) && title}
      titleActions={<CommentActionButtons {...actionButtonsProps} />}
      actions={
        <>
          {isMobile && !notInDrawer && <CommentActionButtons {...actionButtonsProps} />}

          <CommentCreate uri={uri} />

          {threadCommentId && threadComment && (
            <span className="comment__actions comment__thread-links">
              <ThreadLinkButton
                label={__('View all comments')}
                threadCommentParent={threadTopLevelComment || threadCommentId}
                threadCommentId={threadCommentId}
                isViewAll
              />

              {threadCommentParent && (
                <ThreadLinkButton
                  label={__('Show parent comments')}
                  threadCommentParent={threadCommentParent}
                  threadCommentId={threadCommentId}
                />
              )}
            </span>
          )}

          {commentsEnabledSetting && !isFetchingComments && !totalUnfilteredComments && !threadCommentId && (
            <Empty padded text={__('That was pretty deep. What do you think?')} />
          )}

          <ul
            ref={commentListRef}
            className={classnames('comments', {
              'comments--contracted': isSmallScreen && !expandedComments && totalUnfilteredComments > 1,
            })}
          >
            {readyToDisplayComments && (
              <>
                {threadComment && (
                  <CommentView
                    key={threadComment.comment_id}
                    comment={threadComment}
                    disabled={notAuthedToChat}
                    updateUiFilteredComments={updateUiFilteredComments}
                    {...commentProps}
                  />
                )}
                {pinnedComments &&
                  pinnedComments.map((c) => {
                    if (threadComment && threadCommentAncestors && threadCommentAncestors.includes(c.comment_id)) {
                      // Skip if part of the linked comment thread - thread is shown at the top
                      return;
                    }

                    return (
                      <CommentView
                        key={c.comment_id}
                        comment={c}
                        disabled={notAuthedToChat}
                        updateUiFilteredComments={updateUiFilteredComments}
                        {...commentProps}
                      />
                    );
                  })}

                {topLevelComments.map((c) => {
                  if (threadComment && threadCommentAncestors && threadCommentAncestors.includes(c.comment_id)) {
                    // Skip if part of the linked comment thread - thread is shown at the top
                    return;
                  }

                  return (
                    <CommentView
                      key={c.comment_id}
                      comment={c}
                      disabled={notAuthedToChat}
                      updateUiFilteredComments={updateUiFilteredComments}
                      {...commentProps}
                    />
                  );
                })}
              </>
            )}
          </ul>

          {!hasDefaultExpansion && (
            <div className="card__bottom-actions card__bottom-actions--comments">
              {(!expandedComments || moreBelow) && totalUnfilteredComments > 1 && (
                <Button
                  button="link"
                  title={!expandedComments ? __('Expand') : __('More')}
                  label={!expandedComments ? __('Expand') : __('More')}
                  onClick={() => (!expandedComments ? setExpandedComments(true) : setPage(page + 1))}
                />
              )}
              {expandedComments && totalUnfilteredComments > 1 && (
                <Button
                  button="link"
                  title={__('Collapse')}
                  label={__('Collapse')}
                  onClick={() => {
                    setExpandedComments(false);

                    if (commentListRef.current) {
                      const ADDITIONAL_OFFSET = 200;
                      const refTop = commentListRef.current.getBoundingClientRect().top;
                      window.scrollTo({
                        top: refTop + window.pageYOffset - ADDITIONAL_OFFSET,
                        behavior: 'smooth',
                      });
                    }
                  }}
                />
              )}
            </div>
          )}

          {(threadCommentId
            ? !readyToDisplayComments
            : isFetchingTopLevelComments || (hasDefaultExpansion && moreBelow)) && (
            <div className="main--empty" ref={spinnerRef}>
              <Spinner type="small" />
            </div>
          )}
        </>
      }
    />
  );
}
type ActionButtonsProps = {
  uri: string;
  totalUnfilteredComments: number;
  sort: number;
  changeSort: (arg0: number) => void;
  handleRefresh: () => void;
};

const CommentActionButtons = (actionButtonsProps: ActionButtonsProps) => {
  const { uri, totalUnfilteredComments, sort, changeSort, handleRefresh } = actionButtonsProps;
  const sortButtonProps = {
    activeSort: sort,
    changeSort,
  };
  return (
    <div className="comment__actions">
      {totalUnfilteredComments > 1 && ENABLE_COMMENT_REACTIONS && (
        <span className="comment__sort">
          <SortButton {...sortButtonProps} label={__('Best')} icon={ICONS.BEST} sortOption={SORT_BY.POPULARITY} />
          <SortButton
            {...sortButtonProps}
            label={__('Controversial')}
            icon={ICONS.CONTROVERSIAL}
            sortOption={SORT_BY.CONTROVERSY}
          />
          <SortButton {...sortButtonProps} label={__('New')} icon={ICONS.NEW} sortOption={SORT_BY.NEWEST} />
        </span>
      )}

      <div className="comment__settings">
        <Button
          button="alt"
          icon={ICONS.REFRESH}
          title={__('Refresh')}
          className="comment__refresh-button"
          onClick={(e) => {
            const btn = e.currentTarget;
            btn.classList.add('comment__refresh-button--spinning');
            btn.addEventListener('animationend', () => btn.classList.remove('comment__refresh-button--spinning'), {
              once: true,
            });
            handleRefresh();
          }}
        />
        <CommentListMenu uri={uri} />
      </div>
    </div>
  );
};

type SortButtonProps = {
  activeSort: number;
  sortOption: number;
  changeSort: (arg0: number) => void;
};

const SortButton = (sortButtonProps: SortButtonProps) => {
  const { activeSort, sortOption, changeSort, ...buttonProps } = sortButtonProps;
  return (
    <Button
      {...buttonProps}
      className={classnames(`button-toggle`, {
        'button-toggle--active': activeSort === sortOption,
      })}
      button="alt"
      iconSize={18}
      onClick={() => changeSort(sortOption)}
    />
  );
};

type ThreadLinkProps = {
  label: string;
  isViewAll?: boolean;
  threadCommentParent: string;
  threadCommentId: string;
};

const ThreadLinkButton = (props: ThreadLinkProps) => {
  const { label, isViewAll, threadCommentParent, threadCommentId } = props;
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  return (
    <Button
      button="link"
      label={label}
      icon={ICONS.ARROW_LEFT}
      iconSize={12}
      onClick={() => {
        const urlParams = new URLSearchParams(search);

        if (!isViewAll) {
          urlParams.set(THREAD_COMMENT_QUERY_PARAM, threadCommentParent);
          // on moving back, link the current thread comment so that it auto-expands into the correct conversation
          urlParams.set(LINKED_COMMENT_QUERY_PARAM, threadCommentId);
        } else {
          urlParams.delete(THREAD_COMMENT_QUERY_PARAM);
          // links the top-level comment when going back to all comments, for easy locating
          // in the middle of big comment sections
          urlParams.set(LINKED_COMMENT_QUERY_PARAM, threadCommentParent);
        }

        window.pendingLinkedCommentScroll = true;
        navigate({
          pathname,
          search: urlParams.toString(),
        });
      }}
    />
  );
};
