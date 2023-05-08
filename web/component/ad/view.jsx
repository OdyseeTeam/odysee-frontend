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
    path: 'https://cdn.jsdelivr.net/npm/prebid.js@7.13/dist/not-for-prod/',
    file: 'prebid.js',
  },
});

type Props = {
  type: string,
  uri?: string,
  tileLayout?: boolean,
  shouldShowAds: boolean,
};

function Ad(props: Props) {
  const { type, uri, tileLayout, shouldShowAds } = props;
  const device = useIsMobile() ? 'mobile' : 'desktop';

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

  return (
    <>
      {type === 'tileA' && <AdTileA tileLayout={tileLayout} />}
      {type === 'tileB' && <AdTileB provider="publir" device={device} />}
      {type === 'sticky' && <AdSticky uri={uri} />}
      {type === 'aboveComments' && <AdAboveComments provider="publir" device={device} shouldShowAds={shouldShowAds} />}
    </>
  );
}

export default Ad;
