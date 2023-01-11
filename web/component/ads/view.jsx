// @flow
import React from 'react';
import PremiumPlusTile from 'component/premiumPlusTile';
import './style.scss';

const DISABLE_VIDEO_AD = false;

// prettier-ignore
const AD_CONFIG = Object.freeze({
  url: 'https://assets.revcontent.com/master/delivery.js',
});

// ****************************************************************************
// Ads
// ****************************************************************************

type Props = {
  type: string,
  tileLayout?: boolean,
  small?: boolean,
  className?: string,
  noFallback?: boolean,
  // --- redux ---
  shouldShowAds: boolean,
};

function Ads(props: Props) {
  const { type = 'video', tileLayout, shouldShowAds, noFallback } = props;
  // const isMobile = useIsMobile();
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    if (shouldShowAds && !DISABLE_VIDEO_AD && !isActive) {
      let script;
      try {
        script = document.createElement('script');
        script.src = AD_CONFIG.url;
        // $FlowIgnore
        document.body.appendChild(script);
        // setIsActive(true)
      } catch (e) {}

      return () => {
        // $FlowIgnore
        if (script) document.body.removeChild(script);
      };
    }
  }, [shouldShowAds, AD_CONFIG, isActive]);

  if (type === 'video') {
    if (shouldShowAds) {
      return (
        <li className="claim-preview--tile">
          <div
            className="rc_tile"
            id="rc-widget-fceddd"
            data-rc-widget
            data-widget-host="habitat"
            data-endpoint="//trends.revcontent.com"
            data-widget-id="273434"
          />
        </li>
      );
    } else if (!noFallback) {
      return <PremiumPlusTile tileLayout={tileLayout} />;
    }
  }

  return null;
}

export default Ads;
