// @flow
import React from 'react';
import AdTileA from './tileA';
import AdTileB from './tileB';
import AdSticky from './adSticky';
import AdAboveComments from './aboveComments';
import AdErrorBoundary from './adErrorBoundary';
// import { useIsMobile } from 'effects/use-screensize';

// ****************************************************************************
// ****************************************************************************

export type Props = {|
  type: 'tileA' | 'tileB' | 'sticky' | 'aboveComments',
  uri?: ClaimUri,
  tileLayout?: boolean,
|};

type StateProps = {|
  shouldShowAds: boolean,
  // channelIdWhitelist?: ?any,
  channelId: ?ChannelId,
|};

type DispatchProps = {||};

// ****************************************************************************
// ****************************************************************************

function Ad(props: Props & StateProps & DispatchProps) {
  // const { type, uri, tileLayout, shouldShowAds, channelIdWhitelist, channelId } = props;
  const { type, uri, tileLayout, shouldShowAds } = props;
  // const device = useIsMobile() ? 'mobile' : 'desktop';
  // const provider = channelIdWhitelist && channelIdWhitelist.includes(channelId) ? 'clean' : 'revcontent';
  const provider = 'revcontent';

  if (!shouldShowAds) {
    return null;
  }

  return (
    <AdErrorBoundary type={type}>
      {type === 'tileA' && <AdTileA tileLayout={tileLayout} />}
      {type === 'tileB' && <AdTileB provider={provider} shouldShowAds={shouldShowAds} />}
      {type === 'sticky' && <AdSticky uri={uri} />}
      {type === 'aboveComments' && <AdAboveComments provider={provider} shouldShowAds={shouldShowAds} />}
    </AdErrorBoundary>
  );
}

export default Ad;
