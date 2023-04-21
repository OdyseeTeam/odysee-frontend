// @flow
import React, { useEffect } from 'react';
import classnames from 'classnames';
import Freezeframe from './FreezeframeLite';
import useLazyLoading from 'effects/use-lazy-loading';
import { THUMBNAIL_CDN_URL } from 'config';

type Props = {
  src: string,
  className: string,
  children: any,
};

const FreezeframeWrapper = (props: Props) => {
  const { src, className, children } = props;

  const imgRef = React.useRef();
  const freezeframe = React.useRef();
  const srcLoaded = useLazyLoading(imgRef);
  const devicePixelRatio = window.devicePixelRatio || 1.0;

  useEffect(() => {
    if (srcLoaded) {
      freezeframe.current = new Freezeframe(imgRef.current);
    }
  }, [srcLoaded]);

  useEffect(() => {
    if (imgRef.current) {
      const width = Math.floor(imgRef.current.width * devicePixelRatio);
      // $FlowIgnore
      imgRef.current?.setAttribute('src', `${THUMBNAIL_CDN_URL}s:${width}:0/quality:95/plain/${src}`);
      freezeframe.current = new Freezeframe(imgRef.current);
    }
  }, [src, imgRef]);

  return (
    <div className={classnames(className, 'freezeframe-wrapper')}>
      <img ref={imgRef} className="freezeframe-img" />
      {children}
    </div>
  );
};

export default FreezeframeWrapper;
