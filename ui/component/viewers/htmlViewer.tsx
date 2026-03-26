import React, { useRef, useState, useEffect } from 'react';
type Props = {
  source: string;
};

function HtmlViewer({ source }: Props) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const el = iframe.current;
    if (!el) return;

    const onLoad = () => {
      setLoading(false);
      const { scrollHeight, scrollWidth } = el.contentDocument!.body;
      el.style.height = `${scrollHeight}px`;
      el.style.width = `${scrollWidth}px`;
    };

    el.addEventListener('load', onLoad);
    (el as any).resize = () => {
      const { scrollHeight, scrollWidth } = el.contentDocument!.body;
      el.style.height = `${scrollHeight}px`;
      el.style.width = `${scrollWidth}px`;
    };

    return () => el.removeEventListener('load', onLoad);
  }, []);

  return (
    <div className="file-viewer file-viewer--html file-viewer--iframe">
      {loading && <div className="placeholder--text-document" />}
      {/* @if TARGET='app' */}
      <iframe ref={iframe} hidden={loading} sandbox="" title={__('File preview')} src={`file://${source}`} />
      {/* @endif */}
      {/* @if TARGET='web' */}
      <iframe ref={iframe} hidden={loading} sandbox="" title={__('File preview')} src={source} />
      {/* @endif */}
    </div>
  );
}

export default HtmlViewer;
