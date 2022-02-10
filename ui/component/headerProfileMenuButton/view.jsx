// @flow
import 'scss/component/_header.scss';

import { Menu, MenuList, MenuButton } from '@reach/menu-button';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import ChannelThumbnail from 'component/channelThumbnail';
import classnames from 'classnames';
import { MenuItem, MenuLink } from 'component/common/menu-components';
import Icon from 'component/common/icon';
import React from 'react';
import Skeleton from '@mui/material/Skeleton';

type HeaderMenuButtonProps = {
  activeChannelClaim: ?ChannelClaim,
  authenticated: boolean,
  email: ?string,
  signOut: () => void,
};

export default function HeaderProfileMenuButton(props: HeaderMenuButtonProps) {
  const { activeChannelClaim, authenticated, email, signOut } = props;

  const activeChannelUrl = activeChannelClaim && activeChannelClaim.permanent_url;

  return (
    <div className="header__buttons">
      <Menu>
        {activeChannelUrl === undefined ? (
          <Skeleton variant="circular" animation="wave" className="header__navigationItem--iconSkeleton" />
        ) : (
          <MenuButton
            aria-label={__('Your account')}
            title={__('Your account')}
            className={classnames('header__navigationItem', {
              'header__navigationItem--icon': !activeChannelUrl,
              'header__navigationItem--profilePic': activeChannelUrl,
            })}
          >
            {activeChannelUrl ? (
              <ChannelThumbnail uri={activeChannelUrl} small noLazyLoad />
            ) : (
              <Icon size={18} icon={ICONS.ACCOUNT} aria-hidden />
            )}
          </MenuButton>
        )}

        <MenuList className="menu__list--header">
          {authenticated ? (
            <>
              <MenuLink page={PAGES.UPLOADS} icon={ICONS.PUBLISH} label={__('Uploads')} />
              <MenuLink page={PAGES.CHANNELS} icon={ICONS.CHANNEL} label={__('Channels')} />
              <MenuLink page={PAGES.CREATOR_DASHBOARD} icon={ICONS.ANALYTICS} label={__('Creator Analytics')} />
              <MenuLink page={PAGES.REWARDS} icon={ICONS.REWARDS} label={__('Rewards')} />
              <MenuLink page={PAGES.INVITE} icon={ICONS.INVITE} label={__('Invites')} />

              <MenuItem onSelect={signOut} icon={ICONS.SIGN_OUT} label={__('Sign Out')} help={email} />
            </>
          ) : (
            <>
              <MenuLink page={PAGES.AUTH_SIGNIN} icon={ICONS.SIGN_IN} label={__('Log In')} />
              <MenuLink page={PAGES.AUTH} icon={ICONS.SIGN_UP} label={__('Sign Up')} />
              <MenuLink page={PAGES.SETTINGS} icon={ICONS.SETTINGS} label={__('Settings')} />
              <MenuLink page={PAGES.HELP} icon={ICONS.HELP} label={__('Help')} />
            </>
          )}
        </MenuList>
      </Menu>
    </div>
  );
}
