import { LIVESTREAM_KILL } from 'constants/livestream';
import { toHex } from 'util/hex';
import Lbry from 'lbry';
import dayjs from 'util/dayjs';
type StreamData = {
  d: string;
  s: string;
  t: string;
};
export function getTipValues(
  hyperChatsByAmount: Array<{ is_fiat?: boolean; support_amount?: number; channel_url?: string; [key: string]: any }>
) {
  let superChatsChannelUrls = [];
  let superChatsFiatAmount = 0;
  let superChatsLBCAmount = 0;

  if (hyperChatsByAmount) {
    hyperChatsByAmount.forEach((hyperChat) => {
      const { is_fiat: isFiat, support_amount: tipAmount, channel_url: uri } = hyperChat;

      if (isFiat) {
        superChatsFiatAmount = superChatsFiatAmount + tipAmount;
      } else {
        superChatsLBCAmount = superChatsLBCAmount + tipAmount;
      }

      superChatsChannelUrls.push(uri || '0');
    });
  }

  return {
    superChatsChannelUrls,
    superChatsFiatAmount,
    superChatsLBCAmount,
  };
}

const transformLivestreamClaimData = (data: any): LivestreamActiveClaim => ({
  uri: data?.CanonicalURL || data?.uri || '',
  claimUri: data?.CanonicalURL || data?.uri || '',
  claimId: data?.ClaimID || data?.claimId || '',
  releaseTime: data?.ReleaseTime || data?.releaseTime,
});

const getPreferredLivestreamVideoUrl = (livestream: any) => livestream.VideoURL || livestream.VideoURLLLHLS;

function normalizeLivestreamEntry(entry: any): any {
  const raw = entry?.data && !entry?.ChannelClaimID ? entry.data : entry;
  if (!raw) return raw;

  const channelClaimId = raw.ChannelClaimID || raw.channel_claim_id || raw.ChannelClaimId;
  const activeClaim = raw.ActiveClaim || raw.activeClaim || null;

  return {
    ...raw,
    ChannelClaimID: channelClaimId,
    Live: raw.Live ?? raw.live ?? false,
    ViewerCount: raw.ViewerCount ?? raw.viewCount ?? 0,
    ThumbnailURL: raw.ThumbnailURL ?? raw.thumbnailUrl ?? null,
    Start: raw.Start ?? raw.start ?? null,
    VideoURL: raw.VideoURL ?? raw.videoUrl ?? null,
    VideoURLLLHLS: raw.VideoURLLLHLS ?? raw.videoUrlLLHLS ?? null,
    VideoURLWebRTC: raw.VideoURLWebRTC ?? raw.videoUrlWebRTC ?? null,
    P2PTrackerURL: raw.P2PTrackerURL ?? raw.p2pTrackerUrl ?? null,
    P2PSwarmID: raw.P2PSwarmID ?? raw.p2pSwarmId ?? null,
    ActiveClaim: activeClaim,
  };
}

export const transformNewLivestreamData = (data: Array<any>): LivestreamInfoByCreatorIds =>
  data.reduce((acc: Record<string, any>, curr: any) => {
    const normalized = normalizeLivestreamEntry(curr);
    if (!normalized?.ChannelClaimID) return acc;

    const activeClaim = normalized.ActiveClaim
      ? {
          ...transformLivestreamClaimData(normalized.ActiveClaim),
          videoUrl: getPreferredLivestreamVideoUrl(normalized),
          videoUrlPublic: normalized.VideoURL || null,
          p2pTrackerUrl: normalized.P2PTrackerURL || null,
          p2pSwarmId: normalized.P2PSwarmID || null,
          startedStreaming: dayjs(normalized.Start),
        }
      : {
          uri: '',
          claimUri: '',
          claimId: '',
          videoUrl: getPreferredLivestreamVideoUrl(normalized),
          videoUrlPublic: normalized.VideoURL || null,
          p2pTrackerUrl: normalized.P2PTrackerURL || null,
          p2pSwarmId: normalized.P2PSwarmID || null,
          startedStreaming: dayjs(normalized.Start),
        };

    acc[normalized.ChannelClaimID] = {
      type: 'application/x-mpegurl',
      isLive: normalized.Live,
      viewCount: normalized.ViewerCount,
      creatorId: normalized.ChannelClaimID,
      thumbnailUrl: normalized.ThumbnailURL || null,
      activeClaim,
      ...(normalized.PastClaims
        ? {
            pastClaims: normalized.PastClaims.map(transformLivestreamClaimData),
          }
        : {}),
      ...(normalized.FutureClaims
        ? {
            futureClaims: normalized.FutureClaims.map(transformLivestreamClaimData),
          }
        : {}),
    };
    return acc;
  }, {});

const getStreamData = async (channelId: string, channelName: string): Promise<StreamData> => {
  if (!channelId || !channelName) throw new Error('Invalid channel data provided.');
  const channelNameHex = toHex(channelName);
  let channelSignature;

  channelSignature = await Lbry.channel_sign({
    channel_id: channelId,
    hexdata: channelNameHex,
  });

  if (!channelSignature || !channelSignature.signature || !channelSignature.signing_ts) {
    throw new Error('Error getting channel signature.');
  }

  return {
    d: channelNameHex,
    s: channelSignature.signature,
    t: channelSignature.signing_ts,
  };
};

export const killStream = async (channelId: string, channelName: string) => {
  const streamData = await getStreamData(channelId, channelName);
  const encodedChannelName = encodeURIComponent(channelName);
  const apiData = await fetch(
    `${LIVESTREAM_KILL}channel_claim_id=${channelId}&channel_name=${encodedChannelName}&signature_ts=${streamData.t}&signature=${streamData.s}`
  );
  const data = (await apiData.json()).data;
  if (!data) throw new Error('Kill stream API failed.');
};
export function filterActiveLivestreamUris(
  channelIds: Array<string> | null | undefined,
  excludedChannelIds: Array<string> | null | undefined,
  activeLivestreamByCreatorId: LivestreamByCreatorId,
  viewersById: LivestreamViewersById
) {
  if (!activeLivestreamByCreatorId) {
    return undefined;
  }

  const filtered: Array<LivestreamActiveClaim> = [];

  for (const creatorId in activeLivestreamByCreatorId) {
    const activeLivestream = activeLivestreamByCreatorId[creatorId];

    if (activeLivestream) {
      const shouldInclude =
        (!channelIds || channelIds.includes(creatorId)) &&
        (!excludedChannelIds || !excludedChannelIds.includes(creatorId));

      if (shouldInclude) {
        filtered.push(activeLivestream);
      }
    }
  }

  const sorted: Array<LivestreamActiveClaim> = [...filtered].toSorted(
    (a: LivestreamActiveClaim, b: LivestreamActiveClaim) => {
      const [viewCountA, viewCountB] = [viewersById[a.claimId], viewersById[b.claimId]];
      if (viewCountA < viewCountB) return 1;
      if (viewCountA > viewCountB) return -1;
      return 0;
    }
  );
  return sorted.map<string>((activeLivestream: LivestreamActiveClaim) => activeLivestream.uri);
}
