import React from 'react';
import classnames from 'classnames';
import useLazyLoading from 'effects/use-lazy-loading';
type Props = {
  thumb: string | null | undefined;
  fallback: string | null | undefined;
  children?: React.ReactNode;
  className?: string;
  small?: boolean;
  forceReload?: boolean;
  isLiveRefreshing?: boolean;
  hoverHandlers?: {
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
  };
};

const Thumb = (props: Props) => {
  const { thumb, fallback, children, className, small, isLiveRefreshing, hoverHandlers } = props;
  const thumbnailRef = React.useRef(null);
  const srcLoaded = useLazyLoading(thumbnailRef, fallback || '', undefined, [thumb]);

  // For live thumbnail refresh: use double-buffered <img> elements to avoid flicker.
  // The "front" image shows the current frame; the "back" preloads the next one.
  // When the back image loads, it becomes visible and the old front fades away.
  const [bufferA, setBufferA] = React.useState<string | null>(null);
  const [bufferB, setBufferB] = React.useState<string | null>(null);
  const [activeBuffer, setActiveBuffer] = React.useState<'a' | 'b'>('a');

  React.useEffect(() => {
    if (!isLiveRefreshing || !thumb) return;
    // Load into the inactive buffer, then swap
    if (activeBuffer === 'a') {
      setBufferB(thumb);
    } else {
      setBufferA(thumb);
    }
  }, [thumb]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImgLoad = React.useCallback((buffer: 'a' | 'b') => {
    setActiveBuffer(buffer);
  }, []);

  if (isLiveRefreshing && (bufferA || bufferB)) {
    // Double-buffered live mode: base layer is background-image (never blank),
    // two <img> elements stack on top and crossfade. Only rendered when they have a real URL.
    return (
      <div
        ref={thumbnailRef}
        style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}
        className={classnames('media__thumb', {
          className,
          'media__thumb--small': small,
          'media__thumb--loaded': true,
        })}
        {...hoverHandlers}
      >
        {bufferA && (
          <img
            src={bufferA}
            className={classnames('media__thumb-live-img', { 'media__thumb-live-img--active': activeBuffer === 'a' })}
            onLoad={() => handleImgLoad('a')}
            alt=""
            draggable={false}
          />
        )}
        {bufferB && (
          <img
            src={bufferB}
            className={classnames('media__thumb-live-img', { 'media__thumb-live-img--active': activeBuffer === 'b' })}
            onLoad={() => handleImgLoad('b')}
            alt=""
            draggable={false}
          />
        )}
        {children}
      </div>
    );
  }

  return (
    <div
      ref={thumbnailRef}
      data-background-image={thumb}
      style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}
      className={classnames('media__thumb', {
        className,
        'media__thumb--small': small,
        'media__thumb--loaded': srcLoaded,
      })}
      {...hoverHandlers}
    >
      {children}
    </div>
  );
};

export default Thumb;
