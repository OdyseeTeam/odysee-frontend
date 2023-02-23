import * as ACTIONS from 'constants/action_types';
import { getAuthToken } from 'util/saved-passwords';
import { doNotificationList } from 'redux/actions/notifications';
import { doFetchChannelIsLiveForId } from 'redux/actions/livestream';
import { selectLivestreamInfoAlreadyFetchedForCreatorId } from 'redux/selectors/livestream';
import { selectClaimForId, selectChannelClaimIdForUri, selectProtectedContentTagForUri } from 'redux/selectors/claims';
import { SOCKETY_SERVER_API } from 'config';

const NOTIFICATION_WS_URL = `${SOCKETY_SERVER_API}/internal?id=`;
const COMMENT_WS_URL = `${SOCKETY_SERVER_API}/commentron?id=`;
const COMMENT_WS_SUBCATEGORIES = {
  COMMENTER: 'commenter',
  VIEWER: 'viewer',
};

let sockets = {};
let closingSockets = {};
let retryCount = 0;

const getCommentSocketUrl = (claimId, channelName) => {
  return `${COMMENT_WS_URL}${claimId}&category=${channelName}&sub_category=viewer`;
};

const getCommentSocketUrlForCommenter = (claimId, channelName) => {
  return `${COMMENT_WS_URL}${claimId}&category=${channelName}&sub_category=commenter`;
};

export const doSocketConnect = (url, cb, type) => {
  function connectToSocket() {
    if (sockets[url] !== undefined && sockets[url] !== null) {
      sockets[url].close();
      sockets[url] = null;
    }

    const timeToWait = retryCount ** 2 * 1000;
    setTimeout(() => {
      sockets[url] = new WebSocket(url);
      sockets[url].onopen = (e) => {
        retryCount = 0;
        console.log(`Connected to ${type} WS`); // eslint-disable-line
      };

      sockets[url].onmessage = (e) => {
        const data = JSON.parse(e.data);
        cb(data);
      };

      sockets[url].onerror = (e) => {
        console.log(`${type} websocket onerror`, e); // eslint-disable-line
        // onerror and onclose will both fire, so nothing is needed here
      };

      sockets[url].onclose = () => {
        console.log(`Disconnected from ${type} WS`); // eslint-disable-line
        if (!closingSockets[url]) {
          retryCount += 1;
          connectToSocket();
        } else {
          closingSockets[url] = null;
        }
      };
    }, timeToWait);
  }

  connectToSocket();
};

export const doSocketDisconnect = (url) => (dispatch) => {
  if (sockets[url] !== undefined && sockets[url] !== null) {
    closingSockets[url] = true;
    sockets[url].close();
    sockets[url] = null;

    dispatch({
      type: ACTIONS.WS_DISCONNECT,
    });
  }
};

export const doNotificationSocketConnect = (enableNotifications) => (dispatch) => {
  const authToken = getAuthToken();
  if (!authToken) {
    console.error('Unable to connect to web socket because auth token is missing'); // eslint-disable-line
    return;
  }

  const url = `${NOTIFICATION_WS_URL}${authToken}`;

  doSocketConnect(
    url,
    (data) => {
      switch (data.type) {
        case 'pending_notification':
          if (enableNotifications) {
            dispatch(doNotificationList());
          }
          break;
        case 'swap-status':
          dispatch({
            type: ACTIONS.COIN_SWAP_STATUS_RECEIVED,
            data: data.data,
          });
          break;
      }
    },
    'notification'
  );
};

