// @flow
import React from 'react';
import './style.scss';

// prettier-ignore
const AD_CONFIGS = Object.freeze({
  REVCONTENT: {
    url: 'https://assets.revcontent.com/master/delivery.js',
  },
});

type Props = {
  // --- redux ---
  shouldShowAds: boolean,
};

function AdAboveComments(props: Props) {
  const { shouldShowAds } = props;
  const adConfig = AD_CONFIGS.REVCONTENT;
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    if (shouldShowAds && !isActive) {
      let script;
      try {
        const checkExisting = Array.from(document.getElementsByTagName('script')).findIndex((e) => {
          return Boolean(e.src.indexOf('trends.revcontent.com'));
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
  }, [shouldShowAds, adConfig, isActive]);

  return (
    <div
      className="rc_aboveComments"
      id="rc-widget-1d564a"
      data-rc-widget
      data-widget-host="habitat"
      data-endpoint="//trends.revcontent.com"
      data-widget-id="273461"
    />
  );
}

export default AdAboveComments;
