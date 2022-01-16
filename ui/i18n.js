// @flow
const { isLocalStorageAvailable } = require('./util/storage');

const isProduction = process.env.NODE_ENV === 'production';
const localStorageAvailable = isLocalStorageAvailable();

globalThis.i18n_messages = globalThis.i18n_messages || {};
let reportTimer;

/**
 * Collects new i18n strings encountered during runtime.
 * The output can be retrieved and pasted into app-strings.json.
 *
 * @param message
 */
function saveMessageWeb(message) {
  // @if process.env.NODE_ENV!='production'
  if (!globalThis.app_strings) {
    return;
  }

  if (!globalThis.new_strings) {
    console.log('Copy new i18n to clipboard:%c copy(globalThis.new_strings)', 'color:yellow'); // eslint-disable-line
  }

  globalThis.new_strings = globalThis.new_strings || {};

  if (!globalThis.app_strings[message] && !globalThis.new_strings[message]) {
    globalThis.new_strings[message] = removeContextMetadata(message);

    // @if REPORT_NEW_STRINGS='true'
    if (reportTimer) clearTimeout(reportTimer);
    reportTimer = setTimeout(() => console.log(globalThis.new_strings), 2000); // eslint-disable-line no-console
    // @endif
  }
  // @endif
}

function removeContextMetadata(message) {
  // Example string entries with context-metadata:
  //   "About --[About section in Help Page]--": "About",
  //   "About --[tab title in Channel Page]--": "About",
  const CONTEXT_BEGIN = '--[';
  const CONTEXT_FINAL = ']--';

  // If the resolved string still contains the context-metadata, then it's one of the following:
  // 1. In development mode, where 'en.json' in the server hasn't been updated with the string yet.
  // 2. Translator made a mistake of not ignoring the context string.
  // In either case, we'll revert to the English version.

  const begin = message.lastIndexOf(CONTEXT_BEGIN);
  if (begin > 0 && message.endsWith(CONTEXT_FINAL)) {
    // Strip away context:
    message = message.substring(0, begin);
    // No trailing spaces should be allowed in the string database anyway, because that is hard to translate
    // (can't see in Transifex; might not make sense in other languages; etc.).
    // With that, we can add a space before the context-metadata to make it neat, and trim both cases here:
    message = message.trimEnd();
  }

  return message;
}

function __(message /*: string */, tokens /*: { [string]: string } */) {
  if (!message) {
    return '';
  }

  const navLang = globalThis.navigator?.language || '';

  const language = localStorageAvailable
    ? globalThis.localStorage.getItem('language') || 'en'
    : navLang.slice(0, 2) || 'en';

  if (!isProduction) {
    saveMessageWeb(message);
  }

  let translatedMessage = globalThis.i18n_messages[language]
    ? globalThis.i18n_messages[language][message] || message
    : message;
  translatedMessage = removeContextMetadata(translatedMessage);

  if (!tokens) {
    return translatedMessage;
  }

  return translatedMessage.replace(/%([^%]+)%/g, ($1, $2) => {
    return tokens.hasOwnProperty($2) ? tokens[$2] : $2;
  });
}

module.exports = {
  __,
};
