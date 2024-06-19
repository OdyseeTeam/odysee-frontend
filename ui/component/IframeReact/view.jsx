// @flow
import React from 'react';
import Spinner from 'component/spinner';
import FileExporter from 'component/common/file-exporter';
import { platform } from 'util/platform';

type Props = {
  src: ?string,
  title: string,
  useDirectFetch?: boolean, // Fetch from application domain and pass the blob to the iframe
};

export default function I18nMessage(props: Props) {
  const { src, title, useDirectFetch } = props;

  // undefined = go fetch; null = skip fetch or failed;
  const [blob, setBlob] = React.useState(useDirectFetch ? undefined : null);

  const blobInIFrameNotAllowed = platform.isAndroid() && platform.isMobileChrome();

  // const iframeRef = useRef();

  // const [iframeHeight, setIframeHeight] = useState('80vh');

  function onLoad() {
    /*

    iframe domain restrictions prevent naive design :-(

    const obj = iframeRef.current;
    if (obj) {
      setIframeHeight(obj.contentWindow.document.body.scrollHeight + 'px');
    }

    */
  }

  function getFileNameFromUrl(url: string) {
    return url.split(/[=/_]/).pop();
  }

  React.useEffect(() => {
    if (src && blob === undefined) {
      fetch(src)
        .then((response) => {
          if (response.ok) {
            return response.blob();
          } else {
            assert(false, 'Failed to fetch', { src, response });
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
          }
        })
        .then((blob) => setBlob(blob))
        .catch(() => setBlob(null));
    }
  }, [blob, src]);

  // We try the blob method first to allow sending the Origin header.
  // If that fails (blob === null), we use the original method
  // (i.e. load src directly).

  if (blob === undefined) {
    return (
      <div className="main--empty">
        <Spinner small />
      </div>
    );
  }

  if (blobInIFrameNotAllowed && blob && src) {
    return (
      <FileExporter
        data={blob}
        mimeType="application/pdf"
        label={__('Open')}
        tooltip={__('Open PDF')}
        defaultFileName={`${getFileNameFromUrl(src)}.pdf`}
      />
    );
  }

  return (
    <iframe
      src={blob ? (window.URL || window.webkitURL).createObjectURL(blob) : src}
      title={title}
      onLoad={onLoad}
      sandbox={!IS_WEB}
    />
  );
}
