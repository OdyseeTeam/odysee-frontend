// @flow
import React from 'react';
import Button from 'component/button';

type Props = {
  uri: string,
  isMuted: boolean,
  doToggleMuteChannel: (uri: string) => void,
};

function ChannelMuteButton(props: Props) {
  const { uri, isMuted, doToggleMuteChannel } = props;

  return (
    <Button
      button={isMuted ? 'alt' : 'secondary'}
      label={isMuted ? __('Unmute') : __('Mute')}
      onClick={() => doToggleMuteChannel(uri)}
    />
  );
}

export default ChannelMuteButton;
