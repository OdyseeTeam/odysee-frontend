// @flow
import React from 'react';
import Page from 'component/page';
import { useHistory } from 'react-router';

import './style.scss';
type Props = {
  portal: any,
};

export default function Portal(props: Props) {
  const { portal } = props;

  const { push, location } = useHistory();

  const { pathname } = location;
  console.log('location: ', location);
  const urlParams = new URLSearchParams(location);
  console.log('urlParams: ', urlParams);

  // if(portal) console.log('portal: ', portal)

  return (
    <Page className="portal-wrapper" fullWidthPage>
      <div className="portal-wrapper">
        <h1>dsfedf</h1>
      </div>
    </Page>
  );
}
