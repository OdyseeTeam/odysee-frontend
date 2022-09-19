const { DOMAIN } = require('../../config.js');
const AUTH_TOKEN = 'auth_token';
const SAVED_PASSWORD = 'saved_password';
const domain =
  typeof window === 'object' && window.location.hostname.includes('localhost') ? window.location.hostname : DOMAIN;
const isProduction = process.env.NODE_ENV === 'production';
const maxExpiration = 2147483647;
let sessionPassword;

function areCookiesEnabled() {
  // `navigator.cookieEnabled` doesn't get populated until a certain stage after
  // startup, so https://stackoverflow.com/a/48521179/977819 remains the best
  // solution so far.
  try {
    document.cookie = 'cookietest=1';
    const cookiesEnabled = document.cookie.indexOf('cookietest=') !== -1;
    document.cookie = 'cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT';
    return cookiesEnabled;
  } catch (e) {
    return false;
  }
}

function setCookie(name, value, expirationDaysOnWeb) {
  let expires = '';
  if (expirationDaysOnWeb) {
    let date = new Date();
    date.setTime(date.getTime() + expirationDaysOnWeb * 24 * 60 * 60 * 1000);
    // If on PC, set to not expire (max)
    expires = `expires=${IS_WEB ? date.toUTCString() : maxExpiration};`;
  }

  let cookie = `${name}=${value || ''}; ${expires} path=/;`;
  if (isProduction) {
    cookie += ` SameSite=None;`;
  }
  if (!isProduction) {
    cookie += ` SameSite=Lax;`;
  }
  if (isProduction) {
    cookie += ` domain=${domain}; Secure;`;
  }

  document.cookie = cookie;
}

function getCookie(name) {
  const nameEQ = name + '=';
  const cookies = document.cookie.split(';');

  for (var i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }

    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = name + `=; Max-Age=-99999999; domain=${domain}; path=/; Secure; SameSite=None;`;
}

function setSavedPassword(value, saveToDisk) {
  return new Promise((resolve) => {
    const password = value === undefined || value === null ? '' : value;
    sessionPassword = password;

    if (saveToDisk) {
      if (password) {
        setCookie(SAVED_PASSWORD, password, 14);
      } else {
        deleteSavedPassword();
      }
    }
  });
}

function getSavedPassword() {
  return new Promise((resolve) => {
    if (sessionPassword) {
      resolve(sessionPassword);
    }

    return getPasswordFromCookie().then((p) => resolve(p));
  });
}

function getPasswordFromCookie() {
  return new Promise((resolve) => {
    let password;
    password = getCookie(SAVED_PASSWORD);
    resolve(password);
  });
}

function deleteSavedPassword() {
  return new Promise((resolve) => {
    deleteCookie(SAVED_PASSWORD);
    resolve();
  });
}

function getAuthToken() {
  return getCookie(AUTH_TOKEN);
}

function setAuthToken(value) {
  return setCookie(AUTH_TOKEN, value, 365);
}

function deleteAuthToken() {
  return new Promise((resolve) => {
    deleteCookie(AUTH_TOKEN);
    resolve();
  });
}

function doSignOutCleanup() {
  return new Promise((resolve) => {
    deleteAuthToken();
    deleteSavedPassword();
    resolve();
  });
}

function doAuthTokenRefresh() {
  const authToken = getAuthToken();
  if (authToken) {
    deleteAuthToken();
    setAuthToken(authToken);
  }
}

module.exports = {
  areCookiesEnabled,
  setCookie,
  getCookie,
  deleteCookie,
  setSavedPassword,
  getSavedPassword,
  getPasswordFromCookie,
  deleteSavedPassword,
  getAuthToken,
  setAuthToken,
  deleteAuthToken,
  doSignOutCleanup,
  doAuthTokenRefresh,
};
