// @flow
import React from 'react';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';
import SettingsRow from 'component/settingsRow';
import ChannelSelector from 'component/channelSelector';
import Spinner from 'component/spinner';

type Props = {
  // --- select ---
  channelId: ?string,
  channelName: ?string,
  notificationSettings: ?NotificationSettings,
  // --- perform ---
  doFetchNotificationSettings: () => void,
  doSetNotificationSettings: (params: NotificationSettingsParams) => void,
};

type State = {
  fetchComplete: boolean,
  settingsState: ?NotificationSettings,
  byChannel: boolean,
};

class SettingNotifications extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      fetchComplete: false,
      settingsState: props.notificationSettings,
      byChannel: false,
    };
  }

  componentDidMount() {
    this.props.doFetchNotificationSettings();
  }

  componentDidUpdate() {
    const { notificationSettings } = this.props;
    const { fetchComplete } = this.state;

    if (!fetchComplete && notificationSettings) {
      this.setState({ fetchComplete: true, settingsState: notificationSettings });
    }
  }

  componentWillUnmount() {
    const { channelId, channelName, notificationSettings, doSetNotificationSettings } = this.props;
    const { settingsState, byChannel } = this.state;

    if (settingsState && settingsState !== notificationSettings) {
      const channelData =
        byChannel && channelId && channelName
          ? { channel_id: channelId, channel_name: channelName }
          : { channel_id: '*', channel_name: '*' };

      doSetNotificationSettings({ ...channelData, data: { ...settingsState } });
    }
  }

  handleClick(all: boolean, from_followers: boolean, from_followed: boolean) {
    this.setState({
      settingsState: {
        disabled: { all },
        mention: { from_followers, from_followed },
      },
    });
  }

  render() {
    const { fetchComplete, settingsState, byChannel } = this.state;

    const { disabled, mention } = settingsState || {};
    const { all: notificationsDisabled } = disabled || {};
    const { from_followers: followersDisabled, from_followed: followedDisabled } = mention || {};

    return (
      <>
        <ChannelSelector hideAnon disabled={!byChannel} />

        {!fetchComplete ? (
          <div className="main--empty">
            <Spinner />
          </div>
        ) : (
          <Card
            isBodyList
            body={
              <>
                <SettingsRow title={__('Set by Channel?')}>
                  <FormField
                    type="checkbox"
                    name="notifications_disable"
                    checked={byChannel}
                    onChange={() => this.setState({ byChannel: !byChannel })}
                  />
                </SettingsRow>

                <SettingsRow title={__('Disable All')}>
                  <FormField
                    type="checkbox"
                    name="notifications_disable"
                    checked={notificationsDisabled}
                    onChange={() => this.handleClick(!notificationsDisabled, followersDisabled, followedDisabled)}
                  />
                </SettingsRow>

                <SettingsRow title={__('Mention Notifications')} multirow disabled={notificationsDisabled}>
                  <FormField
                    type="checkbox"
                    name="mention_followed"
                    checked={followersDisabled}
                    label={__('From Followers')}
                    onChange={() => this.handleClick(notificationsDisabled, !followersDisabled, followedDisabled)}
                  />
                  <FormField
                    type="checkbox"
                    name="mention_follower"
                    checked={followedDisabled}
                    label={__('From Followed')}
                    onChange={() => this.handleClick(notificationsDisabled, followersDisabled, !followedDisabled)}
                  />
                </SettingsRow>
              </>
            }
          />
        )}
      </>
    );
  }
}

export default SettingNotifications;
