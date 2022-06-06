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
import DateTime from 'component/dateTime';

type Props = {
  notifications: Array<Notification>,
  unseenCount: number,
  user: ?User,
  authenticated: boolean,
  readNotification: (string) => void,
  doSeeAllNotifications: () => void,
};

export default function NotificationHeaderButton(props: Props) {
  const { notifications, unseenCount, user, authenticated, readNotification, doSeeAllNotifications } = props;
  const list = notifications.slice(0, 5);
  console.log('notifications: ', list);

  const { push } = useHistory();
  const notificationsEnabled = authenticated && (ENABLE_UI_NOTIFICATIONS || (user && user.experimental_ui));

  function handleMenuClick() {
    if (unseenCount > 0) doSeeAllNotifications();
    push(`/$/${PAGES.NOTIFICATIONS}`);
  }

  if (!notificationsEnabled) return null;

  console.log('notificationsEnabled: ', user);

  function handleNotificationClick(notification) {
    if (!notification.is_read) readNotification(notification.id);
    push(formatLbryUrlForWeb(notification.notification_parameters.device.target));
  }

  function menuEntry(notification) {
    return (
      <>
        <a onClick={() => handleNotificationClick(notification)}>
          <div
            className={
              notification.is_read
                ? 'menu__list--notification'
                : 'menu__list--notification menu__list--notification-unread'
            }
            key={notification.id}
          >
            <img
              className="menu__list--notification-channel"
              src={notification.notification_parameters.dynamic.channel_thumbnail}
            />
            <div className="menu__list--notification-info">
              <div className="menu__list--notification-type">{notification.notification_parameters.device.title}</div>
              <div className="menu__list--notification-title">
                {notification.notification_parameters.dynamic.claim_title}
              </div>
              {!notification.is_read && <span>•</span>}
              <DateTime timeAgo date={notification.active_at} />
            </div>
          </div>
        </a>
      </>
    );
  }

  return (
    notificationsEnabled && (
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
    )
  );
}
