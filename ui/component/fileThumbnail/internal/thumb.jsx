// @flow
import React from 'react';
import classnames from 'classnames';
import type { Node } from 'react';
import useLazyLoading from 'effects/use-lazy-loading';

type Props = {
  thumb: ?string,
  fallback: ?string,
  children?: Node,
  className?: string,
  small?: boolean,
  forceReload?: boolean,
};

const Thumb = (props: Props) => {
  const { thumb, fallback, children, className, small, forceReload } = props;
  const thumbnailRef = React.useRef(null);
  useLazyLoading(thumbnailRef, fallback || '');

  const inlineStyle = {};
  if (forceReload) inlineStyle.backgroundImage = 'url(' + String(thumb) + ')';

  return (
    <div
      ref={thumbnailRef}
      data-background-image={thumb}
      style={inlineStyle}
      className={classnames('media__thumb', { className, 'media__thumb--small': small })}
    >
      {children}
    </div>
  );
};

export default Thumb;
