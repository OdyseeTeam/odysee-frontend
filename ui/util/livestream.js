// @flow
import { LIVESTREAM_KILL } from 'constants/livestream';
import { toHex } from 'util/hex';
import Lbry from 'lbry';
import moment from 'moment';

type StreamData = {
  d: string,
  s: string,
  t: string,
};

export function getTipValues(hyperChatsByAmount: Array<Comment>) {
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

  return { superChatsChannelUrls, superChatsFiatAmount, superChatsLBCAmount };
}

const transformLivestreamClaimData = (data: LivestreamClaimResponse): LivestreamActiveClaim => ({
  uri: data.CanonicalURL,
  claimId: data.ClaimID,
  releaseTime: data.ReleaseTime,
});

export const transformNewLivestreamData = (data: LivestreamAllResponse): LivestreamInfoByCreatorIds =>
  data.reduce((acc, curr) => {
    acc[curr.ChannelClaimID] = {
      type: 'application/x-mpegurl',
      isLive: curr.Live,
      viewCount: curr.ViewerCount,
      creatorId: curr.ChannelClaimID,
      activeClaim: {
        ...transformLivestreamClaimData(curr.ActiveClaim),
        videoUrl: curr.VideoURL,
        startedStreaming: moment(curr.Start),
      },
      ...(curr.PastClaims ? { pastClaims: curr.PastClaims.map(transformLivestreamClaimData) } : {}),
      ...(curr.FutureClaims ? { futureClaims: curr.FutureClaims.map(transformLivestreamClaimData) } : {}),
    };
    return acc;
  }, {});

const getStreamData = async (channelId: string, channelName: string): Promise<StreamData> => {
  if (!channelId || !channelName) throw new Error('Invalid channel data provided.');

  const channelNameHex = toHex(channelName);
  let channelSignature;

  try {
    channelSignature = await Lbry.channel_sign({ channel_id: channelId, hexdata: channelNameHex });
    if (!channelSignature || !channelSignature.signature || !channelSignature.signing_ts) {
      throw new Error('Error getting channel signature.');
    }
  } catch (e) {
    throw e;
  }

  return { d: channelNameHex, s: channelSignature.signature, t: channelSignature.signing_ts };
};

export const killStream = async (channelId: string, channelName: string) => {
  try {
    const streamData = await getStreamData(channelId, channelName);

    const encodedChannelName = encodeURIComponent(channelName);

    const apiData = await fetch(
      `${LIVESTREAM_KILL}channel_claim_id=${channelId}&channel_name=${encodedChannelName}&signature_ts=${streamData.t}&signature=${streamData.s}`
    );

    const data = (await apiData.json()).data;

    if (!data) throw new Error('Kill stream API failed.');
  } catch (e) {
    throw e;
  }
};

export function filterActiveLivestreamUris(
  channelIds: ?Array<string>,
  excludedChannelIds: ?Array<string>,
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

  const sorted: Array<LivestreamActiveClaim> = filtered.sort((a: LivestreamActiveClaim, b: LivestreamActiveClaim) => {
    const [viewCountA, viewCountB] = [viewersById[a.claimId], viewersById[b.claimId]];
    if (viewCountA < viewCountB) return 1;
    if (viewCountA > viewCountB) return -1;
    return 0;
  });

  return sorted.map<string>((activeLivestream: LivestreamActiveClaim) => activeLivestream.uri);
}
