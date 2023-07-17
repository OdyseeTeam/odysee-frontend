// @flow
import * as React from 'react';
import LoadingBar from 'react-top-loading-bar';

function LoadingBarOneOff(props: any) {
  const loadingBarRef = React.useRef(null);

  React.useEffect(() => {
    if (loadingBarRef.current) {
      loadingBarRef.current.continuousStart();
    }
  }, []);

  return <LoadingBar className="loading-bar" ref={loadingBarRef} />;
}

export default LoadingBarOneOff;
