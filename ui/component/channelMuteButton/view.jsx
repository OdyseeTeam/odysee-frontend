// @flow
import React from 'react';
import Button from 'component/button';

type Props = {
  uri: string,
  isMuted: boolean,
  channelClaim: ?ChannelClaim,
  doChannelMute: (string, boolean) => void,
  doChannelUnmute: (string, boolean) => void,
};

function ChannelMuteButton(props: Props) {
  const { uri, doChannelMute, doChannelUnmute, isMuted } = props;

  function handleClick() {
    if (isMuted) {
      doChannelUnmute(uri, false);
    } else {
      doChannelMute(uri, false);
    }
  }

  return <Button button="alt" label={isMuted ? __('Unhide') : __('Hide')} onClick={handleClick} />;
}

export default ChannelMuteButton;
