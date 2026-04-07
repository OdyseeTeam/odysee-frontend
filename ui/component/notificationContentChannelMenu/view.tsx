import * as ICONS from 'constants/icons';
import React from 'react';
import { MenuItem } from 'component/common/menu';
import { parseURI } from 'util/lbryURI';
import Icon from 'component/common/icon';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doChannelSubscribe as doChannelSubscribeAction } from 'redux/actions/subscriptions';
import { doToast as doToastAction } from 'redux/actions/notifications';
import { makeSelectNotificationsDisabled } from 'redux/selectors/subscriptions';
type Props = {
  uri: string;
};
export default function NotificationContentChannelMenu(props: Props) {
  const { uri } = props;
  const dispatch = useAppDispatch();
  const notificationsDisabled = useAppSelector(makeSelectNotificationsDisabled(uri));
  const doChannelSubscribe = (sub: Subscription) => dispatch(doChannelSubscribeAction(sub));
  const doToast = (params: { message: string }) => dispatch(doToastAction(params));
  let claimName;
  const { claimName: name } = parseURI(uri);
  claimName = name || '';

  function handleClick() {
    doChannelSubscribe({
      uri,
      channelName: claimName,
      notificationsDisabled: !notificationsDisabled,
    });
    doToast({
      message: !notificationsDisabled
        ? __('Notifications turned off for %channel%.', {
            channel: claimName,
          })
        : __('Notifications turned on for %channel%.', {
            channel: claimName,
          }),
    });
  }

  return (
    <MenuItem onSelect={handleClick}>
      <div className="menu__link">
        <Icon aria-hidden icon={notificationsDisabled ? ICONS.BELL : ICONS.BELL_ON} />
        {notificationsDisabled ? __('Turn Back On') : __('Turn Off')}
      </div>
    </MenuItem>
  );
}
