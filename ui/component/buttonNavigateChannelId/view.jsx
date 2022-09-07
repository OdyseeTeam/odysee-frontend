// @flow
import React from 'react';
import Button from 'component/button';

type Props = {
  channelId?: string,
  // -- redux --
  defaultChannelId: ?string,
  activeChannelId: ?string,
};

const ButtonNavigateChannelId = (props: Props) => {
  const { channelId, defaultChannelId, activeChannelId, ...buttonProps } = props;

  return (
    <Button
      {...buttonProps}
      onClick={() => {
        if (channelId) {
          window.pendingActiveChannel = channelId;
        } else if (defaultChannelId && activeChannelId && defaultChannelId !== activeChannelId) {
          window.pendingActiveChannel = activeChannelId;
        }
      }}
    />
  );
};

export default ButtonNavigateChannelId;
