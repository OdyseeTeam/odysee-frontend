import React from 'react';

export default function useConnectionStatus() {
  const [online, setOnline] = React.useState(window.navigator.onLine);
  const [wentOnlineTime, setWentOnlineTime] = React.useState(0);
  const [wentOfflineTime, setWentOfflineTime] = React.useState(0);

  React.useEffect(() => {
    function handleOnline(event) {
      setOnline(true);
      setWentOnlineTime(new Date(event.timeStamp));
    }

    function handleOffline(event) {
      setOnline(false);
      setWentOfflineTime(new Date(event.timeStamp));
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  let offlineDurationMs;
  if (wentOfflineTime && wentOnlineTime && online) {
    offlineDurationMs = wentOnlineTime - wentOfflineTime;
  }

  return { online, offlineDurationMs };
}
