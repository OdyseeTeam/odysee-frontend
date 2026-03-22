import React from 'react';
import Button from 'component/button';
import { useAppSelector } from 'redux/hooks';
import { selectActiveChannelId } from 'redux/selectors/app';
import { selectDefaultChannelId } from 'redux/selectors/settings';

type Props = {
  channelId?: string;
};

const ButtonNavigateChannelId = (props: Props) => {
  const { channelId, ...buttonProps } = props;

  const defaultChannelId = useAppSelector(selectDefaultChannelId);
  const activeChannelId = useAppSelector(selectActiveChannelId);

  const addWindowPendingActiveChannel = () => {
    if (channelId) {
      window.pendingActiveChannel = channelId;
    } else if (defaultChannelId && activeChannelId && defaultChannelId !== activeChannelId) {
      window.pendingActiveChannel = activeChannelId;
    }
  };

  return <Button {...buttonProps} onClick={addWindowPendingActiveChannel} />;
};

export default ButtonNavigateChannelId;
