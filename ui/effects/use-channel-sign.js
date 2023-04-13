// @flow
import React from 'react';
import { toHex } from 'util/hex';

/**
 * Calls the given channelSign() to sign 'data' using the channel ID.
 *
 * @param channelId The channel ID of the signer. Set to null as a way to conditionally disable the hook.
 * @param data The data to sign.
 * @param channelSign Service call to perform the signing.
 * @returns {undefined|false|null|ChannelSignResponse} undefined=pending; false=skipped; null=failed;
 */
export default function useChannelSign(
  channelId: ?string,
  data: string,
  channelSign: ({ channel_id: string, hexdata: string }) => Promise<ChannelSignResponse>
) {
  const [output, setOutput] = React.useState(channelId ? undefined : false);

  React.useEffect(() => {
    if (channelId) {
      channelSign({ channel_id: channelId, hexdata: toHex(data) })
        .then((data: ChannelSignResponse) => setOutput(data))
        .catch(() => setOutput(null));
    }
  }, [channelId, data, channelSign]);

  return output;
}
