// @flow
import React from 'react';
// import { useHistory } from 'react-router-dom';
// import analytics from 'analytics';
import './style.scss';

// ****************************************************************************
// AdsSticky
// ****************************************************************************

const OUTBRAIN_CONTAINER_KEY = 'outbrainSizeDiv';
// let gScript;

type Props = {
  uri: ?string,
  // --- redux ---
  isContentClaim: boolean,
  isChannelClaim: boolean,
  authenticated: ?boolean,
  shouldShowAds: boolean,
  homepageData: any,
  locale: ?LocaleInfo,
  nagsShown: boolean,
};

export default function AdsSticky(props: Props) {
  const {
    isContentClaim,
    isChannelClaim,
    authenticated,
    shouldShowAds, // Global condition on whether ads should be activated
    homepageData,
    locale,
    nagsShown,
  } = props;

  const inAllowedPath = shouldShowAdsForPath(location.pathname, isContentClaim, isChannelClaim, authenticated);
  const [isActive, setIsActive] = React.useState(false);
  // const [refresh, setRefresh] = React.useState(0);

  function shouldShowAdsForPath(pathname, isContentClaim, isChannelClaim, authenticated) {
    // $FlowIssue: mixed type
    const pathIsCategory = Object.values(homepageData).some((x) => pathname.startsWith(`/$/${x?.name}`));
    return pathIsCategory || isChannelClaim || isContentClaim || pathname === '/';
  }

  React.useEffect(() => {
    const container = window[OUTBRAIN_CONTAINER_KEY];
    if (container) {
      container.style.display = inAllowedPath ? '' : 'none';
    }
    const ad = document.getElementsByClassName('rev-shifter')[0];
    if (ad && locale && !locale.gdpr_required && !nagsShown) ad.classList.add('VISIBLE');
  }, [inAllowedPath]);

  const AD_CONFIGS = Object.freeze({
    REVCONTENT: {
      url: '//labs-cdn.revcontent.com/build/revshifter.min.js',
    },
  });

  React.useEffect(() => {
    if (shouldShowAds && !isActive) {
      let script;
      try {
        const checkExisting =
          Array.from(document.getElementsByTagName('script')).findIndex(
            (e) => e.src.indexOf('revshifter.min.js') !== -1
          ) !== -1
            ? true
            : false;

        if (!checkExisting) {
          script = document.createElement('script');
          script.src = AD_CONFIGS.REVCONTENT.url;
          // $FlowIgnore
          document.body.appendChild(script);
        } else {
          setIsActive(true);
        }

        const ad = document.getElementsByClassName('rev-shifter');
        if (!ad.length) {
          new RevShifter({
            api_key: 'eb84aa29c0184b36009acb485dd8c48dad694e7b',
            pub_id: 176372,
            widget_id: 273433,
            domain: 'odysee.com',
            show_on_touch: false,
            show_on_scroll: false,
            show_on_load: true,
            text_right: true,
            per_row: {
              xxs: 1,
              xs: 2,
              sm: 2,
              md: 3,
              lg: 4,
              xl: 5,
              xxl: 5,
            },
            max_headline: false,
            devices: ['phone', 'tablet', 'desktop'],
          });
        }

        return () => {
          // $FlowIgnore
          if (script) document.body.removeChild(script);
        };
      } catch (e) {}
    }
  }, [shouldShowAds, AD_CONFIGS, isActive]);

  return null; // Nothing for us to mount; the ad script will handle everything.
}

// ****************************************************************************
// Helpers
// ****************************************************************************

function inIFrame() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}
