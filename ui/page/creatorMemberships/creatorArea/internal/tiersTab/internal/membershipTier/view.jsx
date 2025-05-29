// @flow
import React from 'react';

import { Menu, MenuButton, MenuList, MenuItem } from '@reach/menu-button';

import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';

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
  doMembershipList: (params: MembershipListParams) => Promise<CreatorMemberships>,
  exchangeRate: { ar: number },
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
    doMembershipList,
    exchangeRate,
  } = props;

  return (
    <>
      <div className="membership-tier__header">
        <span className="membership-tier__name">{`${membership.name} ${membership.enabled ? '' : __('(Disabled)')}`}</span>
        {membership.enabled === true && (
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

            <MenuItem
              className="comment__menu-option"
              onSelect={() =>
                hasSubscribers
                  ? doToast({
                      message: __('This membership has active subscribers and cannot be deleted.'),
                      isError: true,
                    })
                  : doOpenModal(MODALS.CONFIRM, {
                      title: __('Confirm Membership Deletion'),
                      subtitle: __('Are you sure you want to delete yor "%membership_name%" membership?', {
                        membership_name: membership.name,
                      }),
                      busyMsg: __('Deleting your membership...'),
                      onConfirm: (closeModal, setIsBusy) => {
                        setIsBusy(true);
                        doDeactivateMembershipForId(membership.membership_id)
                          .then(() => {
                            setIsBusy(false);
                            doToast({ message: __('Your membership was successfully deleted.') });
                            removeMembership();
                            closeModal();
                            doMembershipList({
                              channel_claim_id: membership.channel_claim_id,
                            });
                          })
                          .catch(() => setIsBusy(false));
                      },
                    })
              }
            >
              <div className="menu__link">
                <Icon size={16} icon={ICONS.DELETE} />
                {__('Delete Tier')}
              </div>
            </MenuItem>
          </MenuList>
        </Menu>
          )}
      </div>

      <div className="membership-tier__infos">
        <label>{__('Pledge')}</label>
        <span>${(membership?.prices[0].amount / 100).toFixed(2)} (<Symbol token="ar" amount={(membership?.prices[0].amount / 100).toFixed(2) / exchangeRate.ar} />)</span> {/* the ui basically supports monthly right now */}

        <label>{__('Description ')}</label>
        <span className="membership-tier__description">{membership.description}</span>

        <div className="membership-tier__perks">
          <div className="membership-tier__perks-content">
            <label>{__('Odysee Perks')}</label>
            <ul>
              {membership.perks && membership.perks.map((tierPerk, i) => <li key={i}>{__(tierPerk.description)}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default MembershipTier;
