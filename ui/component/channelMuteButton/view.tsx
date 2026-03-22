import React from 'react';
import Button from 'component/button';
import { doChannelMute, doChannelUnmute } from 'redux/actions/blocked';
import { makeSelectChannelIsMuted } from 'redux/selectors/blocked';
import { useAppSelector, useAppDispatch } from 'redux/hooks';

type Props = {
  uri: string;
};

function ChannelMuteButton(props: Props) {
  const { uri } = props;

  const dispatch = useAppDispatch();
  const isMuted = useAppSelector((state) => makeSelectChannelIsMuted(uri)(state));

  function handleClick() {
    if (isMuted) {
      dispatch(doChannelUnmute(uri, false));
    } else {
      dispatch(doChannelMute(uri, false));
    }
  }

  return <Button button="alt" label={isMuted ? __('Unhide') : __('Hide')} onClick={handleClick} />;
}

export default ChannelMuteButton;
