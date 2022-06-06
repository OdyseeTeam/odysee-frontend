// @flow
import 'scss/component/_header.scss';

import { ENABLE_UI_NOTIFICATIONS } from 'config';
import { useHistory } from 'react-router';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
// import Button from 'component/button';
import { Menu, MenuList, MenuButton } from '@reach/menu-button';
import Icon from 'component/common/icon';
import NotificationBubble from 'component/notificationBubble';
import React from 'react';
import Tooltip from 'component/common/tooltip';
import { formatLbryUrlForWeb } from 'util/url';
import Notification from 'component/notification';

type Props = {
  notifications: Array<Notification>,
  unseenCount: number,
  user: ?User,
  doSeeAllNotifications: () => void,
};

export default function NotificationHeaderButton(props: Props) {
  const { notifications, unseenCount, user, doSeeAllNotifications } = props;
  const list = notifications.slice(0, 5);
  console.log('notifications: ', list);

  const { push } = useHistory();
  const notificationsEnabled = ENABLE_UI_NOTIFICATIONS || (user && user.experimental_ui);

  function handleMenuClick() {
    if (unseenCount > 0) doSeeAllNotifications();
    push(`/$/${PAGES.NOTIFICATIONS}`);
  }

  if (!notificationsEnabled) return null;

  /*
  <Tooltip title={__('Notifications')}>
    <Button onClick={handleMenuClick} className="header__navigationItem--icon">
      <Icon size={18} icon={ICONS.NOTIFICATION} aria-hidden />
      <NotificationBubble />
    </Button>
  </Tooltip>
  */

  function menuEntry(notification) {
    return (
      <>
        <a onClick={() => push(formatLbryUrlForWeb(notification.notification_parameters.device.target))}>
          <div
            className={
              notification.is_read
                ? 'menu__list--notification'
                : 'menu__list--notification menu__list--notification-unread'
            }
            key={notification.id}
          >
            <img
              className={
                notification.is_read
                  ? 'menu__list--notification-channel'
                  : 'menu__list--notification-channel menu__list--notification-channel-unread'
              }
              src={notification.notification_parameters.dynamic.channel_thumbnail}
            />
            <div className="menu__list--notification-info">
              <div className="menu__list--notification-type">{notification.notification_parameters.device.title}</div>
              <div className="menu__list--notification-title">
                {notification.notification_parameters.dynamic.claim_title}
              </div>
            </div>
          </div>
        </a>
      </>
    );
  }

  return (
    <Menu>
      <Tooltip title={__('Notifications')}>
        <MenuButton className="header__navigationItem--icon">
          <Icon size={18} icon={ICONS.NOTIFICATION} aria-hidden />
          <NotificationBubble />
        </MenuButton>
      </Tooltip>

      <MenuList className="menu__list--header menu__list--notifications">
        <div className="menu__list--notifications-header" />
        {list.map((notification) => {
          return menuEntry(notification);
        })}
        <a onClick={handleMenuClick}>
          <div className="menu__list--notifications-more">Show all</div>
        </a>
      </MenuList>
    </Menu>
  );
}
