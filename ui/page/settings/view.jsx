// @flow
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import * as React from 'react';
import classnames from 'classnames';
import Button from 'component/button';
import Page from 'component/page';
import SettingAccount from 'component/settingAccount';
import SettingAppearance from 'component/settingAppearance';
import SettingContent from 'component/settingContent';
import SettingSystem from 'component/settingSystem';
import SettingUnauthenticated from 'component/settingUnauthenticated';
import Yrbl from 'component/yrbl';

type Props = {
  isAuthenticated: boolean,
  enterSettings: () => void,
  exitSettings: () => void,
};

class SettingsPage extends React.PureComponent<Props> {
  componentDidMount() {
    const { enterSettings } = this.props;
    enterSettings();
  }

  componentWillUnmount() {
    const { exitSettings } = this.props;
    exitSettings();
  }

  render() {
    const { isAuthenticated } = this.props;

    return (
      <Page
        noFooter
        settingsPage
        noSideNavigation
        backout={{ title: __('Settings'), backLabel: __('Save') }}
        className="card-stack"
      >
        {!isAuthenticated && (
          <>
            <SettingUnauthenticated />

            <div className="main--empty">
              <Yrbl
                type="happy"
                title={__('Sign up for full control')}
                subtitle={__('Unlock new buttons that change things.')}
                actions={
                  <div className="section__actions">
                    <Button button="primary" icon={ICONS.SIGN_UP} label={__('Sign Up')} navigate={`/$/${PAGES.AUTH}`} />
                  </div>
                }
              />
            </div>
          </>
        )}

        <div className={classnames('card-stack', { 'card--disabled': !isAuthenticated })}>
          <SettingAppearance />
          <SettingAccount />
          <SettingContent />
          <SettingSystem />
        </div>
      </Page>
    );
  }
}

export default SettingsPage;
