// @flow
import React from 'react';
import { useOnResize } from 'effects/use-on-resize';

import './style.scss';
type Props = {
  featured: any,
};

export default function FeaturedBanner(props: Props) {
  const { featured } = props;
  const [marginLeft, setMarginLeft] = React.useState(0);
  const [width, setWidth] = React.useState(0);
  const wrapper = React.useRef(null);

  React.useEffect(() => {
    if (featured && width) {
      const interval = setInterval(() => {
        let newWidth = marginLeft * -1 < (featured.items.length - 1) * width ? marginLeft - width : 0;
        setMarginLeft(newWidth);
      }, featured.transitionTime * 1000 + 2000);
      return () => clearInterval(interval);
    }
  }, [featured, marginLeft, width]);

  useOnResize(() => {
    if (wrapper.current) {
      setWidth(wrapper.current.offsetWidth);
    }
  });
  console.log('featured: ', featured);
  return (
    <div className="featured-banner-wrapper" ref={wrapper}>
      <div className="featured-banner-rotator" style={{ marginLeft: marginLeft }}>
        {featured &&
          featured.items.map((item, i) => {
            return <img key={i} className="featured-banner-image" src={item.image} style={{ width: width }} />;
          })}
      </div>
    </div>
  );
}
