// @flow
import React from 'react';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';
import SettingsRow from 'component/settingsRow';
import ChannelSelector from 'component/channelSelector';

type Props = {
  // --- select ---
  notificationSettings: ?NotificationSettings,
  // --- perform ---
  doFetchNotificationSettings: () => void,
  doToggleNotificationsDisabled: () => void,
  doToggleFollowerNotifications: () => void,
  doToggleFollowedNotifications: () => void,
};

export default function SettingNotifications(props: Props) {
  const {
    notificationSettings,
    doFetchNotificationSettings,
    doToggleNotificationsDisabled,
    doToggleFollowerNotifications,
    doToggleFollowedNotifications,
  } = props;

  const { disabled, mention } = notificationSettings || {};
  const { all: notificationsDisabled } = disabled || {};
  const { from_followed: followedMentionsEnabled, from_followers: followerMentionsEnabled } = mention || {};

  React.useEffect(() => {
    if (doFetchNotificationSettings && !notificationSettings) doFetchNotificationSettings();
  }, [doFetchNotificationSettings, notificationSettings]);

  return (
    <>
      <ChannelSelector hideAnon />

      <Card
        isBodyList
        body={
          <>
            <SettingsRow title={__('Disable All')}>
              <FormField
                type="checkbox"
                name="notifications_disable"
                checked={notificationsDisabled}
                onChange={doToggleNotificationsDisabled}
              />
            </SettingsRow>

            <SettingsRow title={__('Mention Notifications')} multirow disabled={notificationsDisabled}>
              <FormField
                type="checkbox"
                name="mention_followed"
                checked={followedMentionsEnabled}
                label={__('From Followers')}
                onChange={doToggleFollowerNotifications}
              />
              <FormField
                type="checkbox"
                name="mention_follower"
                checked={followerMentionsEnabled}
                label={__('From Followed')}
                onChange={doToggleFollowedNotifications}
              />
            </SettingsRow>
          </>
        }
      />
    </>
  );
}
