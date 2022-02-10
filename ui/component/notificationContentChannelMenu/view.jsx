// @flow
import * as ICONS from 'constants/icons';
import React from 'react';
import { MenuItem } from 'component/common/menu-components';
import { parseURI } from 'util/lbryURI';

type Props = {
  uri: string,
  notificationsDisabled: boolean,
  doToast: ({ message: string }) => void,
  doToggleSubscription: (Subscription) => void,
};

export default function NotificationContentChannelMenu(props: Props) {
  const { uri, notificationsDisabled, doToast, doToggleSubscription } = props;
  let claimName;
  const { claimName: name } = parseURI(uri);
  claimName = name || '';
  function handleClick() {
    doToggleSubscription({
      uri,
      channelName: claimName,
      notificationsDisabled: !notificationsDisabled,
    });

    doToast({
      message: !notificationsDisabled
        ? __('Notifications turned off for %channel%.', { channel: claimName })
        : __('Notifications turned on for %channel%.', { channel: claimName }),
    });
  }

  return (
    <MenuItem
      onSelect={handleClick}
      icon={notificationsDisabled ? ICONS.BELL : ICONS.BELL_ON}
      label={notificationsDisabled ? __('Turn Back On') : __('Turn Off')}
    />
  );
}
