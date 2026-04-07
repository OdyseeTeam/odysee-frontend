/**
 * Settings that we allow for unauthenticated users.
 */
import React from 'react';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';
import HomepageSelector from 'component/homepageSelector';
import SettingLanguage from 'component/settingLanguage';
import SettingsRow from 'component/settingsRow';
import ThemeSelector from 'component/themeSelector';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import * as SETTINGS from 'constants/settings';
import { doSetClientSetting } from 'redux/actions/settings';
import { selectClientSetting, selectHomepageKeys } from 'redux/selectors/settings';

export default function SettingUnauthenticated() {
  const dispatch = useAppDispatch();
  const searchInLanguage = useAppSelector((state) => selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE));
  const homepageKeys = useAppSelector(selectHomepageKeys);

  const setSearchInLanguage = (value: boolean) => dispatch(doSetClientSetting(SETTINGS.SEARCH_IN_LANGUAGE, value));

  return <Card isBodyList body={<>
          <SettingsRow title={__('Language')} subtitle={__(HELP_LANGUAGE)}>
            <SettingLanguage />
          </SettingsRow>

          <SettingsRow title={__('Search only in the selected language by default')}>
            <FormField name="search-in-language" type="checkbox" checked={searchInLanguage} onChange={() => setSearchInLanguage(!searchInLanguage)} />
          </SettingsRow>

          {homepageKeys.length > 1 && <SettingsRow title={__('Homepage')} subtitle={__('Tailor your experience.')}>
              <HomepageSelector />
            </SettingsRow>}

          <SettingsRow title={__('Theme')}>
            <ThemeSelector />
          </SettingsRow>
        </>} />;
} // prettier-ignore

const HELP_LANGUAGE =
  'Multi-language support is community-driven and may be incomplete for some languages. Switching your language may have unintended consequences, like glossolalia.';
