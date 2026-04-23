import React from 'react';
import useIsMounted from 'effects/use-is-mounted'; // Returns web blob from the streaming url

export default function useStream(url) {
  const isMounted = useIsMounted();
  const [state, setState] = React.useState({
    error: false,
    loading: true,
    content: null,
  });
  React.useEffect(() => {
    if (url && isMounted.current) {
      fetch(url)
        .then((response) => {
          if (!isMounted.current) return;
          if (response.ok) {
            return response.blob();
          }
          throw new Error(`HTTP ${response.status}`);
        })
        .then((blob) => {
          if (isMounted.current && blob) {
            setState({
              content: blob,
              loading: false,
              error: false,
            });
          }
        })
        .catch(() => {
          if (isMounted.current) {
            setState({
              error: true,
              loading: false,
              content: null,
            });
          }
        });
    }
  }, [url, isMounted]);
  return state;
}
