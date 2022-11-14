// @flow
import React from 'react';
import { useOnResize } from 'effects/use-on-resize';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import * as SETTINGS from 'constants/settings';
import classnames from 'classnames';
import { NavLink } from 'react-router-dom';
import './style.scss';

type HomepageOrder = { active: ?Array<string>, hidden: ?Array<string> };

type Props = {
  homepageData: any,
  homepageOrder: HomepageOrder,
  authenticated: boolean,
  // --- perform ---
  doSetClientSetting: (key: string, value: any, push: boolean) => void,
};

export default function FeaturedBanner(props: Props) {
  const { homepageData, homepageOrder, authenticated, doSetClientSetting } = props;
  const { featured, categories } = homepageData;
  const [marginLeft, setMarginLeft] = React.useState(0);
  const [width, setWidth] = React.useState(0);
  const [index, setIndex] = React.useState(1);
  const [pause, setPause] = React.useState(false);
  const [kill, setKill] = React.useState(false);
  const wrapper = React.useRef(null);

  React.useEffect(() => {
    if (featured && width) {
      const interval = setInterval(() => {
        if (!pause) {
          setIndex(index + 1 <= featured.items.length ? index + 1 : 1);
        }
      }, featured.transitionTime * 1000 + 1000);
      return () => clearInterval(interval);
    }
  }, [featured, marginLeft, width, pause, index]);

  React.useEffect(() => {
    if (featured && width) {
      setMarginLeft((index - 1) * (width * -1));
    }
  }, [featured, index, width]);

  useOnResize(() => {
    if (wrapper.current) {
      setWidth(wrapper.current.offsetWidth);
    }
  });

  function getUriTo(uri) {
    if (uri.includes('odysee.com')) {
      uri = uri.substring(uri.indexOf('odysee.com') + 10);
    }
    return {
      pathname: uri,
    };
  }

  const NON_CATEGORY = Object.freeze({
    BANNER: { label: 'Banner' },
    FOLLOWING: { label: 'Following' },
    PORTALS: { label: 'Portals' },
    FYP: { label: 'Recommended' },
  });

  function getInitialList(listId, savedOrder, homepageSections) {
    const savedActiveOrder = savedOrder.active || [];
    const savedHiddenOrder = savedOrder.hidden || [];
    const sectionKeys = Object.keys(homepageSections);

    let activeOrder: Array<string> = savedActiveOrder.filter((x) => sectionKeys.includes(x));
    let hiddenOrder: Array<string> = savedHiddenOrder.filter((x) => sectionKeys.includes(x));

    sectionKeys.forEach((key: string) => {
      if (!activeOrder.includes(key) && !hiddenOrder.includes(key)) {
        if (homepageSections[key].hideByDefault) {
          hiddenOrder.push(key);
        } else {
          if (key === 'BANNER') {
            // Skip
          } else if (key === 'PORTALS') {
            activeOrder.splice(2, 0, key);
          } else {
            activeOrder.push(key);
          }
        }
      }
    });
    activeOrder = activeOrder.filter((x) => !hiddenOrder.includes(x));
    return listId === 'ACTIVE' ? activeOrder : hiddenOrder;
  }

  function removeBanner() {
    let orderToSave = homepageOrder;
    if (orderToSave.active && orderToSave.active.includes('BANNER')) {
      orderToSave.active.splice(orderToSave.active.indexOf('BANNER'), 1);
      if (orderToSave.hidden) {
        orderToSave.hidden.push('BANNER');
      } else {
        orderToSave.hidden = ['BANNER'];
      }
    } else if (!orderToSave.hidden) {
      console.log('5');
      const SECTIONS = { ...NON_CATEGORY, ...categories };
      orderToSave = { active: [], hidden: [] };
      orderToSave.active = getInitialList('ACTIVE', homepageOrder, SECTIONS);
      orderToSave.hidden = getInitialList('HIDDEN', homepageOrder, SECTIONS);
      orderToSave.hidden.push('BANNER');
    }
    doSetClientSetting(SETTINGS.HOMEPAGE_ORDER, orderToSave, true);
    setKill(true);
  }

  return (
    <div
      className={classnames('featured-banner-wrapper', { kill: kill })}
      ref={wrapper}
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
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
                <img
                  src={'https://thumbnails.odycdn.com/optimize/s:1735:0/quality:95/plain/' + item.image}
                  style={{ width: width }}
                />
              </NavLink>
            );
          })}
      </div>
      <div className="banner-browse left" onClick={() => setIndex(index > 1 ? index - 1 : featured.items.length)}>
        ‹
      </div>
      <div className="banner-browse right" onClick={() => setIndex(index < featured.items.length ? index + 1 : 1)}>
        ›
      </div>
      <div className="banner-active-indicator">
        {featured &&
          featured.items.map((item, i) => {
            return (
              <div
                key={i}
                className={i + 1 === index ? 'banner-active-indicator-active' : ''}
                onClick={() => setIndex(i + 1)}
              />
            );
          })}
      </div>
      {authenticated && (
        <div className="featured-banner-remove" onClick={() => removeBanner()}>
          <Icon icon={ICONS.REMOVE} />
        </div>
      )}
    </div>
  );
}
