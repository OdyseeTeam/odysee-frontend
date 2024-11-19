// @flow
import React from 'react';
import Card from 'component/common/card';

type Props = {
  fullHeight: boolean,
  src: string,
  title: string,
};

export default function I18nMessage(props: Props) {
  const { src, title } = props;

  const [failedToLoadSrc, setFailedToLoadSrc] = React.useState(false);
  // const iframeRef = React.useRef();

  // const [iframeHeight, setIframeHeight] = useState('80vh');

  function onLoad() {
    const checkIfSrcCanBeLoaded = async () => {
      const response = await fetch(src);
      if (response.status !== 200) {
        setFailedToLoadSrc(true);
      }
    };
    checkIfSrcCanBeLoaded();

    /*

    iframe domain restrictions prevent naive design :-(

    const obj = iframeRef.current;
    if (obj) {
      setIframeHeight(obj.contentWindow.document.body.scrollHeight + 'px');
    }

    */
  }

  return (
    // style={{height: iframeHeight}}
    // ref={iframeRef}
    !failedToLoadSrc ? (
      <iframe src={src} title={title} onLoad={onLoad} sandbox={!IS_WEB} />
    ) : (
      <Card
        title={__('Failed to load')}
        subtitle={
          <p>
            {__(
              'This file failed to load. Some browser extension may be blocking it. If the issue persists, please reach out to help@odysee.com'
            )}
          </p>
        }
      />
    )
  );
}
