// @flow

import { LIVESTREAM_LIVE_API, LIVESTREAM_KILL } from 'constants/livestream';
import { toHex } from 'util/hex';
import Lbry from 'lbry';
import moment from 'moment';

export const LiveStatus = Object.freeze({
  LIVE: 'LIVE',
  NOT_LIVE: 'NOT_LIVE',
  UNKNOWN: 'UNKNOWN',
});

type LiveStatusType = $Keys<typeof LiveStatus>;

type LiveChannelStatus = {
  channelStatus: LiveStatusType,
  channelData?: LivestreamInfo,
};

type StreamData = {
  d: string,
  s: string,
  t: string,
};

const transformLivestreamData = (data: Array<any>): LivestreamInfo => {
  return data.reduce((acc, curr) => {
    acc[curr.claimId] = {
      url: curr.url,
      type: curr.type,
      live: curr.live,
      viewCount: curr.viewCount,
      creatorId: curr.claimId,
      startedStreaming: moment(curr.timestamp),
    };
    return acc;
  }, {});
};

export const fetchLiveChannels = async (): Promise<LivestreamInfo> => {
  const response = await fetch(LIVESTREAM_LIVE_API);
  const json = await response.json();
  if (!json.data) throw new Error();
  return transformLivestreamData(json.data);
};

/**
 * Check whether or not the channel is used, used for long polling to display live status on claim viewing page
 * @param channelId
 * @returns {Promise<{channelStatus: string}|{channelData: LivestreamInfo, channelStatus: string}>}
 */
export const fetchLiveChannel = async (channelId: string): Promise<LiveChannelStatus> => {
  const newApiEndpoint = LIVESTREAM_LIVE_API;
  const newApiResponse = await fetch(`${newApiEndpoint}/${channelId}`);
  const newApiData = (await newApiResponse.json()).data;
  const isLive = newApiData.live;

  // transform data to old API standard
  const translatedData = {
    url: newApiData.url,
    type: 'application/x-mpegurl',
    viewCount: newApiData.viewCount,
    claimId: newApiData.claimId,
    timestamp: newApiData.timestamp,
  };

  try {
    if (isLive === false) {
      return { channelStatus: LiveStatus.NOT_LIVE };
    }
    return { channelStatus: LiveStatus.LIVE, channelData: transformLivestreamData([translatedData]) };
  } catch {
    return { channelStatus: LiveStatus.UNKNOWN };
  }
};

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

    fetch(`${LIVESTREAM_KILL}/${channelId}`, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(streamData),
    }).then((res) => {
      if (res.status !== 200) throw new Error('Kill stream API failed.');
    });
  } catch (e) {
    throw e;
  }
};
