// @flow
import React from 'react';
import Button from 'component/button';
import { BLOCK_LEVEL } from 'constants/comment';

type Props = {
  uri: string,
  blockLevel?: string,
  creatorUri?: string,
  isBlocked: boolean,
  isBlockingOrUnBlocking: boolean,
  isToggling: boolean,
  doToggleBlockChannel: (string) => void,
  doToggleBlockChannelAsAdmin: (string) => void,
  doToggleBlockChannelAsModerator: (string, ?string, string) => void,
};

function ChannelBlockButton(props: Props) {
  const {
    uri,
    blockLevel,
    creatorUri,
    isBlocked,
    isBlockingOrUnBlocking,
    isToggling,
    doToggleBlockChannel,
    doToggleBlockChannelAsAdmin,
    doToggleBlockChannelAsModerator,
  } = props;

  function handleClick() {
    switch (blockLevel) {
      default:
      case BLOCK_LEVEL.SELF:
        doToggleBlockChannel(uri);
        break;

      case BLOCK_LEVEL.MODERATOR:
        if (creatorUri) {
          doToggleBlockChannelAsModerator(uri, undefined, creatorUri);
        }
        break;

      case BLOCK_LEVEL.ADMIN:
        doToggleBlockChannelAsAdmin(uri);
        break;
    }
  }

  function getButtonText(blockLevel) {
    switch (blockLevel) {
      default:
      case BLOCK_LEVEL.SELF:
      case BLOCK_LEVEL.ADMIN:
        return isBlocked
          ? isBlockingOrUnBlocking
            ? __('Unblocking...')
            : __('Unblock')
          : isBlockingOrUnBlocking
          ? __('Blocking...')
          : __('Block');

      case BLOCK_LEVEL.MODERATOR:
        if (isToggling) {
          return isBlocked ? __('Unblocking...') : __('Blocking...');
        } else {
          return isBlocked ? __('Unblock') : __('Block');
        }
    }
  }

  return <Button button={isBlocked ? 'alt' : 'secondary'} label={getButtonText(blockLevel)} onClick={handleClick} />;
}

export default ChannelBlockButton;
