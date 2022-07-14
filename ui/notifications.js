// @flow
import { NOTIFICATION_SETTINGS_API } from 'config';
import { getAuthToken } from 'util/saved-passwords';
import querystring from 'querystring';

const METHODS = {
  GET: 'get',
  SET: 'set',
};

type SettingsSetParams = {
  channel_name: string,
  channel_id: string,
  data: NotificationSettings,
};

const Notifications = {
  url: NOTIFICATION_SETTINGS_API,

  settings_get: () => fetchNotificationsApi(METHODS.GET),
  settings_set: (params: SettingsSetParams) => fetchNotificationsApi(METHODS.SET, params),
};

function fetchNotificationsApi(method: string, params: ?SettingsSetParams) {
  const fullParams = { auth_token: getAuthToken() };

  const qs = querystring.stringify(fullParams);
  const url = `${Notifications.url}${method}?${qs}`;

  let options;
  if (method === METHODS.SET && params) {
    Object.keys(params).forEach((key) => {
      // $FlowFixMe
      const value = params[key];
      if (typeof value === 'object') {
        // $FlowFixMe
        params[key] = JSON.stringify(value);
      }
    });

    options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: querystring.stringify(params),
    };
  }

  return fetch(url, options)
    .then((res) => res.json())
    .then((json) => {
      return json;
    })
    .catch((e) => {
      throw new Error(e);
    });
}

export default Notifications;
