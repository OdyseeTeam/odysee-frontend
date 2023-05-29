// @flow
import React from 'react';
import { importPublir } from '../util/importPublir';

const PublirAdsProvider = importPublir('PublirAdsProvider');
const AdSlot = importPublir('AdSlot');

// prettier-ignore
const AD_CONFIG = Object.freeze({
  PUBLIR: {
    slotId: {
      desktop: 'div-hre-Odysee-3291',
      mobile: 'div-hre-Odysee-3297',
    },
  },
  REVCONTENT: {
    url: 'https://assets.revcontent.com/master/delivery.js',
  },
});

type Props = {
  provider: string,
  device: string,
  shouldShowAds: boolean,
};

function AdAboveComments(props: Props) {
  const { provider, device, shouldShowAds } = props;
  const adConfig = AD_CONFIG.REVCONTENT;
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    if (provider === 'revcontent') {
      if (shouldShowAds && !isActive) {
        let script;
        try {
          let checkExisting = false;
          Array.from(document.getElementsByTagName('script')).findIndex((e) => {
            if (e.src.indexOf('trends.revcontent.com') !== -1) {
              checkExisting = true;
            }
          });

          if (!checkExisting) {
            script = document.createElement('script');
            script.src = adConfig.url;
            // $FlowIgnore
            document.body.appendChild(script);
          } else {
            setIsActive(true);
          }

          return () => {
            // $FlowIgnore
            if (script) document.body.removeChild(script);
          };
        } catch (e) {}
      }
    }
  }, [shouldShowAds, adConfig, isActive, provider]);

  return (
    <>
      {provider === 'revcontent' && (
        <div
          className="rc_aboveComments"
          id="rc-widget-1d564a"
          data-rc-widget
          data-widget-host="habitat"
          data-endpoint="//trends.revcontent.com"
          data-widget-id="273461"
        />
      )}
      {provider === 'publir' && (
        <React.Suspense fallback={null}>
          <PublirAdsProvider publisherId="1391">
            <AdSlot id={AD_CONFIG.PUBLIR.slotId[device]} />
          </PublirAdsProvider>
        </React.Suspense>
      )}
    </>
  );
}

export default AdAboveComments;
