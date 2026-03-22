import React, { useState } from 'react';
import { FormField } from 'component/common/form';
import Spinner from 'component/spinner';
import SUPPORTED_LANGUAGES from 'constants/supported_languages';
import LANGUAGES from 'constants/languages';
import { getDefaultLanguage, sortLanguageMap } from 'util/default-languages';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doSetLanguage } from 'redux/actions/settings';
import { selectLanguage } from 'redux/selectors/settings';

function SettingLanguage() {
  const dispatch = useAppDispatch();
  const language = useAppSelector(selectLanguage);
  const [changingLanguage, setChangingLanguage] = useState(false);

  function onLanguageChange(e) {
    const { value } = e.target;
    setChangingLanguage(true);
    dispatch(doSetLanguage(value)).finally(() => setChangingLanguage(false));

    if (document && document.documentElement) {
      if (LANGUAGES[value].length >= 3) {
        document.documentElement.dir = LANGUAGES[value][2];
      } else {
        document.documentElement.dir = 'ltr';
      }
    }
  }

  return (
    <React.Fragment>
      {!changingLanguage && (
        <FormField
          name="language_select"
          type="select"
          onChange={onLanguageChange}
          value={language || getDefaultLanguage()}
        >
          {sortLanguageMap(SUPPORTED_LANGUAGES).map(([langKey, langName]) => (
            <option key={langKey} value={langKey}>
              {langName}
            </option>
          ))}
        </FormField>
      )}

      {changingLanguage && <Spinner type="small" />}
    </React.Fragment>
  );
}

export default SettingLanguage;
