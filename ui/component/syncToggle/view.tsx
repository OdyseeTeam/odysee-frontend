import * as MODALS from 'constants/modal_types';
import * as SETTINGS from 'constants/settings';
import React from 'react';
import Button from 'component/button';
import SettingsRow from 'component/settingsRow';
import { FormField } from 'component/common/form';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { selectClientSetting } from 'redux/selectors/settings';
import { doOpenModal } from 'redux/actions/app';

type Props = {
  disabled: boolean;
};

function SyncToggle(props: Props) {
  const { disabled } = props;
  const dispatch = useAppDispatch();
  const syncEnabled = useAppSelector((state) => selectClientSetting(state, SETTINGS.ENABLE_SYNC));
  const verifiedEmail = useAppSelector(selectUserVerifiedEmail);
  return (
    <SettingsRow
      title={__('Sync')}
      subtitle={disabled || !verifiedEmail ? '' : __('Sync your balance and preferences across devices.')}
    >
      <FormField
        type="checkbox"
        name="sync_toggle"
        label={disabled || !verifiedEmail ? __('Sync your balance and preferences across devices.') : undefined}
        checked={syncEnabled && verifiedEmail}
        onChange={() =>
          dispatch(
            doOpenModal(MODALS.SYNC_ENABLE, {
              mode: syncEnabled ? 'disable' : 'enable',
            })
          )
        }
        disabled={disabled || !verifiedEmail}
        helper={
          disabled
            ? __("To enable Sync, close LBRY completely and check 'Remember Password' during wallet unlock.")
            : null
        }
      />
      {!verifiedEmail && (
        <div>
          <p className="help">{__('An email address is required to sync your account.')}</p>
          <Button requiresAuth button="primary" label={__('Add Email')} />
        </div>
      )}
    </SettingsRow>
  );
}
export default SyncToggle;
