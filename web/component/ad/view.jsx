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

type Props = {
  type: string,
  uri?: string,
  tileLayout?: boolean,
  shouldShowAds: boolean,
  channelIdWhitelist?: ?any,
  channelId: any,
};

function Ad(props: Props) {
  const { type, uri, tileLayout, shouldShowAds, channelIdWhitelist, channelId } = props;
  const device = useIsMobile() ? 'mobile' : 'desktop';
  const provider = channelIdWhitelist && channelIdWhitelist.includes(channelId) ? 'publir' : 'revcontent';
  const [scriptLoaded, setScriptLoaded] = React.useState(false);

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

        setScriptLoaded(true);

        return () => {
          // $FlowIgnore
          if (script) document.body.removeChild(script);
        };
      } catch (e) {}
    }
  }, [shouldShowAds]);

  return shouldShowAds && scriptLoaded ? (
    <>
      {type === 'tileA' && <AdTileA tileLayout={tileLayout} />}
      {type === 'tileB' && <AdTileB provider={provider} device={device} />}
      {type === 'sticky' && <AdSticky uri={uri} />}
      {type === 'aboveComments' && (
        <AdAboveComments provider={provider} device={device} shouldShowAds={shouldShowAds} />
      )}
    </>
  ) : null;
}

export default Ad;
