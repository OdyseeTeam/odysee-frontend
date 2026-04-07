import React from 'react';
import { FormField } from 'component/common/form';
import * as SETTINGS from 'constants/settings';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectClientSetting } from 'redux/selectors/settings';
import { doSetAppToTrayWhenClosed } from 'redux/actions/settings';

type Props = {
  noLabels?: boolean;
};

function SettingClosingBehavior(props: Props) {
  const { noLabels } = props;
  const dispatch = useAppDispatch();
  const toTrayWhenClosed = useAppSelector((state) => selectClientSetting(state, SETTINGS.TO_TRAY_WHEN_CLOSED));

  return (
    <React.Fragment>
      <FormField
        type="checkbox"
        name="totraywhenclosed"
        onChange={(e) => {
          dispatch(doSetAppToTrayWhenClosed(e.target.checked));
        }}
        checked={toTrayWhenClosed}
        label={noLabels ? '' : __('Leave app running in notification area when the window is closed')}
      />
    </React.Fragment>
  );
}

export default SettingClosingBehavior;
