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

export const transformNewLivestreamData = (data: LivestreamAllResponse): ActiveLivestreamByCreatorIds =>
  data.reduce((acc, curr) => {
    acc[curr.ChannelClaimID] = {
      url: curr.VideoURL,
      type: 'application/x-mpegurl',
      live: curr.Live,
      viewCount: curr.ViewerCount,
      creatorId: curr.ChannelClaimID,
      startedStreaming: moment(curr.Start),
      ...(curr.ActiveClaim ? { claimId: curr.ActiveClaim.ClaimID, claimUri: curr.ActiveClaim.CanonicalURL } : {}),
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
