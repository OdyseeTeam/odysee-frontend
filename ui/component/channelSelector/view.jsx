// @flow
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as SETTINGS from 'constants/settings';
import classnames from 'classnames';
import React from 'react';
import ChannelThumbnail from 'component/channelThumbnail';
import { Menu, MenuList, MenuButton, MenuItem } from '@reach/menu-button';
import ChannelTitle from 'component/channelTitle';
import Icon from 'component/common/icon';
import { useHistory } from 'react-router';
import useGetUserMemberships from 'effects/use-get-user-memberships';
import PremiumBadge from 'component/common/premium-badge';

type Props = {
  selectedChannelUrl: string, // currently selected channel
  channels: ?Array<ChannelClaim>,
  onChannelSelect: (url: string) => void,
  hideAnon?: boolean,
  activeChannelClaim: ?ChannelClaim,
  doSetActiveChannel: (claimId: ?string, override?: boolean) => void,
  incognito: boolean,
  doSetIncognito: (boolean) => void,
  claimsByUri: { [string]: any },
  doFetchUserMemberships: (claimIdCsv: string) => void,
  odyseeMembershipByUri: (uri: string) => string,
  storeSelection?: boolean,
  doSetClientSetting: (key: string, value: string, pushPrefs: boolean) => void,
  isHeaderMenu: boolean,
};

export default function ChannelSelector(props: Props) {
  const {
    channels,
    activeChannelClaim,
    doSetActiveChannel,
    incognito,
    doSetIncognito,
    odyseeMembershipByUri,
    claimsByUri,
    doFetchUserMemberships,
    storeSelection,
    doSetClientSetting,
    isHeaderMenu,
  } = props;

  const hideAnon = Boolean(props.hideAnon || storeSelection);

  const {
    push,
    location: { pathname },
  } = useHistory();

  const activeChannelUrl = activeChannelClaim && activeChannelClaim.permanent_url;

  function handleChannelSelect(channelClaim) {
    doSetIncognito(false);
    doSetActiveChannel(channelClaim.claim_id);

    if (storeSelection) {
      doSetClientSetting(SETTINGS.ACTIVE_CHANNEL_CLAIM, channelClaim.claim_id, true);
    }
  }

  return (
    <div className="channel__selector">
      <Menu>
        <MenuButton className={isHeaderMenu ? 'menu__link' : undefined}>
          {isHeaderMenu ? (
            <>
              <ChannelThumbnail uri={activeChannelUrl} hideStakedIndicator xxsmall noLazyLoad />
              {__('Change Default Channel')}
              <Icon icon={ICONS.DOWN} />
            </>
          ) : (incognito && !hideAnon) || !activeChannelUrl ? (
            <IncognitoSelector isSelected />
          ) : (
            <ChannelListItem
              odyseeMembershipByUri={odyseeMembershipByUri}
              uri={activeChannelUrl}
              isSelected
              claimsByUri={claimsByUri}
              doFetchUserMemberships={doFetchUserMemberships}
            />
          )}
        </MenuButton>

        <MenuList className="menu__list channel__list">
          {channels &&
            channels.map((channel) => (
              <MenuItem key={channel.permanent_url} onSelect={() => handleChannelSelect(channel)}>
                <ChannelListItem
                  odyseeMembershipByUri={odyseeMembershipByUri}
                  uri={channel.permanent_url}
                  claimsByUri={claimsByUri}
                  doFetchUserMemberships={doFetchUserMemberships}
                />
              </MenuItem>
            ))}
          {!hideAnon && (
            <MenuItem onSelect={() => doSetIncognito(true)}>
              <IncognitoSelector />
            </MenuItem>
          )}
          <MenuItem onSelect={() => push(`/$/${PAGES.CHANNEL_NEW}?redirect=${pathname}`)}>
            <div className="channel__list-item">
              <Icon sectionIcon icon={ICONS.CHANNEL} />
              <h2 className="channel__list-text">{__('Create a new channel')}</h2>
            </div>
          </MenuItem>
        </MenuList>
      </Menu>
    </div>
  );
}

type ListItemProps = {
  uri: string,
  isSelected?: boolean,
  claimsByUri: { [string]: any },
  doFetchUserMemberships: (claimIdCsv: string) => void,
  odyseeMembershipByUri: (uri: string) => string,
};

function ChannelListItem(props: ListItemProps) {
  const { uri, isSelected = false, claimsByUri, doFetchUserMemberships, odyseeMembershipByUri } = props;

  const membership = odyseeMembershipByUri(uri);

  const shouldFetchUserMemberships = true;
  useGetUserMemberships(shouldFetchUserMemberships, [uri], claimsByUri, doFetchUserMemberships, [uri]);

  return (
    <div className={classnames('channel__list-item', { 'channel__list-item--selected': isSelected })}>
      <ChannelThumbnail uri={uri} hideStakedIndicator xsmall noLazyLoad />
      <ChannelTitle uri={uri} />
      <PremiumBadge membership={membership} />
      {isSelected && <Icon icon={ICONS.DOWN} />}
    </div>
  );
}

type IncognitoSelectorProps = {
  isSelected?: boolean,
};

function IncognitoSelector(props: IncognitoSelectorProps) {
  return (
    <div className={classnames('channel__list-item', { 'channel__list-item--selected': props.isSelected })}>
      <Icon sectionIcon icon={ICONS.ANONYMOUS} />
      <h2 className="channel__list-text">{__('Anonymous')}</h2>
      {props.isSelected && <Icon icon={ICONS.DOWN} />}
    </div>
  );
}
