// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import useBrowserNotifications from '$web/component/browserNotificationSettings/use-browser-notifications';
import 'scss/component/notifications-banner.scss';
import Icon from 'component/common/icon';
import Button from 'component/button';
import usePersistedState from 'effects/use-persisted-state';

export const BrowserNotificationBanner = () => {
  const { pushInitialized, pushSupported, pushEnabled, pushPermission, pushToggle, pushErrorModal } =
    useBrowserNotifications();
  const [hasAcknowledgedPush, setHasAcknowledgedPush] = usePersistedState('push-nag', false);

  if (!pushInitialized || !pushSupported || pushEnabled || pushPermission === 'denied' || hasAcknowledgedPush) {
    return null;
  }

  const handleClose = () => setHasAcknowledgedPush(true);

  return (
    <>
      <div className="browser-notifications__banner notice-message">
        <div className="browser-notifications__overview">
          <Icon className="browser-notifications__icon" icon={ICONS.NOTIFICATION} size={32} />
          <p>
            <strong>{__('Realtime push notifications straight to your browser.')}</strong>
            <br />
            <span className="notifications-blocked__subText">{__("Don't miss another notification again.")}</span>
          </p>
        </div>
        <div className="browser-notifications__actions">
          <Button
            className="browser-notifications__button"
            button="primary"
            title={__('Enable Push Notifications')}
            label={__('Enable Push Notifications')}
            onClick={pushToggle}
          />
          <Button button="close" title={__('Dismiss')} icon={ICONS.REMOVE} onClick={handleClose} />
        </div>
      </div>
      {pushErrorModal()}
    </>
  );
};

export default BrowserNotificationBanner;
