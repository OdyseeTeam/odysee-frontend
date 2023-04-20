// @flow
import React from 'react';
import { lazyImport } from 'util/lazyImport';

const AdTileA = lazyImport(() => import('./tileA' /* webpackChunkName: "adTileA" */));
const AdTileB = lazyImport(() => import('./tileB' /* webpackChunkName: "adTileB" */));
const AdSticky = lazyImport(() => import('./sticky' /* webpackChunkName: "adSticky" */));
const AdAboveComments = lazyImport(() => import('./aboveComments' /* webpackChunkName: "adAboveComments" */));

type Props = {
  type: string,
  tileLayout?: boolean,
};

function Ad(props: Props) {
  const { type, tileLayout } = props;

  return (
    <>
      {type === 'tileA' && <AdTileA tileLayout={tileLayout} />}
      {type === 'tileB' && <AdTileB />}
      {type === 'sticky' && <AdSticky />}
      {type === 'aboveComments' && <AdAboveComments />}
    </>
  );
}

export default Ad;
