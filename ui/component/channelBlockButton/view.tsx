import React from "react";
import Button from "component/button";
import { BLOCK_LEVEL } from "constants/comment";
type Props = {
  uri: string;
  blockLevel?: string;
  creatorUri?: string;
  isBlocked: boolean;
  isBlockingOrUnBlocking: boolean;
  isToggling: boolean;
  doCommentModUnBlock: (arg0: string, arg1: boolean) => void;
  doCommentModBlock: (arg0: string, arg1: string | null | undefined, arg2: Number | null | undefined, arg3: boolean) => void;
  doCommentModUnBlockAsAdmin: (arg0: string, arg1: string) => void;
  doCommentModBlockAsAdmin: (arg0: string, arg1: string | null | undefined, arg2: string | null | undefined) => void;
  doCommentModUnBlockAsModerator: (arg0: string, arg1: string, arg2: string) => void;
  doCommentModBlockAsModerator: (arg0: string, arg1: string | null | undefined, arg2: string, arg3: string | null | undefined) => void;
};

function ChannelBlockButton(props: Props) {
  const {
    uri,
    blockLevel,
    creatorUri,
    doCommentModUnBlock,
    doCommentModBlock,
    doCommentModUnBlockAsAdmin,
    doCommentModBlockAsAdmin,
    doCommentModUnBlockAsModerator,
    doCommentModBlockAsModerator,
    isBlocked,
    isBlockingOrUnBlocking,
    isToggling
  } = props;

  function handleClick() {
    switch (blockLevel) {
      default:
      case BLOCK_LEVEL.SELF:
        if (isBlocked) {
          doCommentModUnBlock(uri, false);
        } else {
          doCommentModBlock(uri, undefined, undefined, false);
        }

        break;

      case BLOCK_LEVEL.MODERATOR:
        if (creatorUri) {
          if (isBlocked) {
            doCommentModUnBlockAsModerator(uri, creatorUri, '');
          } else {
            doCommentModBlockAsModerator(uri, undefined, creatorUri, undefined);
          }
        }

        break;

      case BLOCK_LEVEL.ADMIN:
        if (isBlocked) {
          doCommentModUnBlockAsAdmin(uri, '');
        } else {
          doCommentModBlockAsAdmin(uri, undefined, undefined);
        }

        break;
    }
  }

  function getButtonText(blockLevel) {
    switch (blockLevel) {
      default:
      case BLOCK_LEVEL.SELF:
      case BLOCK_LEVEL.ADMIN:
        return isBlocked ? isBlockingOrUnBlocking ? __('Unblocking...') : __('Unblock') : isBlockingOrUnBlocking ? __('Blocking...') : __('Block');

      case BLOCK_LEVEL.MODERATOR:
        if (isToggling) {
          return isBlocked ? __('Unblocking...') : __('Blocking...');
        } else {
          return isBlocked ? __('Unblock') : __('Block');
        }

    }
  }

  return <Button button="alt" label={getButtonText(blockLevel)} onClick={handleClick} />;
}

export default ChannelBlockButton;