export const doCommentSocketConnect = (uri, channelName, claimId, subCategory) => (dispatch, getState) => {
  const state = getState();
  const creatorId = selectChannelClaimIdForUri(state, uri);
  const isLiveFetchPending = !selectLivestreamInfoAlreadyFetchedForCreatorId(state, creatorId);

  const claim = selectClaimForId(state, claimId);
  const isProtectedContent = Boolean(claim && selectProtectedContentTagForUri(state, claim.permanent_url));
  // have to reverse here if protected, because the comments list expects the claim id to be proper
  const reversedClaimId = claimId.split('').reverse().join('');

  // -- this will NOT be used for redux states since everywhere else, the regular claimId will be used on selectors
  const claimIdForSocketUrl = isProtectedContent ? reversedClaimId : claimId;

  const url =
    subCategory === COMMENT_WS_SUBCATEGORIES.COMMENTER
      ? getCommentSocketUrlForCommenter(claimIdForSocketUrl, channelName)
      : getCommentSocketUrl(claimIdForSocketUrl, channelName);

  doSocketConnect(
    url,
    (response) => {
      if (response.type === 'delta') {
        const newComment = response.data.comment;

        dispatch({
          type: ACTIONS.COMMENT_RECEIVED,
          data: { comment: newComment, claimId, uri },
        });
      }
      if (response.type === 'viewers') {
        const connected = response.data.connected;
        dispatch({
          type: ACTIONS.VIEWERS_RECEIVED,
          data: { connected, claimId },
        });
      }
      if (response.type === 'pinned') {
        const pinnedComment = response.data.comment;
        dispatch({
          type: ACTIONS.COMMENT_PIN_COMPLETED,
          data: {
            pinnedComment: pinnedComment,
            claimId,
            unpin: !pinnedComment.is_pinned,
          },
        });
      }
      if (response.type === 'removed') {
        const { comment_id } = response.data.comment;
        dispatch({
          type: ACTIONS.COMMENT_MARK_AS_REMOVED,
          data: { comment_id },
        });
      }

      if (response.type === 'setting') {
        const state = getState();
        const creatorId = selectChannelClaimIdForUri(state, uri);
        dispatch({
          type: ACTIONS.WEBSOCKET_MEMBERS_ONLY_TOGGLE_COMPLETE,
          data: { responseData: response.data, creatorId },
        });
      }

      if (response.type === 'livestream') {
        // update the live status for the stream
        dispatch(doFetchChannelIsLiveForId(creatorId));
      }
    },
    `${subCategory || COMMENT_WS_SUBCATEGORIES.VIEWER} comment`
  );

  if (isLiveFetchPending) {
    // update the live status for the stream
    dispatch(doFetchChannelIsLiveForId(creatorId));
  }

  dispatch(doSetSocketConnection(true, claimId, subCategory || COMMENT_WS_SUBCATEGORIES.VIEWER));
};

export const doCommentSocketDisconnect = (claimId, channelName, subCategory) => (dispatch, getState) => {
  const state = getState();
  const claim = selectClaimForId(state, claimId);
  const isProtectedContent = Boolean(claim && selectProtectedContentTagForUri(state, claim.permanent_url));
  // have to reverse here if protected, because the comments list expects the claim id to be proper
  const reversedClaimId = claimId.split('').reverse().join('');

  // -- this will NOT be used for redux states since everywhere else, the regular claimId will be used on selectors
  const claimIdForSocketUrl = isProtectedContent ? reversedClaimId : claimId;

  const url =
    subCategory === COMMENT_WS_SUBCATEGORIES.COMMENTER
      ? getCommentSocketUrlForCommenter(claimIdForSocketUrl, channelName)
      : getCommentSocketUrl(claimIdForSocketUrl, channelName);

  dispatch(doSocketDisconnect(url));
  dispatch(doSetSocketConnection(false, claimId, subCategory));
};

export const doCommentSocketConnectAsCommenter = (uri, channelName, claimId, isProtected) => (dispatch) =>
  dispatch(doCommentSocketConnect(uri, channelName, claimId, COMMENT_WS_SUBCATEGORIES.COMMENTER, isProtected));

export const doCommentSocketDisconnectAsCommenter = (claimId, channelName) => (dispatch) =>
  dispatch(doCommentSocketDisconnect(claimId, channelName, COMMENT_WS_SUBCATEGORIES.COMMENTER));

export const doSetSocketConnection = (connected, id, subCategory) => (dispatch) =>
  dispatch({ type: ACTIONS.SOCKET_CONNECTED_BY_ID, data: { connected, sub_category: subCategory, id } });
