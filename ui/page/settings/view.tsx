import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import * as React from 'react';
import classnames from 'classnames';
import Button from 'component/button';
import Page from 'component/page';
import SettingAccount from 'component/settingAccount';
import SettingAppearance from 'component/settingAppearance';
import SettingContent from 'component/settingContent';
import SettingPlayer from 'component/settingPlayer';
import SettingSystem from 'component/settingSystem';
import SettingUnauthenticated from 'component/settingUnauthenticated';
import Spinner from 'component/spinner';
import Yrbl from 'component/yrbl';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doEnterSettingsPage, doExitSettingsPage } from 'redux/actions/settings';
import { selectDaemonSettings, selectLanguage } from 'redux/selectors/settings';
import { selectPrefsReady } from 'redux/selectors/sync';
import { selectUserVerifiedEmail } from 'redux/selectors/user';

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const daemonSettings = useAppSelector(selectDaemonSettings);
  const isAuthenticated = useAppSelector(selectUserVerifiedEmail);
  const prefsReady = useAppSelector(selectPrefsReady);
  const language = useAppSelector(selectLanguage);

  React.useEffect(() => {
    dispatch(doEnterSettingsPage());
    return () => {
      dispatch(doExitSettingsPage());
    };
  }, [dispatch]);

  const noDaemonSettings = !daemonSettings || Object.keys(daemonSettings).length === 0;

  if (isAuthenticated && !prefsReady) {
    return (
      <Page
        noFooter
        settingsPage
        noSideNavigation
        backout={{
          title: __('Settings'),
          backLabel: __('Save'),
        }}
        className="card-stack"
      >
        <div className="main--empty">
          <Spinner text={__('Please wait a bit, we are still getting your account ready.')} />
        </div>
      </Page>
    );
  }

  return (
    <Page
      noFooter
      settingsPage
      noSideNavigation
      backout={{
        title: __('Settings'),
        backLabel: __('Save'),
      }}
      className="card-stack"
      key={language}
    >
      {!isAuthenticated && IS_WEB && (
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

      {!IS_WEB && noDaemonSettings ? (
        <section className="card card--section">
          <div className="card__title card__title--deprecated">{__('Failed to load settings.')}</div>
        </section>
      ) : (
        <div
          className={classnames('card-stack', {
            'card--disabled': IS_WEB && !isAuthenticated,
          })}
        >
          <SettingAppearance />
          <SettingAccount />
          <SettingContent />
          <SettingPlayer />
          <SettingSystem />
        </div>
      )}
    </Page>
  );
}
