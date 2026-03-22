import React from 'react';
import * as SETTINGS from 'constants/settings';
import { FormField } from 'component/common/form';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectClientSetting } from 'redux/selectors/settings';
import { doSetClientSetting, doSetDarkTime } from 'redux/actions/settings';

type SetDaemonSettingArg = boolean | string | number;
type DarkModeTimes = {
  from: {
    hour: string;
    min: string;
    formattedTime: string;
  };
  to: {
    hour: string;
    min: string;
    formattedTime: string;
  };
};
type OptionTimes = {
  fromTo: string;
  time: string;
};

function formatHour(time: string, clock24h: boolean) {
  if (clock24h) {
    return `${time}:00`;
  }

  const now = new Date(0, 0, 0, Number(time));
  return now.toLocaleTimeString('en-US', {
    hour12: true,
    hour: '2-digit',
  });
}

export default function ThemeSelector() {
  const dispatch = useAppDispatch();

  const currentTheme = useAppSelector((state) => selectClientSetting(state, SETTINGS.THEME));
  // Temporarily hardcoding themes here, otherwise user needs to log out and reload to get the changes in clientSettings.
  const themes = ['dark', 'light', 'system'];
  const automaticDarkModeEnabled = useAppSelector((state) =>
    selectClientSetting(state, SETTINGS.AUTOMATIC_DARK_MODE_ENABLED)
  );
  const darkModeTimes = useAppSelector((state) => selectClientSetting(state, SETTINGS.DARK_MODE_TIMES));
  const clock24h = useAppSelector((state) => selectClientSetting(state, SETTINGS.CLOCK_24H));

  const setClientSetting = (key: string, value: SetDaemonSettingArg) => dispatch(doSetClientSetting(key, value));
  const setDarkTime = (time: string, options: {}) => dispatch(doSetDarkTime(time, options));

  const startHours = ['18', '19', '20', '21'];
  const endHours = ['5', '6', '7', '8'];

  function onThemeChange(event: React.SyntheticEvent<any>) {
    const { value } = event.target;

    if (value === 'dark') {
      onAutomaticDarkModeChange(false);
    }

    setClientSetting(SETTINGS.THEME, value);
  }

  function onAutomaticDarkModeChange(value: boolean) {
    setClientSetting(SETTINGS.AUTOMATIC_DARK_MODE_ENABLED, value);
  }

  function onChangeTime(event: React.SyntheticEvent<any>, options: OptionTimes) {
    setDarkTime(event.target.value, options);
  }

  return (
    <>
      <fieldset-section>
        <FormField
          name="theme_select"
          type="select"
          onChange={onThemeChange}
          value={currentTheme}
          disabled={automaticDarkModeEnabled}
        >
          {themes.map((theme) => (
            <option key={theme} value={theme}>
              {theme === 'light' ? __('Light') : theme === 'dark' ? __('Dark') : __('System')}
            </option>
          ))}
        </FormField>
      </fieldset-section>

      <fieldset-section class="theme-checkbox">
        <FormField
          type="checkbox"
          name="automatic_dark_mode"
          onChange={() => onAutomaticDarkModeChange(!automaticDarkModeEnabled)}
          checked={automaticDarkModeEnabled}
          label={__('Automatic dark mode')}
        />

        {automaticDarkModeEnabled && (
          <fieldset-group class="fieldset-group--smushed">
            <FormField
              type="select"
              name="automatic_dark_mode_range_start"
              onChange={(value) =>
                onChangeTime(value, {
                  fromTo: 'from',
                  time: 'hour',
                })
              }
              value={darkModeTimes.from.hour}
              label={__('From --[initial time]--')}
            >
              {startHours.map((time) => (
                <option key={time} value={time}>
                  {formatHour(time, clock24h)}
                </option>
              ))}
            </FormField>

            <FormField
              type="select"
              name="automatic_dark_mode_range_end"
              label={__('To --[final time]--')}
              onChange={(value) =>
                onChangeTime(value, {
                  fromTo: 'to',
                  time: 'hour',
                })
              }
              value={darkModeTimes.to.hour}
            >
              {endHours.map((time) => (
                <option key={time} value={time}>
                  {formatHour(time, clock24h)}
                </option>
              ))}
            </FormField>
          </fieldset-group>
        )}
      </fieldset-section>
    </>
  );
}
