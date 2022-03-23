// @flow
import { NOTIFICATION_SETTINGS_API } from 'config';
import { getAuthToken } from 'util/saved-passwords';
import querystring from 'querystring';

const Notifications = {
  url: NOTIFICATION_SETTINGS_API,

  settings_get: () => fetchNotificationsApi('get', {}),
  settings_set: (params: NotificationSettingsParams) => fetchNotificationsApi('set', params),
};

function fetchNotificationsApi(method: string, params: NotificationSettingsParams) {
  const fullParams = { auth_token: getAuthToken(), ...params };
  Object.keys(fullParams).forEach((key) => {
    const value = fullParams[key];
    if (typeof value === 'object') {
      fullParams[key] = JSON.stringify(value);
    }
  });

  const qs = querystring.stringify(fullParams);
  const queryParams = qs ? `?${qs}` : '';
  const url = `${Notifications.url}${method}${queryParams}`;

  return fetch(url)
    .then((res) => res.json())
    .then((json) => {
      return json;
    })
    .catch((e) => {
      throw new Error(e);
    });
}

export default Notifications;
