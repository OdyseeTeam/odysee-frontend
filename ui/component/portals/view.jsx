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
  portals: any,
  homepageOrder: HomepageOrder,
  // --- perform ---
  doSetClientSetting: (key: string, value: any, push: boolean) => void,
};

export default function Portals(props: Props) {
  const { portals, homepageOrder, doSetClientSetting } = props;
  const [kill, setKill] = React.useState(false);

  if (portals && portals.mainPortal) {
    portals.mainPortal.portals = portals.mainPortal.portals.concat(portals.mainPortal.portals);
    portals.mainPortal.portals = portals.mainPortal.portals.splice(0, 6);
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
      doSetClientSetting(SETTINGS.HOMEPAGE_ORDER, orderToSave, true);
      setKill(true);
    }
  }

  return portals && portals.mainPortal ? (
    <div
      className={classnames('portals-wrapper', { kill: kill })}
      style={{ backgroundImage: 'url(' + portals.mainPortal.background + ')' }}
    >
      <h1>{portals.mainPortal.description}</h1>
      {portals.mainPortal.portals.map((portal, i) => {
        return (
          <div className="portal-wrapper" key={i}>
            <NavLink aria-hidden tabIndex={-1} to={{ pathname: '$/portal/' + portal.name, state: portal }}>
              <div className="portal-thumbnail">
                <img src={portal.image} />
              </div>
              <div className="portal-title">
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
      <div className="portals-remove" onClick={() => removePortals()}>
        <Icon icon={ICONS.REMOVE} />
      </div>
    </div>
  ) : (
    <div className="portals-wrapper">
      <div className="portal-wrapper">
        <div className="portal-thumbnail" />
      </div>
    </div>
  );
}
