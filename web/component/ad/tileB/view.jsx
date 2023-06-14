// @flow
import React from 'react';
import classnames from 'classnames';
import { importPublir } from '../util/importPublir';

const PublirAdsProvider = importPublir('PublirAdsProvider');
const AdSlot = importPublir('AdSlot');

// prettier-ignore
const AD_CONFIG = Object.freeze({
  PUBLIR: {
    slotId: {
      desktop: 'div-hre-Odysee-3293',
      mobile: 'div-hre-Odysee-3293',
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

function AdTileB(props: Props) {
  const { provider, device, shouldShowAds } = props;
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    if (shouldShowAds) {
      let script;
      try {
        script = document.createElement('script');
        script.src = AD_CONFIG.REVCONTENT.url;
        script.defer = true;
        // $FlowIgnore
        document.body.appendChild(script);
        setInterval(() => {
          setIsActive(true);
        }, 1000);
      } catch (e) {}

      return () => {
        // $FlowIgnore
        if (script) document.body.removeChild(script);
      };
    }
  }, [shouldShowAds]);

  return (
    <>
      {provider === 'revcontent' && (
        <div
          className={classnames('rc_tileB', {
            'show-rc_tile': isActive,
          })}
          id="rc-widget-952c79"
          data-rc-widget
          data-widget-host="habitat"
          data-endpoint="//trends.revcontent.com"
          data-widget-id="274791"
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

export default AdTileB;
