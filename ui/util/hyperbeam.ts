import { HYPERBEAM_BASE_URL } from 'config';

const HYPERBEAM_TIMEOUT_MS = 5000;
const COMMENT_DEVICE = '~odysee-comment@1.0';
const CHANNEL_DEVICE = '~lbry-channel@1.0';

type HyperbeamChannel = {
  claim_id?: string;
  name?: string;
  permanent_url?: string;
  canonical_url?: string;
  short_url?: string;
  value?: {
    title?: string;
    description?: string;
    thumbnail?: { url?: string };
  };
  [key: string]: any;
};

export async function fetchHyperbeamCommentList(params: CommentListParams): Promise<CommentListResponse | null> {
  const response = await fetchDeviceJson(`${COMMENT_DEVICE}/list`, params);
  const result = responsePayload(response);
  const comments = result && (result.comments || result.items);
  if (!Array.isArray(comments)) return null;

  return {
    items: comments.map(commentFromHyperbeam),
    page: toNumber(result.page, params.page || 1),
    page_size: toNumber(value(result, 'page-size', 'page_size'), params.page_size || comments.length),
    total_items: toNumber(value(result, 'total-items', 'total_items'), comments.length),
    total_filtered_items: toNumber(value(result, 'total-filtered-items', 'total_filtered_items'), comments.length),
    total_pages: toNumber(value(result, 'total-pages', 'total_pages'), 1),
    has_hidden_comments: Boolean(result['has-hidden-comments']),
  };
}

export async function fetchHyperbeamCommentById(params: CommentByIdParams): Promise<CommentByIdResponse | null> {
  const response = await fetchDeviceJson(`${COMMENT_DEVICE}/by-id`, params);
  const result = responsePayload(response);
  const comment = result && (result.comment || result.item || result.items);
  const item = Array.isArray(comment) ? comment[0] : comment;
  if (!item) return null;

  return {
    item: commentFromHyperbeam(item),
    items: [commentFromHyperbeam(item)],
    ancestors: Array.isArray(result.ancestors) ? result.ancestors.map(commentFromHyperbeam) : [],
  };
}

export async function fetchHyperbeamChannel(claim: Claim | null | undefined): Promise<HyperbeamChannel | null> {
  if (!claim) return null;

  const result = await fetchDeviceJson(`${CHANNEL_DEVICE}/channel`, { channel: claim.signing_channel || claim });
  return result ? channelFromHyperbeam(result) : null;
}

async function fetchDeviceJson(path: string, body: Record<string, any>): Promise<any | null> {
  if (!HYPERBEAM_BASE_URL) return null;

  try {
    const response = await fetch(buildDeviceUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compactParams(body)),
      signal: timeoutSignal(HYPERBEAM_TIMEOUT_MS),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function buildDeviceUrl(path: string): string {
  return `${String(HYPERBEAM_BASE_URL).replace(/\/$/, '')}/${path}`;
}

function compactParams(params: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null));
}

function commentFromHyperbeam(comment: any): any {
  return compactParams({
    ...comment.source,
    comment_id: value(comment, 'comment-id', 'comment_id', 'id'),
    comment: value(comment, 'comment', 'body', 'text'),
    claim_id: value(comment, 'claim-id', 'claim_id'),
    parent_id: value(comment, 'parent-id', 'parent_id'),
    channel_id: value(comment, 'channel-id', 'channel_id'),
    channel_name: value(comment, 'channel-name', 'channel_name'),
    channel_url: value(comment, 'channel-url', 'channel_url'),
    timestamp: value(comment, 'timestamp', 'created_at'),
    updated_at: value(comment, 'updated-at', 'updated_at'),
    signature: value(comment, 'signature'),
    signing_ts: value(comment, 'signing-ts', 'signing_ts'),
    is_pinned: value(comment, 'is-pinned', 'is_pinned'),
    replies: value(comment, 'replies'),
    support_amount: value(comment, 'support-amount', 'support_amount'),
    support_tx_id: value(comment, 'support-tx-id', 'support_tx_id'),
    sticker: value(comment, 'sticker'),
    mentioned_channels: value(comment, 'mentioned-channels', 'mentioned_channels'),
    removed: value(comment, 'removed'),
    hidden: value(comment, 'hidden'),
    blocked: value(comment, 'blocked'),
    hyperbeam_signature_verification: value(comment, 'signature-verification'),
  });
}

function responsePayload(response: any): any {
  if (!response) return null;
  return response.result || response;
}

function channelFromHyperbeam(channel: any): HyperbeamChannel {
  const channelValue = channel.value || {};
  const thumbnail = value(channel, 'thumbnail') || channelValue.thumbnail;

  return compactParams({
    ...channel.source,
    claim_id: value(channel, 'claim-id', 'claim_id'),
    name: value(channel, 'claim-name', 'claim_name', 'name'),
    permanent_url: value(channel, 'permanent-url', 'permanent_url'),
    canonical_url: value(channel, 'canonical-url', 'canonical_url'),
    short_url: value(channel, 'short-url', 'short_url'),
    value: compactParams({
      ...channelValue,
      title: value(channel, 'title') || channelValue.title,
      description: value(channel, 'description') || channelValue.description,
      thumbnail: typeof thumbnail === 'string' ? { url: thumbnail } : thumbnail,
    }),
    hyperbeam_signature_valid: value(channel, 'signature-valid'),
  });
}

function value(source: any, ...keys: string[]): any {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null) return source[key];
  }
}

function toNumber(value: any, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function timeoutSignal(ms: number): AbortSignal | undefined {
  const timeout = typeof AbortSignal !== 'undefined' && (AbortSignal as any).timeout;
  return typeof timeout === 'function' ? timeout(ms) : undefined;
}
