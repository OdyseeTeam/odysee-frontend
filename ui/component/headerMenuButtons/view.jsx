// @flow
import 'scss/component/_header.scss';

import { ENABLE_UI_NOTIFICATIONS, ENABLE_NO_SOURCE_CLAIMS, CHANNEL_STAKED_LEVEL_LIVESTREAM } from 'config';
import { Menu, MenuList, MenuButton } from '@reach/menu-button';
import { MenuItem, MenuLink } from 'component/common/menu-components';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Icon from 'component/common/icon';
import NotificationHeaderButton from 'component/headerNotificationButton';
import React from 'react';
import Tooltip from 'component/common/tooltip';

type HeaderMenuButtonProps = {
  activeChannelStakedLevel: number,
  authenticated: boolean,
  automaticDarkModeEnabled: boolean,
  currentTheme: string,
  user: ?User,
  handleThemeToggle: (boolean, string) => void,
};

export default function HeaderMenuButtons(props: HeaderMenuButtonProps) {
  const {
    authenticated,
    automaticDarkModeEnabled,
    currentTheme,
    activeChannelStakedLevel,
    user,
    handleThemeToggle,
  } = props;

  const notificationsEnabled = ENABLE_UI_NOTIFICATIONS || (user && user.experimental_ui);
  const livestreamEnabled = Boolean(
    ENABLE_NO_SOURCE_CLAIMS &&
      user &&
      !user.odysee_live_disabled &&
      (activeChannelStakedLevel >= CHANNEL_STAKED_LEVEL_LIVESTREAM || user.odysee_live_enabled)
  );

  return (
    <div className="header__buttons">
      {authenticated && (
        <Menu>
          <Tooltip title={__('Publish a file, or create a channel')}>
            <MenuButton className="header__navigationItem--icon">
              <Icon size={18} icon={ICONS.PUBLISH} aria-hidden />
            </MenuButton>
          </Tooltip>

          <MenuList className="menu__list--header">
            <MenuLink page={PAGES.UPLOAD} icon={ICONS.PUBLISH} label={__('Upload')} />
            <MenuLink page={PAGES.CHANNEL_NEW} icon={ICONS.CHANNEL} label={__('New Channel')} />
            <MenuLink page={PAGES.YOUTUBE_SYNC} icon={ICONS.YOUTUBE} label={__('Sync YouTube Channel')} />
            {livestreamEnabled && <MenuLink page={PAGES.LIVESTREAM} icon={ICONS.VIDEO} label={__('Go Live')} />}
          </MenuList>
        </Menu>
      )}

      {notificationsEnabled && <NotificationHeaderButton />}

      <Menu>
        <Tooltip title={__('Settings')}>
          <MenuButton className="header__navigationItem--icon">
            <Icon size={18} icon={ICONS.SETTINGS} aria-hidden />
          </MenuButton>
        </Tooltip>

        <MenuList className="menu__list--header">
          <MenuLink page={PAGES.SETTINGS} icon={ICONS.SETTINGS} label={__('Settings')} />
          <MenuLink page={PAGES.HELP} icon={ICONS.HELP} label={__('Help')} />

          <MenuItem
            onSelect={() => handleThemeToggle(automaticDarkModeEnabled, currentTheme)}
            icon={currentTheme === 'light' ? ICONS.DARK : ICONS.LIGHT}
            label={currentTheme === 'light' ? __('Dark') : __('Light')}
          />
        </MenuList>
      </Menu>
    </div>
  );
}
