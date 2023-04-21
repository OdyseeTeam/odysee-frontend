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
  activePortal: number,
  // --- perform ---
  doSetClientSetting: (key: string, value: any, push: boolean) => void,
};

export default function Portals(props: Props) {
  const { homepageData, homepageOrder, doSetClientSetting, authenticated, activePortal } = props;
  const { portals, categories } = homepageData;

  const [width, setWidth] = React.useState(0);
  const [tileWidth, setTileWidth] = React.useState(0);
  const [tileNum, setTileNum] = React.useState(0);
  const [marginLeft, setMarginLeft] = React.useState(0);
  const [index, setIndex] = React.useState(1);
  const [pause, setPause] = React.useState(false);
  const [hover, setHover] = React.useState(undefined);
  const rotate = portals.mainPortal.portals.length > tileNum;

  const [kill, setKill] = React.useState(false);
  const wrapper = React.useRef(null);

  const imageWidth = width >= 1600 ? 1700 : width >= 1150 ? 1150 : width >= 900 ? 900 : width >= 600 ? 600 : 400;

  React.useEffect(() => {
    if (rotate && portals && width) {
      const interval = setInterval(() => {
        if (!pause) {
          setIndex(index + 1 <= portals.mainPortal.portals.length - (tileNum - 1) ? index + 1 : 1);
        }
      }, 5000 + 1000);
      return () => clearInterval(interval);
    }
  }, [rotate, portals, tileNum, marginLeft, width, pause, index]);

  React.useEffect(() => {
    if (portals && width) {
      setMarginLeft((index - 1) * (tileWidth * -1));
    }
  }, [portals, index, width]);

  useOnResize(() => {
    if (wrapper.current) {
      let wrapperWidth = wrapper.current.offsetWidth + 12;
      let tileNum = wrapperWidth > 954 ? 6 : wrapperWidth > 870 ? 5 : wrapperWidth > 470 ? 3 : 2;
      if (tileNum === 6 && portals.mainPortal.portals.length < 9) {
        tileNum = portals.mainPortal.portals.length;
      }
      setWidth(wrapperWidth);
      setTileNum(tileNum);
      setTileWidth(wrapperWidth / tileNum);
    }
  });

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
            activeOrder.unshift(key);
          } else if (key === 'PORTALS') {
            // Skip
          } else {
            activeOrder.push(key);
          }
        }
      }
    });
    activeOrder = activeOrder.filter((x) => !hiddenOrder.includes(x));
    return listId === 'ACTIVE' ? activeOrder : hiddenOrder;
  }

  function removePortals() {
    let orderToSave = homepageOrder;
    if (orderToSave.active && orderToSave.active.includes('PORTALS')) {
      orderToSave.active.splice(orderToSave.active.indexOf('PORTALS'), 1);
      if (orderToSave.hidden) {
        orderToSave.hidden.push('PORTALS');
      } else {
        orderToSave.hidden = ['PORTALS'];
      }
    } else if (!orderToSave.hidden) {
      const SECTIONS = { ...NON_CATEGORY, ...categories };
      orderToSave = { active: [], hidden: [] };
      orderToSave.active = getInitialList('ACTIVE', homepageOrder, SECTIONS);
      orderToSave.hidden = getInitialList('HIDDEN', homepageOrder, SECTIONS);
      orderToSave.hidden.push('PORTALS');
    } else if (orderToSave.hidden && !orderToSave.hidden.includes('PORTALS')) {
      orderToSave.hidden.push('PORTALS');
    }
    doSetClientSetting(SETTINGS.HOMEPAGE_ORDER, orderToSave, true);
    setKill(true);
  }

  return portals && portals.mainPortal ? (
    <div
      id="portals"
      className={classnames('portals-wrapper', { kill: kill })}
      style={{
        backgroundImage:
          'url(https://thumbnails.odycdn.com/optimize/s:' +
          imageWidth +
          ':0/quality:95/plain/' +
          portals.mainPortal.background +
          ')',
      }}
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      <h1>{portals.mainPortal.description}</h1>
      <div className="portal-rotator" style={{ marginLeft: marginLeft }} ref={wrapper}>
        {portals.mainPortal.portals.map((portal, i) => {
          return (
            <div
              className={classnames('portal-wrapper', { disabled: portal.name === activePortal })}
              style={{ width: tileWidth - 12, minWidth: tileWidth - 12 }}
              key={i}
              onMouseEnter={() => setHover(portal.name)}
              onMouseLeave={() => setHover(undefined)}
            >
              <NavLink aria-hidden tabIndex={-1} to={{ pathname: '/$/portal/' + portal.name, state: portal }}>
                <div
                  className="portal-thumbnail"
                  style={{
                    background: `rgba(` + portal.css.rgb + `,` + (hover === portal.name ? 1 : 0.8) + `)`,
                    border: `2px solid rgba(` + portal.css.rgb + `,1)`,
                  }}
                >
                  <img
                    style={{ width: tileWidth - 12, height: tileWidth - 12 }}
                    src={'https://thumbnails.odycdn.com/optimize/s:237:0/quality:95/plain/' + portal.image}
                  />
                </div>
                <div className="portal-title" style={{ border: `2px solid rgba(` + portal.css.rgb + `,1)` }}>
                  <label>{portal.label}</label>
                </div>
              </NavLink>
            </div>
          );
        })}
      </div>
      {portals.mainPortal.portals.length > tileNum && (
        <>
          <div
            className="portal-browse left"
            onClick={() => setIndex(index > 1 ? index - 1 : portals.mainPortal.portals.length - (tileNum - 1))}
          >
            ‹
          </div>
          <div
            className="portal-browse right"
            onClick={() => setIndex(index + (tileNum - 1) < portals.mainPortal.portals.length ? index + 1 : 1)}
          >
            ›
          </div>
          <div className="portal-active-indicator">
            {portals &&
              portals.mainPortal.portals.map((item, i) => {
                return (
                  i < portals.mainPortal.portals.length - (tileNum - 1) && (
                    <div
                      key={i}
                      className={i + 1 === index ? 'portal-active-indicator-active' : ''}
                      onClick={() => setIndex(i + 1)}
                    />
                  )
                );
              })}
          </div>
        </>
      )}
      {authenticated && (
        <div className="portals-remove" onClick={() => removePortals()}>
          <Icon icon={ICONS.REMOVE} />
        </div>
      )}
    </div>
  ) : (
    <div className="portals-wrapper">
      <div className="portal-wrapper">
        <div className="portal-thumbnail" />
      </div>
    </div>
  );
}
