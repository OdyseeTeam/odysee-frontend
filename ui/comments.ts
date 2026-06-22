import { COMMENT_SERVER_API } from 'config';
import { HYPERBEAM_DEVICE, hyperbeamSdkPostParams64 } from 'util/hyperbeamDevices';
import { isHyperbeamDeviceEnabled, shouldAllowOriginalNetworkFallback } from 'util/hyperbeamMode';
// prettier-ignore
const Comments = {
  url: COMMENT_SERVER_API,
  enabled: Boolean(isHyperbeamDeviceEnabled(HYPERBEAM_DEVICE.comment) || COMMENT_SERVER_API),
  moderation_block: (params: ModerationBlockParams) => fetchCommentsApi('moderation.Block', params),
  moderation_unblock: (params: ModerationBlockParams) => fetchCommentsApi('moderation.UnBlock', params),
  moderation_block_list: (params: BlockedListArgs) => fetchCommentsApi('moderation.BlockedList', params),
  moderation_add_delegate: (params: ModerationAddDelegateParams) => fetchCommentsApi('moderation.AddDelegate', params),
  moderation_remove_delegate: (params: ModerationRemoveDelegateParams) => fetchCommentsApi('moderation.RemoveDelegate', params),
  moderation_list_delegates: (params: ModerationListDelegatesParams) => fetchCommentsApi('moderation.ListDelegates', params),
  moderation_am_i: (params: ModerationAmIParams) => fetchCommentsApi('moderation.AmI', params),
  comment_list: (params: CommentListParams) => fetchHyperbeamNodeCommentRead('comment_list', params),
  comment_abandon: (params: CommentAbandonParams) => fetchCommentsApi('comment.Abandon', params),
  comment_create: (params: CommentCreateParams) => fetchCommentsApi('comment.Create', params),
  comment_by_id: (params: CommentByIdParams) => fetchHyperbeamNodeCommentRead('comment_by_id', params),
  comment_pin: (params: CommentPinParams) => fetchCommentsApi('comment.Pin', params),
  comment_edit: (params: CommentEditParams) => fetchCommentsApi('comment.Edit', params),
  reaction_list: (params: ReactionListParams) => fetchHyperbeamNodeCommentRead('reaction_list', params),
  reaction_react: (params: ReactionReactParams) => fetchCommentsApi('reaction.React', params),
  setting_list: (params: SettingsParams) => fetchHyperbeamNodeCommentRead('setting_list', params),
  setting_block_word: (params: BlockWordParams) => fetchCommentsApi('setting.BlockWord', params),
  setting_unblock_word: (params: BlockWordParams) => fetchCommentsApi('setting.UnBlockWord', params),
  setting_list_blocked_words: (params: SettingsParams) => fetchCommentsApi('setting.ListBlockedWords', params),
  setting_update: (params: UpdateSettingsParams) => fetchCommentsApi('setting.Update', params),
  setting_get: (params: SettingsParams) => fetchHyperbeamNodeCommentRead('setting_get', params),
  super_list: (params: SuperListParams) => fetchCommentsApi('comment.SuperChatList', params),
  verify_claim_signature: (params: VerifyClaimSignatureParams) => fetchCommentsApi('verify.ClaimSignature', params)
};

function fetchHyperbeamNodeCommentRead(
  endpoint:
    | 'comment_list'
    | 'comment_by_id'
    | 'comment_get_channel_from_comment_id'
    | 'reaction_list'
    | 'setting_get'
    | 'setting_list',
  params: {}
) {
  const request = hyperbeamSdkPostParams64(endpoint, params || {});
  if (!request) {
    if (!shouldAllowOriginalNetworkFallback()) {
      return Promise.resolve(emptyHyperbeamCommentResult(endpoint));
    }
    return fetchCommentsApi(commentReadMethod(endpoint), params || {});
  }
  return request
    .then((res) => {
      if (!res.ok) throw new Error(`comment device ${res.status}`);
      return res.json();
    })
    .then((res) => {
      if (res.error) throw new Error(res.error.message || res.error);
      return Object.prototype.hasOwnProperty.call(res, 'result') ? res.result : res;
    })
    .catch((_error) => {
      if (!shouldAllowOriginalNetworkFallback()) return emptyHyperbeamCommentResult(endpoint);
      return fetchCommentsApi(commentReadMethod(endpoint), params || {});
    });
}

function commentReadMethod(endpoint: string) {
  switch (endpoint) {
    case 'comment_list':
      return 'comment.List';
    case 'comment_by_id':
      return 'comment.ByID';
    case 'comment_get_channel_from_comment_id':
      return 'comment.GetChannelFromCommentID';
    case 'reaction_list':
      return 'reaction.List';
    case 'setting_get':
      return 'setting.Get';
    case 'setting_list':
      return 'setting.List';
    default:
      return endpoint;
  }
}

function fetchCommentsApi(method: string, params: {}) {
  if (!Comments.enabled) {
    return Promise.reject('Comments are not currently enabled.'); // eslint-disable-line
  }

  const request = hyperbeamSdkPostParams64('commentron', { method, params });
  if (request) {
    return request
      .then((res) => {
        if (!res.ok) throw new Error(`comment device ${res.status}`);
        return res.json();
      })
      .then((res) => {
        if (res.error) throw new Error(res.error.message || res.error);
        return Object.prototype.hasOwnProperty.call(res, 'result') ? res.result : res;
      })
      .catch((_error) => {
        if (!shouldAllowOriginalNetworkFallback()) return emptyHyperbeamCommentApiResult(method);
        return fetchCommentsApiOriginal(method, params);
      });
  }

  if (!shouldAllowOriginalNetworkFallback()) {
    return Promise.resolve(emptyHyperbeamCommentApiResult(method));
  }

  return fetchCommentsApiOriginal(method, params);
}

function fetchCommentsApiOriginal(method: string, params: {}) {
  const url = `${Comments.url}?m=${method}`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  };
  return fetch(url, options)
    .then((res) => res.json())
    .then((res) => {
      if (res.error) {
        throw new Error(res.error.message);
      }

      return res.result;
    });
}

function emptyHyperbeamCommentResult(endpoint: string) {
  switch (endpoint) {
    case 'setting_get':
      return {};
    case 'setting_list':
      return [];
    case 'comment_list':
      return { items: [], page: 1, page_size: 0, total_items: 0, total_pages: 0 };
    case 'comment_by_id':
    case 'comment_get_channel_from_comment_id':
      return null;
    case 'reaction_list':
      return {};
    default:
      return {};
  }
}

function emptyHyperbeamCommentApiResult(method: string) {
  switch (method) {
    case 'setting.ListBlockedWords':
      return [];
    case 'moderation.BlockedList':
    case 'moderation.ListDelegates':
      return [];
    case 'moderation.AmI':
      return {};
    default:
      return {};
  }
}

export default Comments;
