import Keycloak from 'keycloak-js';

const ON_LOAD = {
  LOGIN_REQUIRED: 'login-required',
  CHECK_SSO: 'check-sso',
};

// ****************************************************************************
// ****************************************************************************

export const initOptions = {
  onLoad: ON_LOAD.CHECK_SSO,
  // silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
  pkceMethod: 'S256',
  // @if process.env.AUTH_LOGGING='true'
  enableLogging: true,
  // @endif
};

// Pass initialization options as required or leave blank to load from 'keycloak.json'
const keycloak = new Keycloak({
  url: 'https://sso.odysee.com/auth',
  realm: 'Users',
  clientId: 'odysee.com',
});

export default keycloak;
