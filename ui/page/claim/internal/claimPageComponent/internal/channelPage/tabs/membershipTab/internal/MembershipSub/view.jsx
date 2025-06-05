// @flow
import React from 'react';
import { Menu, MenuButton, MenuItem, MenuList } from '@reach/menu-button';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import Card from 'component/common/card';
import Button from 'component/button';
import { formatDateToMonthAndDay } from 'util/time';
import * as MODALS from 'constants/modal_types';
interface IProps {
  uri: string;
  membershipSub: MembershipSub;
  membershipIndex: number;
  doOpenModal: () => void;
  doOpenCancelationModalForMembership: (MembershipSub) => void;
}

function MembershipSubscribed(props: IProps) {
  const { uri, membershipIndex, membershipSub, doOpenCancelationModalForMembership, doOpenModal } = props;
  if (!membershipSub) {
    return null;
  }

  const now = new Date();
  const subscriptionEndDate = membershipSub.subscription.ends_at;
  const formattedEndOfMembershipDate = formatDateToMonthAndDay(new Date(subscriptionEndDate));
  const perks = membershipSub.perks;
  const isActive = membershipSub.subscription.status === 'active';
  const canRenew = now > new Date(membershipSub.subscription.earliest_renewal_at);
  return (
    <>
      <Card
        className="membership membership-tab"
        body={
          <>
            <div className={'membership__body membership-tier' + membershipIndex}>
              <div className="membership__plan-header">
                <span>{membershipSub.membership.name}</span>

                {isActive && (
                  <Menu>
                    <MenuButton className="menu__button">
                      <Icon size={18} icon={ICONS.SETTINGS} />
                    </MenuButton>
                    <MenuList className={'menu__list membership-tier' + membershipIndex}>
                      <MenuItem
                        className="comment__menu-option"
                        onSelect={() => doOpenCancelationModalForMembership(membershipSub)}
                      >
                        <div className="menu__link">
                          <Icon size={16} icon={ICONS.DELETE} /> {__('Cancel Membership')}
                        </div>
                      </MenuItem>
                    </MenuList>
                  </Menu>
                )}
                {!isActive && (
                  <Menu>
                    <MenuButton className="menu__button">
                      <Icon size={18} icon={ICONS.SETTINGS} />
                    </MenuButton>
                    <MenuList className={'menu__list membership-tier' + membershipIndex}>
                      <MenuItem
                        className="comment__menu-option"
                        onSelect={() => doOpenCancelationModalForMembership(membershipSub)}
                      >
                        <div className="menu__link">
                          <Icon size={16} icon={ICONS.REFRESH} /> {__('Restore Membership')}
                        </div>
                      </MenuItem>
                    </MenuList>
                  </Menu>
                  )}
              </div>

              <div className="membership__plan-content">
                <div>
                  <label>{__('Creator revenue')}</label>
                  <span>${(membershipSub.subscription.current_price.amount / 100).toFixed(2)}</span>

                  <label>{__('Total Monthly Cost')}</label>
                  <span>{`$${(membershipSub.subscription.current_price.amount / 100).toFixed(2)}`}</span>

                  <label>{__('Description')}</label>
                  <span>{membershipSub.membership.description}</span>
                </div>

                {perks && (
                  <div className="membership-tier__perks">
                    <label>{__('Odysee Perks')}</label>

                    <ul>
                      {perks.map((tierPerk, i) => (
                        <li key={i} className="membership__perk-item">
                          {__(tierPerk.name)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="membership__plan-actions">


                    {isActive
                      ? canRenew
                        ? (<Button
                            icon={ICONS.MEMBERSHIP}
                            button="primary"
                            label={__('Renew for $%membership_price% this month', {
                              membership_price: (membershipSub.subscription.current_price.amount / 100).toFixed(
                                membershipSub?.subscription.current_price.amount < 100 ? 2 : 0
                              ), // tiers
                            })}
                            onClick={() => {
                              doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri, membershipIndex: membershipIndex, passedTierIndex: membershipIndex, isChannelTab: true, isRenewal: true });
                            }}
                            disabled={false}
                        />)
                        : <label>{__('You can renew this membership on or after %renewal_date%', {
                          renewal_date: formattedEndOfMembershipDate,
                        })}</label>
                      : <label>{__('Your cancelled membership will end on %end_date%.', {
                        end_date: formattedEndOfMembershipDate,
                      })}</label>}
                </div>
              </div>
            </div>
          </>
        }
      />
    </>
  );
}

export default MembershipSubscribed;
