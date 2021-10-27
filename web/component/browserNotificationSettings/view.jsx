// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import SettingsRow from 'component/settingsRow';
import { FormField } from 'component/common/form';
import useBrowserNotifications from '$web/component/browserNotificationSettings/use-browser-notifications';
import 'scss/component/notifications-blocked.scss';
import Icon from 'component/common/icon';

type Props = {
  title: string,
  children: React.Node,
};

const InlineMessage = (props: Props) => {
  const { title, children } = props;
  return (
    <div className="notificationsBlocked">
      <Icon className="notificationsBlocked__icon" color="#E50054" icon={ICONS.ALERT} size={32} />
      <div>
        <span>{title}</span>
        <span className={'notificationsBlocked__subText'}>{children}</span>
      </div>
    </div>
  );
};

const BrowserNotificationsBlocked = () => {
  return (
    <InlineMessage title={__('Heads up: browser notifications are currently blocked in this browser.')}>
      {__('To enable push notifications please configure your browser to allow notifications on odysee.com.')}
    </InlineMessage>
  );
};

const BrowserNotificationHints = () => {
  return (
    <InlineMessage title={__("We weren't able to subscribe you to notifications. Here are a few tips:")}>
      <ul className={'notificationsBlocked__subText notificationsBlocked__subTextList'}>
        <li>
          {__(
            "On Firefox, notifications won't function if cookies are set to clear on browser close. Please disable or add an exception for Odysee, then refresh."
          )}
        </li>
        <li>{__('For Brave, enable google push notifications in settings.')}</li>
        <li>{__('Check browser settings to see if notifications are disabled or otherwise restricted.')}</li>
      </ul>
    </InlineMessage>
  );
};

const BrowserNotificationSettings = () => {
  const { pushSupported, pushEnabled, pushPermission, pushToggle, encounteredError } = useBrowserNotifications();

  if (!pushSupported) return null;
  if (pushPermission === 'denied') return <BrowserNotificationsBlocked />;

  const renderHints = () => (encounteredError ? <BrowserNotificationHints /> : null);

  return (
    <>
      <SettingsRow
        title={__('Browser Notifications')}
        subtitle={__("Receive push notifications in this browser, even when you're not on odysee.com")}
      >
        <FormField type="checkbox" name="browserNotification" onChange={pushToggle} checked={pushEnabled} />
      </SettingsRow>
      {renderHints()}
    </>
  );
};

export default BrowserNotificationSettings;
