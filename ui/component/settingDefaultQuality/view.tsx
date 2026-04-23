import React from 'react';
import { FormField } from 'component/common/form';
import { VIDEO_QUALITY_OPTIONS } from 'constants/player';
import { toCapitalCase } from 'util/string';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import * as SETTINGS from 'constants/settings';
import { doSetDefaultVideoQuality } from 'redux/actions/settings';
import { selectClientSetting } from 'redux/selectors/settings';

const OPTION_DISABLED = 'Disabled';

export default function SettingDefaultQuality() {
  const dispatch = useAppDispatch();
  const defaultQuality: string | null | undefined = useAppSelector((state) =>
    selectClientSetting(state, SETTINGS.DEFAULT_VIDEO_QUALITY)
  );
  const valueRef = React.useRef();
  const dropdownOptions = [OPTION_DISABLED, ...VIDEO_QUALITY_OPTIONS];

  function handleSetQuality(e) {
    const { value } = e.target;
    dispatch(doSetDefaultVideoQuality(value === OPTION_DISABLED ? null : value));
    valueRef.current = value;
  }

  return (
    <FormField
      name="default_video_quality"
      type="select"
      onChange={handleSetQuality}
      value={defaultQuality || valueRef.current}
    >
      {dropdownOptions.map((option) => {
        return (
          <option key={String(option)} value={option}>
            {typeof option === 'number' ? `${option}p` : __(toCapitalCase(option))}
          </option>
        );
      })}
    </FormField>
  );
}
