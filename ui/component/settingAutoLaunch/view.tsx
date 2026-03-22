import React from 'react';
import { FormField } from 'component/common/form';
import * as SETTINGS from 'constants/settings';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectClientSetting } from 'redux/selectors/settings';
import { doSetAutoLaunch } from 'redux/actions/settings';

type Props = {
  noLabels?: boolean;
};

function SettingAutoLaunch(props: Props) {
  const { noLabels } = props;
  const dispatch = useAppDispatch();
  const autoLaunch = useAppSelector((state) => selectClientSetting(state, SETTINGS.AUTO_LAUNCH));

  return (
    <React.Fragment>
      <FormField
        type="checkbox"
        name="autolaunch"
        onChange={(e) => {
          dispatch(doSetAutoLaunch(e.target.checked));
        }}
        checked={autoLaunch}
        label={noLabels ? '' : __('Start minimized')}
        helper={
          noLabels
            ? ''
            : __('Improve view speed and help the LBRY network by allowing the app to cuddle up in your system tray.')
        }
      />
    </React.Fragment>
  );
}

export default SettingAutoLaunch;
