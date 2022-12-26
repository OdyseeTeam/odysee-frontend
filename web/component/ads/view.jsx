// @flow
// import * as PAGES from 'constants/pages';
import React from 'react';
// import I18nMessage from 'component/i18nMessage';
// import Button from 'component/button';
import PremiumPlusTile from 'component/premiumPlusTile';
// import classnames from 'classnames';
// import Icon from 'component/common/icon';
// import * as ICONS from 'constants/icons';
// import { useIsMobile } from 'effects/use-screensize';
import './style.scss';

const DISABLE_VIDEO_AD = false;

// prettier-ignore
const AD_CONFIGS = Object.freeze({
  ADNIMATION: {
    url: 'https://tg1.aniview.com/api/adserver/spt?AV_TAGID=6252bb6f28951333ec10a7a6&AV_PUBLISHERID=601d9a7f2e688a79e17c1265',
    tag: 'AV6252bb6f28951333ec10a7a6',
  },
  REVCONTENT: {
    url: 'https://assets.revcontent.com/master/delivery.js',
  },
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
  // const adConfig = AD_CONFIGS.ADNIMATION;
  const adConfig = AD_CONFIGS.REVCONTENT;
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    // let test = Boolean(document.getElementsByClassName('rc_tile')[0])
    if (shouldShowAds && !DISABLE_VIDEO_AD && !isActive) {
      let script;
      try {
        /*
        const checkExisting = Array.from(document.getElementsByTagName('script')).findIndex(
          (e) => e.src.indexOf('trends.revcontent.com') !== -1
        ) !== -1 ? true : false;
        */

        script = document.createElement('script');
        script.src = adConfig.url;
        // $FlowIgnore
        document.body.appendChild(script);
        // setIsActive(true)
      } catch (e) {}

      return () => {
        // $FlowIgnore
        if (script) document.body.removeChild(script);
      };
    }
  }, [shouldShowAds, adConfig, isActive]);

  if (type === 'video') {
    if (shouldShowAds) {
      return (
        <div
          className="rc_tile"
          id="rc-widget-fceddd"
          data-rc-widget
          data-widget-host="habitat"
          data-endpoint="//trends.revcontent.com"
          data-widget-id="273434"
        />
      );
    } else if (!noFallback) {
      return <PremiumPlusTile tileLayout={tileLayout} />;
    }
  }

  return null;
}

export default Ads;
