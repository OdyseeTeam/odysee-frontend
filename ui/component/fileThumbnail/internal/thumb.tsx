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
  const { thumb, fallback, children, className, small, forceReload } = props;
  const thumbnailRef = React.useRef(null);
  useLazyLoading(thumbnailRef, fallback || '', undefined, [thumb]);
  return (
    <div
      ref={thumbnailRef}
      data-background-image={thumb}
      style={
        forceReload && {
          backgroundImage: 'url(' + String(thumb) + ')',
        }
      }
      className={classnames('media__thumb', {
        className,
        'media__thumb--small': small,
      })}
    >
      {children}
    </div>
  );
};

export default Thumb;
