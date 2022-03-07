// @flow
import { DOMAIN, SHOW_ADS } from 'config';
import * as PAGES from 'constants/pages';
import React, { useEffect } from 'react';
import { withRouter } from 'react-router';
import I18nMessage from 'component/i18nMessage';
import Button from 'component/button';
import classnames from 'classnames';

// prettier-ignore
const AD_CONFIGS = Object.freeze({
  DEFAULT: {
    url: 'https://cdn.vidcrunch.com/integrations/618bb4d28aac298191eec411/Lbry_Odysee.com_Responsive_Floating_DFP_Rev70_1011.js',
    tag: 'vidcrunchJS537102317',
  },
  MOBILE: {
    url: 'https://cdn.vidcrunch.com/integrations/618bb4d28aac298191eec411/Lbry_Odysee.com_Mobile_Floating_DFP_Rev70_1611.js',
    tag: 'vidcrunchJS199212779',
  },
  EU: {
    url: 'https://tg1.vidcrunch.com/api/adserver/spt?AV_TAGID=61dff05c599f1e20b01085d4&AV_PUBLISHERID=6182c8993c8ae776bd5635e9',
    tag: 'AV61dff05c599f1e20b01085d4',
  },
});

const IS_IOS =
  (/iPad|iPhone|iPod/.test(navigator.platform) ||
    // for iOS 13+ , platform is MacIntel, so use this to test
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
  !window.MSStream;

const IS_ANDROID = /Android/i.test(navigator.userAgent);

const IS_FIREFOX = /Firefox/i.test(navigator.userAgent);

const isFirefoxAndroid = IS_ANDROID && IS_FIREFOX;

type Props = {
  location: { pathname: string },
  type: string,
  small: boolean,
  claim: Claim,
  isMature: boolean,
  authenticated: boolean,
};

function removeIfExists(querySelector) {
  const element = document.querySelector(querySelector);
  if (element) element.remove();
}

function Ads(props: Props) {
  const {
    location: { pathname },
    type = 'video',
    small,
    authenticated,
  } = props;

  const shouldShowAds = SHOW_ADS && !authenticated;
  const mobileAds = IS_ANDROID || IS_IOS;

  // this is populated from app based on location
  const isInEu = localStorage.getItem('gdprRequired') === 'true';
  const adConfig = isInEu ? AD_CONFIGS.EU : mobileAds ? AD_CONFIGS.MOBILE : AD_CONFIGS.DEFAULT;

  // add script to DOM
  useEffect(() => {
    if (isFirefoxAndroid) return;

    if (shouldShowAds) {
      let script;
      try {
        script = document.createElement('script');
        script.src = adConfig.url;
        // $FlowFixMe
        document.head.appendChild(script);

        return () => {
          // $FlowFixMe
          document.head.removeChild(script);

          // clear aniview state to allow ad reload
          delete window.aniplayerPos;
          delete window.storageAni;
          delete window.__VIDCRUNCH_CONFIG_618bb4d28aac298191eec411__;
          delete window.__player_618bb4d28aac298191eec411__;

          // clean DOM elements from ad related elements
          removeIfExists('[src^="https://cdn.vidcrunch.com/618bb4d28aac298191eec411.js"]');
          removeIfExists('[src^="https://player.aniview.com/script/6.1/aniview.js"]');
          removeIfExists('[id^="AVLoaderaniplayer_vidcrunch"]');
          removeIfExists('#av_css_id');
          removeIfExists('#customAniviewStyling');
        };
      } catch (e) {}
    }
  }, []);

  // display to say "sign up to not see these"
  const adsSignInDriver = (
    <I18nMessage
      tokens={{
        log_in_to_domain: (
          <Button
            button="link"
            label={__('Log in to %domain%', { domain: DOMAIN })}
            navigate={`/$/${PAGES.AUTH}?redirect=${pathname}`}
          />
        ),
      }}
    >
      Hate these? %log_in_to_domain% for an ad free experience.
    </I18nMessage>
  );

  // ad shown in the related videos area
  const videoAd = (
    <div className="ads__claim-item">
      <div className="ad__container">
        <div id={adConfig.tag} style={{ display: 'none' }} />
      </div>
      <div
        className={classnames('ads__claim-text', {
          'ads__claim-text--small': small,
        })}
      >
        <div>Ad</div>
        <p>{adsSignInDriver}</p>
      </div>
    </div>
  );

  // homepage ad in a card
  const homepageCardAd = (
    <div className="homepageAdContainer media__thumb" style={{ display: 'none' }}>
      <div id={adConfig.tag} className="homepageAdDiv media__thumb" style={{ display: 'none' }} />
    </div>
  );

  if (!SHOW_ADS) {
    return false;
  }
  // disable ads for firefox android because they don't work properly
  if (isFirefoxAndroid) return false;

  // sidebar ad (in recommended videos)
  if (type === 'video') {
    return videoAd;
  }
  if (type === 'homepage') {
    return homepageCardAd;
  }
}

// returns true if passed element is fully visible on screen
function isScrolledIntoView(el) {
  const rect = el.getBoundingClientRect();
  const elemTop = rect.top;
  const elemBottom = rect.bottom;

  // Only completely visible elements return true:
  const isVisible = elemTop >= 0 && elemBottom <= window.innerHeight;
  return isVisible;
}

async function injectAd(shouldShowAds: boolean) {
  // don't inject on firefox android or for authenticated users or no ads on instance
  if (isFirefoxAndroid || !shouldShowAds) return;
  // test if adblock is enabled
  let adBlockEnabled = false;
  const googleAdUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
  try {
    await fetch(new Request(googleAdUrl)).catch((_) => {
      adBlockEnabled = true;
    });
  } catch (e) {
    adBlockEnabled = true;
  } finally {
    if (!adBlockEnabled) {
      // select the cards on page
      let cards = document.getElementsByClassName('card claim-preview--tile');
      // eslint-disable-next-line no-inner-declarations
      function checkFlag() {
        if (cards.length === 0) {
          window.setTimeout(checkFlag, 100);
        } else {
          // find the last fully visible card
          let lastCard;

          // width of browser window
          const windowWidth = window.innerWidth;

          // on small screens, grab the second item
          if (windowWidth <= 900) {
            lastCard = cards[1];
          } else {
            // otherwise, get the last fully visible card
            for (const card of cards) {
              const isFullyVisible = isScrolledIntoView(card);
              if (!isFullyVisible) break;
              lastCard = card;
            }

            // if no last card was found, just exit the function to not cause errors
            if (!lastCard) return;
          }

          // clone the last card
          // $FlowFixMe
          const clonedCard = lastCard.cloneNode(true);

          // insert cloned card
          // $FlowFixMe
          lastCard.parentNode.insertBefore(clonedCard, lastCard);

          // change the appearance of the cloned card
          // $FlowFixMe
          clonedCard.querySelector('.claim__menu-button').remove();

          // $FlowFixMe
          clonedCard.querySelector('.truncated-text').innerHTML = __(
            'Hate these? Login to Odysee for an ad free experience'
          );

          // $FlowFixMe
          clonedCard.querySelector('.claim-tile__info').remove();

          // $FlowFixMe
          clonedCard.querySelector('[role="none"]').removeAttribute('href');

          // $FlowFixMe
          clonedCard.querySelector('.claim-tile__header').firstChild.href = '/$/signin';

          // $FlowFixMe
          clonedCard.querySelector('.claim-tile__title').firstChild.removeAttribute('aria-label');

          // $FlowFixMe
          clonedCard.querySelector('.claim-tile__title').firstChild.removeAttribute('title');

          // $FlowFixMe
          clonedCard.querySelector('.claim-tile__header').firstChild.removeAttribute('aria-label');

          // $FlowFixMe
          clonedCard
            .querySelector('.media__thumb')
            .replaceWith(document.getElementsByClassName('homepageAdContainer')[0]);

          // show the homepage ad which is not displayed at first
          document.getElementsByClassName('homepageAdContainer')[0].style.display = 'block';

          const thumbnail = window.getComputedStyle(lastCard.querySelector('.media__thumb'));

          const styles = `#av-container, #AVcontent, #aniBox {
              height: ${thumbnail.height} !important;
              width: ${thumbnail.width} !important;
            }`;

          const styleSheet = document.createElement('style');
          styleSheet.type = 'text/css';
          styleSheet.id = 'customAniviewStyling';
          styleSheet.innerText = styles;

          // $FlowFixMe
          document.head.appendChild(styleSheet);

          // delete last card to not introduce layout shifts
          lastCard.remove();

          // addresses bug where ad doesn't show up until a scroll event
          document.dispatchEvent(new CustomEvent('scroll'));
        }
      }
      checkFlag();
    }
  }
}

export default withRouter(Ads);
export { injectAd };
