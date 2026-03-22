import React from 'react';
import Button from 'component/button';
import { BLOCK_LEVEL } from 'constants/comment';
import { selectClaimIdForUri } from 'redux/selectors/claims';
import {
  doCommentModUnBlock,
  doCommentModBlock,
  doCommentModBlockAsAdmin,
  doCommentModUnBlockAsAdmin,
  doCommentModUnBlockAsModerator,
  doCommentModBlockAsModerator,
} from 'redux/actions/comments';
import {
  makeSelectChannelIsBlocked,
  makeSelectChannelIsAdminBlocked,
  makeSelectChannelIsModeratorBlockedForCreator,
  makeSelectUriIsBlockingOrUnBlocking,
  makeSelectIsTogglingForDelegator,
} from 'redux/selectors/comments';
import { useAppSelector, useAppDispatch } from 'redux/hooks';

type Props = {
  uri: string;
  blockLevel?: string;
  creatorUri?: string;
};

function ChannelBlockButton(props: Props) {
  const { uri, blockLevel, creatorUri } = props;

  const dispatch = useAppDispatch();

  const isBlocked = useAppSelector((state) => {
    switch (blockLevel) {
      default:
      case BLOCK_LEVEL.SELF:
        return makeSelectChannelIsBlocked(uri)(state);
      case BLOCK_LEVEL.MODERATOR:
        return makeSelectChannelIsModeratorBlockedForCreator(uri, creatorUri)(state);
      case BLOCK_LEVEL.ADMIN:
        return makeSelectChannelIsAdminBlocked(uri)(state);
    }
  });

  const isToggling = useAppSelector((state) => {
    if (blockLevel === BLOCK_LEVEL.MODERATOR) {
      return makeSelectIsTogglingForDelegator(uri, creatorUri)(state);
    }
    return false;
  });

  const isBlockingOrUnBlocking = useAppSelector((state) => makeSelectUriIsBlockingOrUnBlocking(uri)(state));
  const creatorId = useAppSelector((state) => selectClaimIdForUri(state, creatorUri));

  function handleClick() {
    switch (blockLevel) {
      default:
      case BLOCK_LEVEL.SELF:
        if (isBlocked) {
          dispatch(doCommentModUnBlock(uri, false));
        } else {
          dispatch(doCommentModBlock(uri, undefined, undefined, false));
        }

        break;

      case BLOCK_LEVEL.MODERATOR:
        if (creatorUri) {
          if (isBlocked) {
            dispatch(doCommentModUnBlockAsModerator(uri, creatorUri, ''));
          } else {
            dispatch(doCommentModBlockAsModerator(uri, undefined, creatorUri, undefined));
          }
        }

        break;

      case BLOCK_LEVEL.ADMIN:
        if (isBlocked) {
          dispatch(doCommentModUnBlockAsAdmin(uri, ''));
        } else {
          dispatch(doCommentModBlockAsAdmin(uri, undefined, undefined));
        }

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

  return <Button button="alt" label={getButtonText(blockLevel)} onClick={handleClick} />;
}

export default ChannelBlockButton;
