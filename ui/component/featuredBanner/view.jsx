// @flow
import React from 'react';
import { useOnResize } from 'effects/use-on-resize';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import { NavLink } from 'react-router-dom';

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
      }, featured.transitionTime * 1000 + 1000);
      return () => clearInterval(interval);
    }
  }, [featured, marginLeft, width]);

  useOnResize(() => {
    if (wrapper.current) {
      setWidth(wrapper.current.offsetWidth);
    }
  });
  console.log('featured: ', featured);
  function getUriTo(uri) {
    if (uri.includes('odysee.com')) {
      uri = uri.substring(uri.indexOf('odysee.com') + 10);
    }
    return {
      pathname: uri,
    };
  }

  return (
    <div className="featured-banner-wrapper" ref={wrapper}>
      <div className="featured-banner-remove">
        <Icon icon={ICONS.REMOVE} />
      </div>
      <div className="featured-banner-rotator" style={{ marginLeft: marginLeft }}>
        {featured &&
          featured.items.map((item, i) => {
            return (
              <NavLink
                className="featured-banner-image"
                to={getUriTo(item.url)}
                target={!item.url.includes('odysee.com') ? '_blank' : undefined}
                title={item.label}
                key={i}
                style={{ minWidth: width }}
              >
                <img src={item.image} style={{ width: width }} />
              </NavLink>
            );
          })}
      </div>
    </div>
  );
}
