// @flow
import React from 'react';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';
import SettingsRow from 'component/settingsRow';
import ChannelSelector from 'component/channelSelector';
import Spinner from 'component/spinner';

type Props = {
  // --- select ---
  notificationSettings: ?NotificationSettings,
  // --- perform ---
  doFetchNotificationSettings: () => void,
  doSetNotificationSettings: (params: NotificationSettings) => void,
};

type State = {
  fetchComplete: boolean,
  settingsState: ?NotificationSettings,
};

class SettingNotifications extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      fetchComplete: false,
      settingsState: props.notificationSettings,
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
    const { notificationSettings, doSetNotificationSettings } = this.props;
    const { settingsState } = this.state;

    if (settingsState && settingsState !== notificationSettings) doSetNotificationSettings(settingsState);
  }

  render() {
    const { fetchComplete, settingsState } = this.state;

    const { disabled, mention } = settingsState || {};
    const { all: notificationsDisabled } = disabled || {};
    const { from_followers: followersDisabled, from_followed: followedDisabled } = mention || {};

    return (
      <>
        <ChannelSelector hideAnon />

        {!fetchComplete ? (
          <div className="main--empty">
            <Spinner />
          </div>
        ) : (
          <Card
            isBodyList
            body={
              <>
                <SettingsRow title={__('Disable All')}>
                  <FormField
                    type="checkbox"
                    name="notifications_disable"
                    checked={notificationsDisabled}
                    onChange={() =>
                      this.setState({
                        settingsState: {
                          disabled: {
                            all: !notificationsDisabled,
                          },
                          mention: {
                            from_followers: followersDisabled,
                            from_followed: followedDisabled,
                          },
                        },
                      })
                    }
                  />
                </SettingsRow>

                <SettingsRow title={__('Mention Notifications')} multirow disabled={notificationsDisabled}>
                  <FormField
                    type="checkbox"
                    name="mention_followed"
                    checked={followersDisabled}
                    label={__('From Followers')}
                    onChange={() =>
                      this.setState({
                        settingsState: {
                          disabled: {
                            all: notificationsDisabled,
                          },
                          mention: {
                            from_followers: !followersDisabled,
                            from_followed: followedDisabled,
                          },
                        },
                      })
                    }
                  />
                  <FormField
                    type="checkbox"
                    name="mention_follower"
                    checked={followedDisabled}
                    label={__('From Followed')}
                    onChange={() =>
                      this.setState({
                        settingsState: {
                          disabled: {
                            all: notificationsDisabled,
                          },
                          mention: {
                            from_followers: followersDisabled,
                            from_followed: !followedDisabled,
                          },
                        },
                      })
                    }
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
