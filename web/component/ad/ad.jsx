// @flow
import React from 'react';
import AdTileA from './tileA';
import AdTileB from './tileB';
import AdSticky from './adSticky';
import AdAboveComments from './aboveComments';

type Props = {
  type: string,
  uri?: string,
  tileLayout?: boolean,
};

function Ad(props: Props) {
  const { type, uri, tileLayout } = props;

  return (
    <>
      {type === 'tileA' && <AdTileA tileLayout={tileLayout} />}
      {type === 'tileB' && <AdTileB />}
      {type === 'sticky' && <AdSticky uri={uri} />}
      {type === 'aboveComments' && <AdAboveComments />}
    </>
  );
}

export default Ad;
