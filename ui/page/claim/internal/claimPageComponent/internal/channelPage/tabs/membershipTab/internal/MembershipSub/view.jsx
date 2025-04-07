// @flow
import React from 'react';
import { Menu, MenuButton, MenuItem, MenuList } from '@reach/menu-button';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import Card from 'component/common/card';
import { formatDateToMonthAndDay } from 'util/time';
interface IProps {
  uri: string;
  membershipSub: MembershipSub;
  membershipIndex: number;
}

function MembershipSubscribed(props: IProps) {
  const { membershipIndex, membershipSub, doOpenCancelationModalForMembership } = props;
  if (!membershipSub) {
    return null;
  }
  const subscriptionEndDate = membershipSub.subscription.ends_at;
  const formattedEndOfMembershipDate = formatDateToMonthAndDay(new Date(subscriptionEndDate));
  const perks = membershipSub.perks;
  const isActive = membershipSub.subscription.status === 'active';
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
              </div>

              <div className="membership__plan-content">
                <div>
                  <label>{__('Creator revenue')}</label>
                  <span>${(membershipSub.current_price.amount / 100).toFixed(2)}</span>

                  <label>{__('Total Monthly Cost')}</label>
                  <span>{`$${(membershipSub.current_price.amount / 100).toFixed(2)}`}</span>

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
                  <label>
                    {isActive
                      ? __('This membership will renew on %renewal_date%', {
                          renewal_date: formattedEndOfMembershipDate,
                        })
                      : __('Your cancelled membership will end on %end_date%', {
                          end_date: formattedEndOfMembershipDate,
                        })}
                  </label>
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
