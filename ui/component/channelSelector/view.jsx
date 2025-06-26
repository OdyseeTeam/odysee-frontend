// @flow
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import classnames from 'classnames';
import React from 'react';
import ChannelThumbnail from 'component/channelThumbnail';
import { Menu, MenuList, MenuButton, MenuItem } from '@reach/menu-button';
import Icon from 'component/common/icon';
import { useHistory } from 'react-router';
import IncognitoSelector from './internal/incognito-selector';
import LoadingSelector from './internal/loading-selector';
import ChannelListItem from './internal/channelListItem';
import { NavLink } from 'react-router-dom';
import { formatLbryUrlForWeb } from 'util/url';
import AllSelector from './internal/all-selector';

type Props = {
  selectedChannelUrl: string, // currently selected channel
  channelIds: ?ClaimIds,
  onChannelSelect?: (id: ?string) => void,
  hideAnon?: boolean,
  activeChannelClaim: ?ChannelClaim,
  doSetActiveChannel: (claimId: ?string, override?: boolean) => void,
  incognito: boolean,
  doSetIncognito: (boolean) => void,
  storeSelection?: boolean,
  doSetDefaultChannel: (claimId: string) => void,
  isHeaderMenu?: boolean,
  isPublishMenu?: boolean,
  isTabHeader?: boolean,
  autoSet?: boolean,
  channelToSet?: string,
  disabled?: boolean,
  allOptionProps?: { onSelectAll: () => void, isSelected: boolean },
  doFetchOdyseeMembershipForChannelIds: (channelIds: ClaimIds) => void,
  hideCreateNew?: boolean,
};

function ChannelSelector(props: Props) {
  const {
    channelIds,
    activeChannelClaim,
    doSetActiveChannel,
    onChannelSelect,
    incognito,
    doSetIncognito,
    storeSelection,
    doSetDefaultChannel,
    isHeaderMenu,
    isPublishMenu,
    isTabHeader,
    autoSet,
    channelToSet,
    disabled,
    allOptionProps,
    doFetchOdyseeMembershipForChannelIds,
    hideCreateNew,
  } = props;

  const hideAnon = Boolean(props.hideAnon || storeSelection);
  const showAllOption = Boolean(allOptionProps && channelIds && channelIds.length > 1);

  const {
    push,
    location: { pathname },
  } = useHistory();

  const activeChannelUrl = activeChannelClaim && activeChannelClaim.permanent_url;
  const activeChannelId = activeChannelClaim && activeChannelClaim.claim_id;
  const noActiveChannel = activeChannelUrl === null;
  const pendingChannelFetch = !noActiveChannel && channelIds === undefined;

  function handleChannelSelect(channelId) {
      doSetIncognito(false);
      doSetActiveChannel(channelId);

      if (storeSelection) {
        doSetDefaultChannel(channelId);
      }
  }

  function handleSelectOption(channelId) {
    if (channelId) {
      handleChannelSelect(channelId);
    } else {
      doSetIncognito(true);
    }

    if (onChannelSelect) onChannelSelect(channelId);
  }

  React.useEffect(() => {
    if (!autoSet) return;

    if (channelToSet) {
      doSetActiveChannel(channelToSet);
      doSetIncognito(false);
    } else if (!channelToSet) {
      doSetIncognito(true);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps -- On mount if we get to autoSet a channel, set it.
  }, []);

  React.useEffect(() => {
    if (channelIds) {
      doFetchOdyseeMembershipForChannelIds(channelIds);
    }
  }, [channelIds, doFetchOdyseeMembershipForChannelIds]);

  return (
    <>
      <div
        className={classnames('channel-selector', {
          'channel-selector--publish': isPublishMenu,
          'channel-selector--tabHeader': isTabHeader,
          disabled: disabled,
        })}
      >
        <Menu>
          {isHeaderMenu && channelIds && channelIds.length > 1 ? (
            <>
              <MenuButton className="menu__link">
                <ChannelThumbnail uri={activeChannelUrl} hideStakedIndicator xxsmall noLazyLoad />
                {__('Change Default Channel')}
                <Icon icon={ICONS.DOWN} />
              </MenuButton>
            </>
          ) : (
            <MenuButton disabled={pendingChannelFetch}>
              {showAllOption && allOptionProps?.isSelected ? (
                <AllSelector isSelected />
              ) : pendingChannelFetch ? (
                <LoadingSelector isSelected />
              ) : (incognito && !hideAnon) || !activeChannelUrl ? (
                <IncognitoSelector isSelected />
              ) : (
                <ChannelListItem channelId={activeChannelId} isSelected />
              )}
            </MenuButton>
          )}

          <MenuList className="menu__list channel-selector">
            {showAllOption && (
              <MenuItem onSelect={allOptionProps?.onSelectAll}>
                <AllSelector />
              </MenuItem>
            )}

            {channelIds &&
              channelIds.map((channelId) => (
                <MenuItem key={channelId} onSelect={() => handleSelectOption(channelId)}>
                  <ChannelListItem channelId={channelId} />
                </MenuItem>
              ))}

            {!hideAnon && (
              <MenuItem onSelect={() => handleSelectOption(null)}>
                <IncognitoSelector />
              </MenuItem>
            )}
            {!hideCreateNew && (
              <MenuItem onSelect={() => push(`/$/${PAGES.CHANNEL_NEW}?redirect=${pathname}`)}>
                <div className="channel-selector__item">
                  <Icon sectionIcon icon={ICONS.CHANNEL} />
                  <div className="channel-selector__text">{__('Create a new channel')}</div>
                </div>
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      </div>
      {isHeaderMenu && activeChannelUrl && (
        <NavLink to={formatLbryUrlForWeb(activeChannelUrl)}>
          <div className="header__navigationItem--channel">
            <span>↳</span>
            {__('My Channel Page')}
          </div>
        </NavLink>
      )}
    </>
  );
}

export default ChannelSelector;
