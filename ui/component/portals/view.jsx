// @flow
import React from 'react';
import { NavLink } from 'react-router-dom';
import './style.scss';
type Props = {
  portals: any,
};

export default function Portals(props: Props) {
  const { portals } = props;

  if (portals && portals.mainPortal) {
    portals.mainPortal.portals = portals.mainPortal.portals.concat(portals.mainPortal.portals);
    portals.mainPortal.portals = portals.mainPortal.portals.splice(0, 6);
  }

  console.log(portals);
  return portals && portals.mainPortal ? (
    <div className="portals-wrapper" style={{ backgroundImage: 'url(' + portals.mainPortal.background + ')' }}>
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
      <div className="portal-browse left">‹</div>
      <div className="portal-browse right">›</div>

      <div className="portal-page-indicator">
        <div />
        <div />
        <div />
        <div />
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
