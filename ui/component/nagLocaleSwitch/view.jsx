// @flow
import { FormField } from 'component/common/form';
import * as MODALS from 'constants/modal_types';
import HOMEPAGE_LANGUAGES from 'constants/homepage_languages';
import Nag from 'component/common/nag';
import React from 'react';
import usePersistedState from 'effects/use-persisted-state';
import LANGUAGES from 'constants/languages';

const LOCALE_OPTIONS = {
  BOTH: 'both',
  LANG: 'lang',
  HOME: 'home',
};

type Props = {
  localeLangs: Array<string>,
  // redux
  doSetLanguage: (string) => void,
  doSetHomepage: (string) => void,
  doOpenModal: (string, {}) => void,
};

export default function NagLocaleSwitch(props: Props) {
  const { localeLangs, doSetLanguage, doSetHomepage, doOpenModal } = props;

  const [switchOption, setSwitchOption] = React.useState(LOCALE_OPTIONS.BOTH);
  const [localeSwitchDismissed, setLocaleSwitchDismissed] = usePersistedState('locale-switch-dismissed', undefined);

  const noHomepageForLang = localeLangs.some((lang) => !HOMEPAGE_LANGUAGES[lang]);
  const message = __(
    // If no homepage, only suggest language switch
    noHomepageForLang
      ? 'There are language translations available for your location! Do you want to switch from English?'
      : 'A homepage and language translations are available for your location! Do you want to switch?'
  );

  function dismissSwitch() {
    setLocaleSwitchDismissed(true);
  }

  function handleSwitch() {
    dismissSwitch();

    const switchLanguage = switchOption === LOCALE_OPTIONS.BOTH || switchOption === LOCALE_OPTIONS.LANG;

    if (localeLangs.length > 1 && switchLanguage) {
      doOpenModal(MODALS.CONFIRM, {
        title: __('Choose Your Preferred Language'),
        body: <LanguageSelect localeLangs={localeLangs} />,
        onConfirm: () => {
          // $FlowFixMe
          const selection = document.querySelector('.language-switch.checked').id.split(' ')[1];
          doSetLanguage(selection);
        },
      });
    } else {
      const language = localeLangs[0];

      if (switchLanguage) {
        doSetLanguage(language);
      }
      if (switchOption === LOCALE_OPTIONS.BOTH || switchOption === LOCALE_OPTIONS.HOME) {
        doSetHomepage(language);
      }
    }
  }

  return (
    !localeSwitchDismissed && (
      <Nag
        message={message}
        type="helpful"
        action={
          // Menu field only needed if there is a homepage + language to choose, otherwise
          // there is only 1 option to switch, so use the nag button
          !noHomepageForLang && (
            <FormField
              className="nag__select"
              type="select"
              value={switchOption}
              onChange={(e) => setSwitchOption(e.target.value)}
            >
              <option value={LOCALE_OPTIONS.BOTH}>{__('Both')}</option>
              <option value={LOCALE_OPTIONS.LANG}>{__('Only Language')}</option>
              <option value={LOCALE_OPTIONS.HOME}>{__('Only Homepage')}</option>
            </FormField>
          )
        }
        actionText={__('Switch Now')}
        onClick={handleSwitch}
        onClose={dismissSwitch}
        closeTitle={__('Dismiss')}
      />
    )
  );
}

type LangProps = {
  localeLangs: Array<string>,
};

const LanguageSelect = (props: LangProps) => {
  const { localeLangs } = props;

  const [selection, setSelection] = React.useState(localeLangs[0]);

  return localeLangs.map((lang) => {
    const language = LANGUAGES[lang][0];
    const languageName = LANGUAGES[lang][1];
    const label = language === languageName ? language : `${language} (${languageName})`;

    return (
      <FormField
        type="radio"
        className={`language-switch ${selection === lang ? 'checked' : ''}`}
        name={`language_switch ${lang}`}
        key={lang}
        label={label}
        checked={selection === lang}
        onChange={(e) => setSelection(lang)}
      />
    );
  });
};
