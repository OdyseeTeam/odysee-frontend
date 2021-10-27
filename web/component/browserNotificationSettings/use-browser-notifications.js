// @flow
import { useEffect, useState, useMemo } from 'react';
import { pushSubscribe, pushUnsubscribe, pushIsSubscribed } from '$web/src/push-notifications';
import { isSupported } from 'firebase/messaging';
import * as PAGES from 'constants/pages';

// @todo: Once we are on Redux 7 we should have proper hooks we can use here for store access.
import { store } from '$ui/store';
import { selectUser } from 'redux/selectors/user';
import { doToast } from 'redux/actions/notifications';

export default () => {
  const [pushPermission, setPushPermission] = useState(window.Notification?.permission);
  const [subscribed, setSubscribed] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [encounteredError, setEncounteredError] = useState(false);

  const [user] = useState(selectUser(store.getState()));

  useEffect(() => {
    pushIsSubscribed(user.id).then((isSubscribed: boolean) => setSubscribed(isSubscribed));
    isSupported().then((supported: boolean) => setPushSupported(supported));
  }, [user]);

  useMemo(() => setPushEnabled(pushPermission === 'granted' && subscribed), [pushPermission, subscribed]);

  const subscribe = async () => {
    setEncounteredError(false);
    if (await pushSubscribe(user.id)) {
      setSubscribed(true);
      setPushPermission(window.Notification?.permission);
    } else {
      setEncounteredError(true);
      showToastError();
    }
  };

  const unsubscribe = async () => {
    if (await pushUnsubscribe(user.id)) {
      setSubscribed(false);
    }
  };

  const pushToggle = async () => {
    return !pushEnabled ? subscribe() : unsubscribe();
  };

  const pushRequest = async () => {
    return window.Notification?.permission !== 'granted' ? subscribe() : null;
  };

  const showToastError = () => {
    store.dispatch(
      doToast({
        isError: true,
        message: __('There was an error enabling browser notifications.'),
        linkText: __('More info.'),
        linkTarget: `/${PAGES.SETTINGS_NOTIFICATIONS}`,
      })
    );
  };

  return {
    pushSupported,
    pushEnabled,
    pushPermission,
    pushToggle,
    pushRequest,
    encounteredError,
  };
};
