import { ALERT } from 'constants/icons';
import { SETTINGS_GRP } from 'constants/settings';
import React from 'react';
import Button from 'component/button';
import Card from 'component/common/card';
import SettingsRow from 'component/settingsRow';
import { getPasswordFromCookie } from 'util/saved-passwords';
import * as MODALS from 'constants/modal_types';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doWalletStatus } from 'redux/actions/wallet';
import { doOpenModal, doClearCache } from 'redux/actions/app';
import { selectUserVerifiedEmail } from 'redux/selectors/user';

export default function SettingSystem() {
  const dispatch = useAppDispatch();

  const isAuthenticated = useAppSelector(selectUserVerifiedEmail);

  const clearCache = () => dispatch(doClearCache());
  const updateWalletStatus = () => dispatch(doWalletStatus());

  const [clearingCache, setClearingCache] = React.useState(false);
  const [storedPassword, setStoredPassword] = React.useState(false);

  // Update storedPassword state
  React.useEffect(() => {
    if (isAuthenticated || !IS_WEB) {
      updateWalletStatus();
      getPasswordFromCookie().then((p) => {
        if (typeof p === 'string') {
          setStoredPassword(true);
        }
      });
    }
  }, []);
  // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Card
        id={SETTINGS_GRP.SYSTEM}
        background
        isBodyList
        title={__('System')}
        body={
          <>
            <SettingsRow
              title={__('Clear application cache')}
              subtitle={__('This might fix issues that you are having. Your wallet will not be affected.')}
            >
              <Button
                button="secondary"
                icon={ALERT}
                label={clearingCache ? __('Clearing') : __('Clear Cache')}
                onClick={() => {
                  setClearingCache(true);
                  clearCache();
                }}
                disabled={clearingCache}
              />
            </SettingsRow>

            <SettingsRow
              title={__('Request account deletion')}
              subtitle={__('Send account deletion request to Odysee')}
            >
              <Button
                button="secondary"
                icon={ALERT}
                label={__('Delete Account')}
                onClick={() => {
                  dispatch(doOpenModal(MODALS.ACCOUNT_DELETE));
                }}
              />
            </SettingsRow>
          </>
        }
      />
    </>
  );
}
