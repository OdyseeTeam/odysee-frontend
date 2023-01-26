// @flow
import React from 'react';
// import PremiumPlusTile from 'component/premiumPlusTile';
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
  doSetAdBlockerFound: (boolean) => void,
};

function AdTileB(props: Props) {
  const { shouldShowAds } = props;
  // const isMobile = useIsMobile();
  // const [isActive, setIsActive] = React.useState(false);
  // const ref = React.useRef();
  React.useEffect(() => {
    if (shouldShowAds && !DISABLE_VIDEO_AD) {
      let script;
      try {
        script = document.createElement('script');
        script.src = AD_CONFIG.url;
        script.defer = 'defer';
        // $FlowIgnore
        document.body.appendChild(script);
        // setIsActive(true)
      } catch (e) {}

      return () => {
        // $FlowIgnore
        if (script) document.body.removeChild(script);
      };
    }
  }, [shouldShowAds, AD_CONFIG]);

  /*
  React.useEffect(() => {
    if (ref.current) {
      const mountedStyle = getComputedStyle(ref.current);
      doSetAdBlockerFound(mountedStyle?.display === 'none');
    }
  }, []);
  */

  return (
    <div
      id="rc-widget-952c79"
      data-rc-widget
      data-widget-host="habitat"
      data-endpoint="//trends.revcontent.com"
      data-widget-id="274791"
    >
      <h1>dsjgfsdaf</h1>
    </div>
  );
}

export default AdTileB;
