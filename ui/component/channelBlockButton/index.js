import { connect } from 'react-redux';
import { selectClaimIdForUri } from 'redux/selectors/claims';
import {
  doToggleBlockChannel,
  doToggleBlockChannelAsAdmin,
  doToggleBlockChannelAsModerator,
} from 'redux/actions/comments';
import {
  selectChannelIsBlocked,
  selectChannelIsAdminBlocked,
  makeSelectChannelIsModeratorBlockedForCreator,
  makeSelectUriIsBlockingOrUnBlocking,
  makeSelectIsTogglingForDelegator,
} from 'redux/selectors/comments';

import { BLOCK_LEVEL } from 'constants/comment';
import ChannelBlockButton from './view';

const select = (state, props) => {
  let isBlocked;
  let isToggling;

  switch (props.blockLevel) {
    default:
    case BLOCK_LEVEL.SELF:
      isBlocked = selectChannelIsBlocked(state, props.uri);
      break;

    case BLOCK_LEVEL.MODERATOR:
      isBlocked = makeSelectChannelIsModeratorBlockedForCreator(props.uri, props.creatorUri)(state);
      isToggling = makeSelectIsTogglingForDelegator(props.uri, props.creatorUri)(state);
      break;

    case BLOCK_LEVEL.ADMIN:
      isBlocked = selectChannelIsAdminBlocked(state, props.uri);
      break;
  }

  return {
    isBlocked,
    isToggling,
    isBlockingOrUnBlocking: makeSelectUriIsBlockingOrUnBlocking(props.uri)(state),
    creatorId: selectClaimIdForUri(state, props.creatorUri),
  };
};

const perform = {
  doToggleBlockChannel,
  doToggleBlockChannelAsAdmin,
  doToggleBlockChannelAsModerator,
};

export default connect(select, perform)(ChannelBlockButton);
