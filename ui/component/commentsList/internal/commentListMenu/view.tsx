import { Menu, MenuButton, MenuList, MenuItem } from 'component/common/menu';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import React from 'react';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectClaimForUri, selectClaimIsMineForUri } from 'redux/selectors/claims';
import { selectMembersOnlyCommentsForChannelId } from 'redux/selectors/comments';
import {
  selectChannelHasMembershipTiersForId,
  selectCreatorMembershipsFetchedByUri,
} from 'redux/selectors/memberships';
import { getChannelFromClaim } from 'util/claim';
import { doToggleMembersOnlyCommentsSettingForClaimId } from 'redux/actions/comments';
import { doMembershipList } from 'redux/actions/memberships';
import { doToast } from 'redux/actions/notifications';

type Props = {
  uri: string;
};

const CommentListMenu = (props: Props) => {
  const { uri } = props;
  const dispatch = useAppDispatch();

  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const claimId = claim && claim.claim_id;
  const { claim_id: channelId, name: channelName } = getChannelFromClaim(claim) || {};
  const claimIsMine = useAppSelector((state) => selectClaimIsMineForUri(state, uri));
  const channelHasMembershipTiers = useAppSelector((state) =>
    channelId ? selectChannelHasMembershipTiersForId(state, channelId) : false
  );
  const areCommentsMembersOnly = useAppSelector((state) =>
    channelId ? selectMembersOnlyCommentsForChannelId(state, channelId) : false
  );
  const creatorMembershipsFetched = useAppSelector((state) => selectCreatorMembershipsFetchedByUri(state, uri));

  function updateMembersOnlyComments() {
    if (claimId) {
      dispatch(doToggleMembersOnlyCommentsSettingForClaimId(claimId)).then(() =>
        dispatch(
          doToast({
            message: __(
              areCommentsMembersOnly
                ? 'Members-only comments are now disabled.'
                : 'Members-only comments are now enabled.'
            ),
          })
        )
      );
    }
  }

  React.useEffect(() => {
    if (!creatorMembershipsFetched && channelName && channelId) {
      dispatch(
        doMembershipList({
          channel_claim_id: channelId,
        })
      );
    }
  }, [channelId, channelName, creatorMembershipsFetched, dispatch]);

  if (channelHasMembershipTiers && claimIsMine) {
    return (
      <Menu>
        <MenuButton className="button button--alt menu__button">
          <Icon size={18} icon={ICONS.SETTINGS} />
        </MenuButton>

        <MenuList className="menu__list">
          <MenuItem className="comment__menu-option" onSelect={() => updateMembersOnlyComments()}>
            <span className="menu__link">
              <Icon aria-hidden icon={ICONS.MEMBERSHIP} />
              {__(areCommentsMembersOnly ? 'Disable members-only comments' : 'Enable members-only comments')}
            </span>
          </MenuItem>
        </MenuList>
      </Menu>
    );
  }

  return null;
};

export default CommentListMenu;
