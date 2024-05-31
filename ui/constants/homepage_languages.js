import { getLanguageEngName } from 'constants/languages';

const HOMEPAGE_LANGUAGES = {
  en: getLanguageEngName('en'),
  fr: getLanguageEngName('fr'),
  es: getLanguageEngName('es'),
  de: getLanguageEngName('de'),
  zh: getLanguageEngName('zh'),
  ru: getLanguageEngName('ru'),
  it: getLanguageEngName('it'),
  'pt-BR': getLanguageEngName('pt-BR'),
  in: getLanguageEngName('in'),
};

export function getHomepageLanguage(code) {
  switch (code) {
    case 'zh-Hans':
    case 'zh-Hant':
      return HOMEPAGE_LANGUAGES.zh;
    case 'hi':
    case 'pa':
    case 'ur':
      return HOMEPAGE_LANGUAGES.in; // Assuming 'hi' for these languages
    default:
      return HOMEPAGE_LANGUAGES[code] || null;
  }
}

export default HOMEPAGE_LANGUAGES;
