// @flow
import React from 'react';
import AdTileA from './tileA';
import AdTileB from './tileB';
import AdSticky from './sticky';
import AdAboveComments from './aboveComments';

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
