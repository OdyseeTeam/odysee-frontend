// @flow
import React from 'react';
import VideoClaimInitiator from 'component/videoClaimInitiator';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import { Menu, MenuButton, MenuList, MenuItem } from '@reach/menu-button';
import Icon from 'component/common/icon';
import classnames from 'classnames';
export const SHORTS_PLAYER_WRAPPER_CLASS = 'shorts-page__video-container';

type Props = {
  uri: string,
  isMobile: boolean,
  sidePanelOpen: boolean,
  onInfoButtonClick: () => void,
  primaryPlayerWrapperClass: string,
  viewMode?: string,
  channelName?: string,
  onViewModeChange?: (mode: string) => void,
  hasChannel?: boolean,
  hasPlaylist?: boolean,
  handleBackButton?: ()=>void;
};

const ShortsVideoPlayer = React.memo<Props>(
  ({
    uri,
    isMobile,
    sidePanelOpen,
    onInfoButtonClick,
    primaryPlayerWrapperClass,
    viewMode = 'related',
    channelName,
    onViewModeChange,
    hasChannel = false,
    hasPlaylist,
    handleBackButton,
  }: Props) => {
    const handleViewModeSelect = (mode: string) => {
      if (onViewModeChange) {
        onViewModeChange(mode);
      }
    };
    return (
      <div className="shorts-page__video-section">
        <Button
          button="close"
          icon={ICONS.BACK}
          className="shorts-page__back-button"
          onClick={handleBackButton}
          aria-label={__('Go back')}
        />
        <div className={`${SHORTS_PLAYER_WRAPPER_CLASS} ${primaryPlayerWrapperClass}`}>
          <VideoClaimInitiator uri={uri} />
        </div>

        {!isMobile && hasChannel && hasPlaylist && (
          <Menu>
            <MenuButton
              className="shorts-page__info-button shorts-page-menu__button"
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
                onSelect={() => handleViewModeSelect('related')}
              >
                <div className="menu__link">
                  <Icon aria-hidden iconColor={viewMode === 'related' ? 'var(--color-primary)' : undefined} />
                  {__('Related')}
                </div>
              </MenuItem>

              <MenuItem
                className={classnames('comment__menu-option', {
                  'comment__menu-option--active': viewMode === 'channel',
                })}
                onSelect={() => handleViewModeSelect('channel')}
              >
                <div className="menu__link">
                  <Icon iconColor={viewMode === 'channel' ? 'var(--color-primary)' : undefined} />
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
        )}

        {!isMobile && (
          <Button
            className="shorts-page__info-button"
            onClick={onInfoButtonClick}
            icon={ICONS.INFO}
            iconSize={20}
            title={sidePanelOpen ? __('Hide Details') : __('Show Details')}
          />
        )}
      </div>
    );
  }
);

export default ShortsVideoPlayer;
