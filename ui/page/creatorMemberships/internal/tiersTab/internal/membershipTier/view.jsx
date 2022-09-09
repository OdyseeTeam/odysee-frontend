// @flow
import React from 'react';

import { Menu, MenuButton, MenuList, MenuItem } from '@reach/menu-button';

import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';

import ErrorText from 'component/common/error-text';
import Icon from 'component/common/icon';

type Props = {
  membership: CreatorMembership,
  index: number,
  hasSubscribers: ?boolean,
  addEditingId: () => void,
  removeMembership: () => void,
  // -- redux --
  doOpenModal: (modalId: string, {}) => void,
  doToast: (params: { message: string }) => void,
  doDeactivateMembershipForId: (membershipId: number) => Promise<Membership>,
};

function MembershipTier(props: Props) {
  const {
    membership,
    index,
    hasSubscribers,
    addEditingId,
    removeMembership,
    // -- redux --
    doOpenModal,
    doToast,
    doDeactivateMembershipForId,
  } = props;

  // const membershipId = membership.Membership.id;
  // const isLocalMembership = typeof membershipId === 'string'; // --> local = creating (not called membership_add yet)

  return (
    <>
      <div className="membership-tier__header">
        <span className="membership-tier__name">{membership.Membership.name}</span>

        <Menu>
          <MenuButton className="menu__button">
            <Icon size={18} icon={ICONS.SETTINGS} />
          </MenuButton>

          <MenuList className={'menu__list membership-tier' + String(index + 1)}>
            <MenuItem className="comment__menu-option" onSelect={addEditingId}>
              <div className="menu__link">
                <Icon size={16} icon={ICONS.EDIT} />
                {__('Edit Tier')}
              </div>
            </MenuItem>

            {!hasSubscribers && (
              <MenuItem
                className="comment__menu-option"
                onSelect={() => {
                  doOpenModal(MODALS.CONFIRM, {
                    title: __('Confirm Membership Deletion'),
                    subtitle: __('Are you sure you want to delete yor "%membership_name%" membership?', {
                      membership_name: membership.Membership.name,
                    }),
                    busyMsg: __('Deleting your membership...'),
                    onConfirm: (closeModal, setIsBusy) => {
                      setIsBusy(true);
                      doDeactivateMembershipForId(membership.Membership.id).then(() => {
                        setIsBusy(false);
                        doToast({ message: __('Your membership was successfully deleted.') });
                        removeMembership();
                        closeModal();
                      });
                    },
                  });
                }}
              >
                <div className="menu__link">
                  <Icon size={16} icon={ICONS.DELETE} />
                  {__('Delete Tier')}
                </div>
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      </div>

      <div className="membership-tier__infos">
        <label>{__('Pledge')}</label>
        <span>${membership.NewPrices[0].Price.amount / 100}</span>

        <label>{__('Description & custom Perks')}</label>
        <span>{membership.Membership.description}</span>

        <div className="membership-tier__perks">
          <div className="membership-tier__perks-content">
            <label>{__('Odysee Perks')}</label>
            <ul>
              {membership.Perks && membership.Perks.map((tierPerk, i) => <li key={i}>{tierPerk.description}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {hasSubscribers && <ErrorText>{__('This membership has active subscribers and cannot be deleted.')}</ErrorText>}
    </>
  );
}

export default MembershipTier;
