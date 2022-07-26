// @flow
import React from 'react';
import { useHistory } from 'react-router-dom';
import useShouldShowAds from 'effects/use-should-show-ads';

// ****************************************************************************
// AdsSticky
// ****************************************************************************

const OUTBRAIN_CONTAINER_KEY = 'outbrainSizeDiv';
let gScript;

type Props = {
  uri: ?string,
  // --- redux ---
  isContentClaim: boolean,
  isChannelClaim: boolean,
  authenticated: ?boolean,
  isAdBlockerFound: ?boolean,
  userHasPremiumPlus: boolean,
  userCountry: string,
  homepageData: any,
  locale: ?LocaleInfo,
  doSetAdBlockerFound: (boolean) => void,
};

export default function AdsSticky(props: Props) {
  const {
    isContentClaim,
    isChannelClaim,
    authenticated,
    isAdBlockerFound,
    userHasPremiumPlus,
    userCountry,
    // homepageData,
    locale,
    doSetAdBlockerFound,
  } = props;

  const { location } = useHistory();
  const [refresh, setRefresh] = React.useState(0);

  // Global condition on whether ads should be activated:
  const shouldShowAds = useShouldShowAds(userHasPremiumPlus, userCountry, isAdBlockerFound, doSetAdBlockerFound);
  // Global conditions aside, should the Sticky be shown for this path:
  const inAllowedPath = shouldShowAdsForPath(location.pathname, isContentClaim, isChannelClaim, authenticated);
  // Final answer:
  const shouldLoadSticky = shouldShowAds && !gScript && !inIFrame();

  function shouldShowAdsForPath(pathname, isContentClaim, isChannelClaim, authenticated) {
    return true;
    // // $FlowIssue: mixed type
    // const pathIsCategory = Object.values(homepageData).some((x) => pathname.startsWith(`/$/${x?.name}`));
    // return pathIsCategory || isChannelClaim || (isContentClaim && !authenticated) || pathname === '/';
  }

  React.useEffect(() => {
    if (shouldLoadSticky) {
      window.googletag = window.googletag || { cmd: [] };

      gScript = document.createElement('script');
      gScript.src = 'https://adncdnend.azureedge.net/adtags/odyseeKp.js';
      gScript.async = true;
      gScript.addEventListener('load', () => setRefresh(Date.now()));
      // $FlowFixMe
      document.getElementsByTagName('head')[0].append(gScript); // Adnim wants it here, but I don't think location matters.
      // document.body.appendChild(gScript);
    }
  }, [shouldLoadSticky]);

  React.useEffect(() => {
    const container = window[OUTBRAIN_CONTAINER_KEY];
    if (container) {
      container.style.display = inAllowedPath ? '' : 'none';
    }
    const ad = document.getElementsByClassName('OUTBRAIN')[0];
    if (ad && locale && !locale.gdpr_required) ad.classList.add('VISIBLE');
  }, [inAllowedPath, refresh]);

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
