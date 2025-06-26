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
  tipsEnabled: boolean; // type?
}

function MembershipSubscribed(props: IProps) {
  const { uri, tipsEnabled, membershipIndex, membershipSub, doOpenCancelationModalForMembership, doOpenModal } = props;
  if (!membershipSub) {
    return null;
  }

  const styleIndex = membershipIndex + 1;

  const now = new Date();
  const subscriptionEndDate = membershipSub.subscription.ends_at;
  const subscriptionRenewalDate = membershipSub.subscription.earliest_renewal_at;
  const formattedEndOfMembershipDate = formatDateToMonthAndDay(new Date(subscriptionEndDate));
  const formattedRenewalMembershipDate = formatDateToMonthAndDay(new Date(subscriptionRenewalDate));
  const perks = membershipSub.perks;
  const isActive = membershipSub.subscription.is_active === true;
  const isCanceled = membershipSub.subscription.status === 'canceled';
  const pending = membershipSub?.payments.some((p) => p.status === 'submitted');
  console.log('membershipSub', membershipSub);
  const canRenew =
    membershipSub.subscription.earliest_renewal_at &&
    now > new Date(membershipSub.subscription.earliest_renewal_at) &&
    !pending;
  return (
    <>
      <Card
        className="membership membership-tab"
        body={
          <>
            <div className={'membership__body membership-tier' + styleIndex}>
              <div className="membership__plan-header">
                <span>{membershipSub.membership.name}</span>

                {isActive && !isCanceled && (
                  <Menu>
                    <MenuButton className="menu__button">
                      <Icon size={18} icon={ICONS.SETTINGS} />
                    </MenuButton>
                    <MenuList className={'menu__list membership-tier' + styleIndex}>
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
                {isCanceled && (
                  <Menu>
                    <MenuButton className="menu__button">
                      <Icon size={18} icon={ICONS.SETTINGS} />
                    </MenuButton>
                    <MenuList className={'menu__list membership-tier' + styleIndex}>
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
                  {tipsEnabled &&
                    (isActive && !isCanceled ? (
                      canRenew ? (
                        <Button
                          icon={ICONS.MEMBERSHIP}
                          button="primary"
                          label={__('Renew for $%membership_price% this month', {
                            membership_price: (membershipSub.subscription.current_price.amount / 100).toFixed(
                              membershipSub?.subscription.current_price.amount < 100 ? 2 : 0
                            ), // tiers
                          })}
                          onClick={() => {
                            doOpenModal(MODALS.JOIN_MEMBERSHIP, {
                              uri,
                              membershipIndex: membershipIndex,
                              passedTierIndex: membershipIndex,
                              isChannelTab: true,
                              isRenewal: true,
                            });
                          }}
                          disabled={false}
                        />
                      ) : (
                        <label>
                          {pending
                            ? __('Renewal being processed')
                            : __('You can renew this membership on or after %renewal_date%', {
                                renewal_date: formattedRenewalMembershipDate,
                              })}
                        </label>
                      )
                    ) : (
                      <label>
                        {__('Your cancelled membership will end on %end_date%.', {
                          end_date: formattedEndOfMembershipDate,
                        })}
                      </label>
                    ))}
                  {!tipsEnabled && (
                    <div>Enjoy this legacy membership while the creator onboards the new tip system</div>
                  )}
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
