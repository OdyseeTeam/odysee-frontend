// @flow
import React from 'react';
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

export default function Portals(props: Props) {
  const { homepageData, homepageOrder, doSetClientSetting, authenticated } = props;
  const { portals, categories } = homepageData;
  const [hover, setHover] = React.useState(undefined);
  const [kill, setKill] = React.useState(false);

  if (portals && portals.mainPortal) {
    portals.mainPortal.portals = portals.mainPortal.portals.concat(portals.mainPortal.portals);
    portals.mainPortal.portals = portals.mainPortal.portals.splice(0, 6);
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

    // From the saved entries, trim those that no longer exists in the latest (or different) Homepage.
    let activeOrder: Array<string> = savedActiveOrder.filter((x) => sectionKeys.includes(x));
    let hiddenOrder: Array<string> = savedHiddenOrder.filter((x) => sectionKeys.includes(x));

    // Add any new categories found into 'active' ...
    sectionKeys.forEach((key: string) => {
      if (!activeOrder.includes(key) && !hiddenOrder.includes(key)) {
        if (homepageSections[key].hideByDefault) {
          // ... unless it is a 'hideByDefault' category.
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

    // Final check to exclude items that were previously moved to Hidden.
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
    }
    doSetClientSetting(SETTINGS.HOMEPAGE_ORDER, orderToSave, true);
    setKill(true);
  }

  return portals && portals.mainPortal ? (
    <div
      className={classnames('portals-wrapper', { kill: kill })}
      style={{ backgroundImage: 'url(' + portals.mainPortal.background + ')' }}
    >
      <h1>{portals.mainPortal.description}</h1>
      {portals.mainPortal.portals.map((portal, i) => {
        return (
          <div
            className="portal-wrapper"
            key={i}
            onMouseEnter={() => setHover(portal.name)}
            onMouseLeave={() => setHover(undefined)}
          >
            <NavLink aria-hidden tabIndex={-1} to={{ pathname: '$/portal/' + portal.name, state: portal }}>
              <div
                className="portal-thumbnail"
                style={{
                  background: `rgba(` + portal.css.rgb + `,` + (hover === portal.name ? 1 : 0.8) + `)`,
                  border: `2px solid rgba(` + portal.css.rgb + `,1)`,
                }}
              >
                <img src={portal.image} />
              </div>
              <div className="portal-title" style={{ border: `2px solid rgba(` + portal.css.rgb + `,1)` }}>
                <label>{portal.label}</label>
              </div>
            </NavLink>
          </div>
        );
      })}
      {/*
        <div className="portal-browse left">‹</div>
        <div className="portal-browse right">›</div>

        <div className="portal-page-indicator">
          <div />
          <div />
          <div />
          <div />
        </div>
      */}
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
