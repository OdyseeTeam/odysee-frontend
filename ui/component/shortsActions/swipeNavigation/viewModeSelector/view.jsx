// @flow
import React from 'react';
import classnames from 'classnames';
import { Menu, MenuButton, MenuList, MenuItem } from '@reach/menu-button';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';

type Props = {
  viewMode: string,
  channelName?: string,
  onViewModeChange: (mode: string) => void,
};

const ViewModeSelector = ({ viewMode, channelName, onViewModeChange }: Props) => {
  return (
    <Menu>
      <MenuButton
        className="shorts-page-menu__button"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Icon size={20} icon={ICONS.MORE} />
      </MenuButton>

      <MenuList className="menu__list shorts-page__view-menu">
        <MenuItem
          className={classnames('comment__menu-option', {
            'comment__menu-option--active': viewMode === 'related',
          })}
          onSelect={() => onViewModeChange('related')}
        >
          <div className="menu__link">{__('Related')}</div>
        </MenuItem>

        <MenuItem
          className={classnames('comment__menu-option', {
            'comment__menu-option--active': viewMode === 'channel',
          })}
          onSelect={() => onViewModeChange('channel')}
        >
          <div className="menu__link">
            {__('From %channel%', {
              channel:
                channelName && channelName.length > 20
                  ? channelName.substring(0, 20) + '...'
                  : channelName || 'Channel',
            })}
          </div>
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default ViewModeSelector;
