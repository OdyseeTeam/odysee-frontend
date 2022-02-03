// @flow
import 'scss/component/_header.scss';

import { ENABLE_UI_NOTIFICATIONS, ENABLE_NO_SOURCE_CLAIMS, CHANNEL_STAKED_LEVEL_LIVESTREAM } from 'config';
import { Menu, MenuList, MenuButton, MenuItem } from '@reach/menu-button';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as MODALS from 'constants/modal_types';
import HeaderMenuLink from 'component/common/header-menu-link';
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
  doOpenModal: (id, params) => void,
};

export default function HeaderMenuButtons(props: HeaderMenuButtonProps) {
  const {
    authenticated,
    automaticDarkModeEnabled,
    currentTheme,
    activeChannelStakedLevel,
    user,
    handleThemeToggle,
    doOpenModal,
    odyseeMembership,
  } = props;

  const isOnMembershipPage = window.location.pathname === '/$/membership';

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
            <HeaderMenuLink page={PAGES.UPLOAD} icon={ICONS.PUBLISH} name={__('Upload')} />
            <HeaderMenuLink page={PAGES.CHANNEL_NEW} icon={ICONS.CHANNEL} name={__('New Channel')} />
            <HeaderMenuLink page={PAGES.YOUTUBE_SYNC} icon={ICONS.YOUTUBE} name={__('Sync YouTube Channel')} />
            {livestreamEnabled && <HeaderMenuLink page={PAGES.LIVESTREAM} icon={ICONS.VIDEO} name={__('Go Live')} />}
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
          <HeaderMenuLink page={PAGES.SETTINGS} icon={ICONS.SETTINGS} name={__('Settings')} />
          <HeaderMenuLink page={PAGES.HELP} icon={ICONS.HELP} name={__('Help')} />

          {/* don't show upgrade button if on membership page or already have a membership */}
          {!isOnMembershipPage && !odyseeMembership && (
            <MenuItem onSelect={() => doOpenModal(MODALS.MEMBERSHIP_SPLASH, {})}>
              <div className="menu__link">
                <Icon aria-hidden icon={ICONS.UPGRADE} />
                {__('Upgrade')}
              </div>
            </MenuItem>
          )}

          <MenuItem className="menu__link" onSelect={() => handleThemeToggle(automaticDarkModeEnabled, currentTheme)}>
            <Icon icon={currentTheme === 'light' ? ICONS.DARK : ICONS.LIGHT} />
            {currentTheme === 'light' ? __('Dark') : __('Light')}
          </MenuItem>
        </MenuList>
      </Menu>
    </div>
  );
}
