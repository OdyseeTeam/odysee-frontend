// @flow
import React from 'react';
import { NavLink, withRouter } from 'react-router-dom';
import './style.scss';
type Props = {
  portals: any,
};

export default function Portals(props: Props) {
  const { portals } = props;

  if (portals) console.log('portals: ', portals.mainPortal);

  return portals && portals.mainPortal ? (
    <div className="portals-wrapper">
      <h1>{portals.mainPortal.description}</h1>
      {portals.mainPortal.portals.map((portal) => {
        return (
          <NavLink aria-hidden tabIndex={-1} to={{ pathname: '$/portal/' + portal.name, state: 'test' }}>
            <div className="portal-wrapper">
              <div className="portal-thumbnail">
                <img src={portal.image} />
              </div>
              <div className="portal-title">
                <label>{portal.label}</label>
              </div>
            </div>
          </NavLink>
        );
      })}
    </div>
  ) : (
    <h1>Loading</h1>
  );
}
