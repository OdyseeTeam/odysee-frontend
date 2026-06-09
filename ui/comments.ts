import { COMMENT_SERVER_API, ODYSEE_HYPERBEAM_NODE_API } from 'config';
import { HYPERBEAM_DEVICE, hyperbeamDeviceUrl } from 'util/hyperbeamDevices';
// prettier-ignore
const Comments = {
  url: COMMENT_SERVER_API,
  enabled: Boolean(ODYSEE_HYPERBEAM_NODE_API || COMMENT_SERVER_API),
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
  const url = hyperbeamDeviceUrl(HYPERBEAM_DEVICE.comment, endpoint, {
    params64: base64Url(JSON.stringify(params || {})),
  });
  if (!url) return Promise.reject(new Error('Odysee HyperBEAM Commentron device is not configured.'));
  return fetch(url, { method: 'GET', headers: { accept: 'application/json' } })
    .then((res) => {
      if (!res.ok) throw new Error(`comment device ${res.status}`);
      return res.json();
    })
    .then((res) => {
      if (res.error) throw new Error(res.error.message || res.error);
      return Object.prototype.hasOwnProperty.call(res, 'result') ? res.result : res;
    });
}

function fetchCommentsApi(method: string, params: {}) {
  if (!Comments.enabled) {
    return Promise.reject('Comments are not currently enabled.'); // eslint-disable-line
  }

  const nodeUrl = hyperbeamDeviceUrl(HYPERBEAM_DEVICE.comment, 'commentron', {
    params64: base64Url(JSON.stringify({ method, params })),
  });
  if (nodeUrl) {
    return fetch(nodeUrl, { method: 'GET', headers: { accept: 'application/json' } })
      .then((res) => {
        if (!res.ok) throw new Error(`comment device ${res.status}`);
        return res.json();
      })
      .then((res) => {
        if (res.error) throw new Error(res.error.message || res.error);
        return Object.prototype.hasOwnProperty.call(res, 'result') ? res.result : res;
      });
  }

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

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default Comments;
