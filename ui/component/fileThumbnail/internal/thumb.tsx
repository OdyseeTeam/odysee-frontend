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
};

const Thumb = (props: Props) => {
  const { thumb, fallback, children, className, small } = props;
  const thumbnailRef = React.useRef(null);
  const srcLoaded = useLazyLoading(thumbnailRef, fallback || '', undefined, [thumb]);
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
    >
      {children}
    </div>
  );
};

export default Thumb;
