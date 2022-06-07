// @flow
import 'scss/component/_header.scss';

import { ENABLE_UI_NOTIFICATIONS } from 'config';
import { useHistory } from 'react-router';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
// import Button from 'component/button';
// import { Menu, MenuList, MenuButton } from '@reach/menu-button';
import Icon from 'component/common/icon';
import NotificationBubble from 'component/notificationBubble';
import React from 'react';
import Tooltip from 'component/common/tooltip';
import { formatLbryUrlForWeb } from 'util/url';
import Notification from 'component/notification';
import DateTime from 'component/dateTime';
import ChannelThumbnail from 'component/channelThumbnail';
import { Menu as MuiMenu } from '@mui/material';
import Button from 'component/button';
import ClickAwayListener from '@mui/material/ClickAwayListener';

type Props = {
  notifications: Array<Notification>,
  unseenCount: number,
  user: ?User,
  authenticated: boolean,
  readNotification: (Array<number>) => void,
  seeNotification: (Array<number>) => void,
  doSeeAllNotifications: () => void,
};

export default function NotificationHeaderButton(props: Props) {
  const {
    notifications,
    unseenCount,
    user,
    authenticated,
    readNotification,
    seeNotification,
    doSeeAllNotifications,
  } = props;
  const list = notifications.slice(0, 5);

  const { push } = useHistory();
  const notificationsEnabled = authenticated && (ENABLE_UI_NOTIFICATIONS || (user && user.experimental_ui));

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [clicked, setClicked] = React.useState(false);
  const open = Boolean(anchorEl);
  const handleClick = (event) => setAnchorEl(!anchorEl ? event.currentTarget : null);
  const handleClose = () => setAnchorEl(null);

  const menuProps = {
    id: 'notification-menu',
    anchorEl,
    open,
    onClose: handleClose,
    MenuListProps: {
      'aria-labelledby': 'basic-button',
      sx: { padding: 'var(--spacing-xs)' },
    },
    className: 'menu__list--header menu__list--notifications',
    sx: { 'z-index': 2 },
    PaperProps: { className: 'MuiMenu-list--paper' },
    disableScrollLock: true,
  };

  const handleClickAway = () => {
    if (!clicked) {
      if (open) setClicked(true);
    } else {
      setAnchorEl(null);
      setClicked(false);
    }
  };

  function handleMenuClick() {
    if (unseenCount > 0) doSeeAllNotifications();
    push(`/$/${PAGES.NOTIFICATIONS}`);
  }

  React.useEffect(() => {
    if (!open) setClicked(false);
  }, [open]);

  if (!notificationsEnabled) return null;

  function handleNotificationClick(notification) {
    if (!notification.is_read) {
      seeNotification([notification.id]);
      readNotification([notification.id]);
    }
    let notificationLink = formatLbryUrlForWeb(notification.notification_parameters.device.target);
    if (notification.notification_parameters.dynamic.hash) {
      notificationLink += '?lc=' + notification.notification_parameters.dynamic.hash + '&view=discussion';
    }
    push(notificationLink);
  }

  function menuEntry(notification) {
    let channelIcon = '';
    let type = '';
    let title = '';
    switch (notification.type) {
      case 'new_content':
        channelIcon = notification.notification_parameters.dynamic.channel_thumbnail;
        type = notification.notification_parameters.device.title;
        title = notification.notification_parameters.dynamic.claim_title;
        break;
      case 'comments':
        channelIcon = notification.notification_parameters.dynamic.comment_author_thumbnail;
        type = notification.notification_parameters.device.title;
        title = notification.notification_parameters.device.text;
        break;
    }
    return (
      <>
        <a onClick={() => handleNotificationClick(notification)} title={title}>
          <div
            className={
              notification.is_read
                ? 'menu__list--notification'
                : 'menu__list--notification menu__list--notification-unread'
            }
            key={notification.id}
          >
            <div className="notification__icon">
              <ChannelThumbnail small thumbnailPreview={channelIcon} />
            </div>
            <div className="menu__list--notification-info">
              <div className="menu__list--notification-type">{type}</div>
              <div
                className={
                  notification.type === 'comments'
                    ? 'menu__list--notification-title blockquote'
                    : 'menu__list--notification-title'
                }
              >
                {title}
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
      <>
        <Tooltip title={__('Notifications')}>
          <Button className="header__navigationItem--icon" onClick={handleClick}>
            <Icon size={18} icon={ICONS.NOTIFICATION} aria-hidden />
            <NotificationBubble />
          </Button>
        </Tooltip>

        <ClickAwayListener onClickAway={handleClickAway}>
          <MuiMenu {...menuProps}>
            <div className="menu__list--notifications-header" />
            <div className="menu__list--notifications-list">
              {list.map((notification) => {
                return menuEntry(notification);
              })}
            </div>
            <a onClick={handleMenuClick}>
              <div className="menu__list--notifications-more">{__('View all')}</div>
            </a>
          </MuiMenu>
        </ClickAwayListener>
      </>
    )
  );
}
