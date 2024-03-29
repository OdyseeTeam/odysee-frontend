// @flow
import React, { memo } from 'react';
import AdTileA from './tileA';
import AdTileB from './tileB';
import AdSticky from './adSticky';
import AdAboveComments from './aboveComments';
import AdBelowLivestream from './belowLivestream';
import AdErrorBoundary from './adErrorBoundary';
// import { useIsMobile } from 'effects/use-screensize';

// ****************************************************************************
// ****************************************************************************

export type Props = {|
  type: 'tileA' | 'tileB' | 'sticky' | 'aboveComments' | 'belowLivestream',
  uri?: ClaimUri,
  tileLayout?: boolean,
|};

type StateProps = {|
  adBlockerFound: boolean,
  shouldShowAds: boolean,
  // channelIdWhitelist?: ?any,
  channelId: ?ChannelId,
|};

type DispatchProps = {||};

// ****************************************************************************
// ****************************************************************************

// $FlowIgnore
const Ad = memo(function Ad(props: Props & StateProps & DispatchProps) {
  const { type, uri, tileLayout, adBlockerFound, shouldShowAds } = props;
  const provider = 'rumble'; // 'revcontent' | 'rumble'

  if (!shouldShowAds && adBlockerFound !== true) {
    return null;
  } else if (adBlockerFound && type !== 'tileA') {
    return null;
  }

  return (
    <AdErrorBoundary type={type}>
      {type === 'tileA' && <AdTileA provider={provider} tileLayout={tileLayout} />}
      {type === 'tileB' && <AdTileB provider={provider} shouldShowAds={shouldShowAds} />}
      {type === 'sticky' && <AdSticky provider={provider} uri={uri} />}
      {type === 'aboveComments' && <AdAboveComments provider={provider} shouldShowAds={shouldShowAds} />}
      {type === 'belowLivestream' && <AdBelowLivestream provider={provider} shouldShowAds={shouldShowAds} />}
    </AdErrorBoundary>
  );
});

export default Ad;
