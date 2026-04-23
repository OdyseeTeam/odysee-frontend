/**
 * Comment and reaction types.
 *
 * Types for the Commentron API (comments, moderation, reactions, settings).
 */

type CommentId = string;

type CommentCreateParams = {
  claim_id: string;
  channel_id: string;
  channel_name: string;
  body: string;
  parent_id?: string;
  signature: string;
  signing_ts: string;
  support_amount?: number;
  payment_intent_id?: string;
  environment?: string;
  sticker?: boolean;
  [key: string]: any;
};

type CommentCreateResponse = {
  comment_id: string;
  [key: string]: any;
};

type CommentEditParams = {
  comment_id: string;
  body: string;
  channel_id: string;
  channel_name: string;
  signature: string;
  signing_ts: string;
};

type CommentEditResponse = {
  [key: string]: any;
};

type CommentAbandonParams = {
  comment_id: string;
  creator_channel_id?: string;
  creator_channel_name?: string;
  channel_id?: string;
  channel_name?: string;
  signature?: string;
  signing_ts?: string;
};

type CommentAbandonResponse = {
  [key: string]: any;
};

type CommentListParams = {
  claim_id?: string;
  page?: number;
  page_size?: number;
  parent_id?: string;
  top_level?: boolean;
  channel_id?: string;
  channel_name?: string;
  sort_by?: number;
  is_channel_signature_valid?: boolean;
  hidden?: boolean;
  visible?: boolean;
  [key: string]: any;
};

type CommentListResponse = {
  items: Array<any>;
  page: number;
  page_size: number;
  total_items: number;
  total_filtered_items: number;
  total_pages: number;
  has_hidden_comments: boolean;
};

type CommentByIdParams = {
  comment_id: string;
  with_ancestors?: boolean;
};

type CommentByIdResponse = {
  items: Array<any>;
  item?: any;
  ancestors?: Array<any>;
};

type CommentPinParams = {
  comment_id: string;
  channel_id: string;
  channel_name: string;
  signature: string;
  signing_ts: string;
  remove?: boolean;
};

type CommentPinResponse = {
  items: Array<any>;
};

type CommentSubmitParams = CommentCreateParams;
type CommentsList = Array<any>;

type ReactionListParams = {
  comment_ids: string;
  channel_id?: string;
  channel_name?: string;
  signature?: string;
  signing_ts?: string;
};

type ReactionReactParams = {
  comment_ids: string;
  type: string;
  clear_types?: string;
  channel_id: string;
  channel_name: string;
  signature: string;
  signing_ts: string;
};

type ReactionListResponse = {
  my_reactions: any;
  others_reactions: any;
};

type ReactionReactResponse = {
  [key: string]: any;
};

type ModerationBlockParams = {
  blocked_channel_id: string;
  blocked_channel_name: string;
  channel_id: string;
  channel_name: string;
  signature: string;
  signing_ts: string;
  time_out?: number;
  delete_all?: boolean;
  mod_channel_id?: string;
  mod_channel_name?: string;
  creator_channel_id?: string;
  creator_channel_name?: string;
};

type ModerationAddDelegateParams = {
  channel_id: string;
  channel_name: string;
  delegate_channel_id: string;
  delegate_channel_name: string;
  signature: string;
  signing_ts: string;
};

type ModerationRemoveDelegateParams = ModerationAddDelegateParams;

type ModerationListDelegatesParams = {
  channel_id: string;
  channel_name: string;
  signature: string;
  signing_ts: string;
};

type ModerationAmIParams = {
  channel_id: string;
  channel_name: string;
  signature: string;
  signing_ts: string;
};

type SettingsParams = {
  channel_id: string;
  channel_name: string;
  signature: string;
  signing_ts: string;
};

type SettingsResponse = {
  [key: string]: any;
};

type UpdateSettingsParams = SettingsParams & {
  [key: string]: any;
};

type BlockWordParams = {
  channel_id: string;
  channel_name: string;
  signature: string;
  signing_ts: string;
  words: string;
};

type BlockedListArgs = {
  channel_id: string;
  channel_name: string;
  signature: string;
  signing_ts: string;
};

type SuperListResponse = {
  items: Array<any>;
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  [key: string]: any;
};
