// @flow
import React from 'react';
import AdTileA from './tileA';
import AdTileB from './tileB';
import AdSticky from './adSticky';
import AdAboveComments from './aboveComments';
import { useIsMobile } from 'effects/use-screensize';

const AD_CONFIG = Object.freeze({
  PUBLIR: {
    active: true,
    path: 'https://a.publir.com/platform/common/',
    file: 'prebid736.js',
  },
});

// ****************************************************************************
// ****************************************************************************

export type Props = {|
  type: 'tileA' | 'tileB' | 'sticky' | 'aboveComments',
  uri?: ClaimUri,
  tileLayout?: boolean,
|};

type StateProps = {|
  shouldShowAds: boolean,
  channelIdWhitelist?: ?any,
  channelId: ?ChannelId,
|};

type DispatchProps = {||};

// ****************************************************************************
// ****************************************************************************

function Ad(props: Props & StateProps & DispatchProps) {
  const { type, uri, tileLayout, shouldShowAds, channelIdWhitelist, channelId } = props;
  const device = useIsMobile() ? 'mobile' : 'desktop';
  const provider = channelIdWhitelist && channelIdWhitelist.includes(channelId) ? 'publir' : 'revcontent';

  React.useEffect(() => {
    if (shouldShowAds && AD_CONFIG.PUBLIR.active) {
      let script;
      try {
        let checkExisting = false;
        Array.from(document.getElementsByTagName('script')).findIndex((e) => {
          if (e.src.indexOf(AD_CONFIG.PUBLIR.file) !== -1) {
            checkExisting = true;
          }
        });

        if (!checkExisting) {
          script = document.createElement('script');
          script.src = AD_CONFIG.PUBLIR.path + AD_CONFIG.PUBLIR.file;
          // $FlowIgnore
          document.body.appendChild(script);
        }

        return () => {
          // $FlowIgnore
          if (script) document.body.removeChild(script);
        };
      } catch (e) {}
    }
  }, [shouldShowAds]);

  if (!shouldShowAds) {
    return null;
  }

  return (
    <>
      {type === 'tileA' && <AdTileA tileLayout={tileLayout} />}
      {type === 'tileB' && <AdTileB provider={provider} device={device} />}
      {type === 'sticky' && <AdSticky uri={uri} />}
      {type === 'aboveComments' && (
        <AdAboveComments provider={provider} device={device} shouldShowAds={shouldShowAds} />
      )}
    </>
  );
}

export default Ad;
