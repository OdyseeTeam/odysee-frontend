// @flow
import React from 'react';
// import PremiumPlusTile from 'component/premiumPlusTile';
import classnames from 'classnames';
import './style.scss';

const DISABLE_VIDEO_AD = false;

// prettier-ignore
const AD_CONFIG = Object.freeze({
  url: 'https://assets.revcontent.com/master/delivery.js',
});

type Props = {
  // --- redux ---
  shouldShowAds: boolean,
};

function AdTileB(props: Props) {
  const { shouldShowAds } = props;
  const [isActive, setIsActive] = React.useState(false);
  // const ref = React.useRef();
  React.useEffect(() => {
    if (shouldShowAds && !DISABLE_VIDEO_AD) {
      let script;
      try {
        script = document.createElement('script');
        script.src = AD_CONFIG.url;
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
  }, [shouldShowAds, AD_CONFIG]);

  return (
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
  );
}

export default AdTileB;
