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
  homepageData?: any,
  claim: boolean,
};

function Ad(props: Props) {
  const { type, uri, tileLayout, shouldShowAds, homepageData, claim } = props;
  const { categories } = homepageData;
  const device = useIsMobile() ? 'mobile' : 'desktop';
  const channelId =
    claim && claim.value_type === 'channel' ? claim.claim_id : claim ? claim.signing_channel?.claim_id : undefined;

  const channeldWhitelist = React.useMemo(() => {
    if (claim && categories) {
      let channels = [];
      for (let category in categories) {
        if (categories[category].channelIds) {
          for (let channel of categories[category].channelIds) {
            if (!channels.includes(channel)) {
              channels.push(channel);
            }
          }
        }
      }
      return channels;
    }
  }, [categories, claim]);

  const provider = channeldWhitelist && channeldWhitelist.includes(channelId) ? 'publir' : 'revcontent';

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
