// @flow
import * as React from 'react';
import Page from 'component/page';
import Card from 'component/common/card';
import Button from 'component/button';
import * as PAGES from 'constants/pages';

import './style.scss';

const AUTO_LAUNCH_DELAY_MS = 250;
const FALLBACK_DELAY_MS = 1800;

function normalizeRelayOrigin(rawOrigin: string) {
  const trimmed = String(rawOrigin || '').trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);
    parsed.hash = '';
    parsed.search = '';
    parsed.pathname = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function buildPairDeepLink(code: string, relayOrigin: string, autoSubmit: boolean = true) {
  const normalizedOrigin = normalizeRelayOrigin(relayOrigin);
  const normalizedCode = String(code || '').trim();

  if (!normalizedOrigin || !normalizedCode) {
    return '';
  }

  return `odyseeproxy://pair/${encodeURIComponent(normalizedCode)}/${encodeURIComponent(
    normalizedOrigin
  )}?code=${encodeURIComponent(normalizedCode)}&relay=${encodeURIComponent(
    normalizedOrigin
  )}&origin=${encodeURIComponent(normalizedOrigin)}&auto=${autoSubmit ? '1' : '0'}`;
}

function launchDeepLink(deepLink: string, userInitiated?: boolean = false) {
  if (!deepLink || typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  if (userInitiated) {
    window.location.assign(deepLink);
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.tabIndex = -1;
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.src = deepLink;
  const body = document.body;

  if (!body) {
    return;
  }

  body.appendChild(iframe);

  window.setTimeout(() => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }, 1500);
}

export default function YouTubeProxyPairPage() {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const params = React.useMemo(() => new URLSearchParams(search), [search]);
  const code = params.get('code') || '';
  const relayOrigin = normalizeRelayOrigin(params.get('relay') || '');
  const autoSubmit = params.get('auto') !== '0';
  const deepLink = React.useMemo(
    () => buildPairDeepLink(code, relayOrigin, autoSubmit),
    [autoSubmit, code, relayOrigin]
  );
  const [launchState, setLaunchState] = React.useState(deepLink ? 'pending' : 'invalid');

  React.useEffect(() => {
    if (!deepLink) {
      setLaunchState('invalid');
      return undefined;
    }

    let isSettled = false;
    let autoLaunchTimer;
    let fallbackTimer;

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        isSettled = true;
        setLaunchState('opened');
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);

    autoLaunchTimer = window.setTimeout(() => {
      setLaunchState('launching');
      launchDeepLink(deepLink);
    }, AUTO_LAUNCH_DELAY_MS);

    fallbackTimer = window.setTimeout(() => {
      if (!isSettled) {
        setLaunchState('fallback');
      }
    }, FALLBACK_DELAY_MS);

    return () => {
      window.clearTimeout(autoLaunchTimer);
      window.clearTimeout(fallbackTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [deepLink]);

  const relayTestbenchUrl = relayOrigin
    ? `${relayOrigin}/$/${PAGES.YOUTUBE_PROXY_TEST}`
    : `/$/${PAGES.YOUTUBE_PROXY_TEST}`;

  return (
    <Page noFooter fullWidthPage className="youtube-proxy-pair-page">
      <div className="youtube-proxy-pair-page__shell">
        <Card
          title={__('Open Mobile Proxy App')}
          subtitle={__(
            'This page bridges the desktop QR code to the phone app so the app can prefill the current pair code and relay origin.'
          )}
        >
          <div className="youtube-proxy-pair-page__hero">
            <div>
              <div className="youtube-proxy-pair-page__kicker">{__('Pair code')}</div>
              <div className="youtube-proxy-pair-page__code">{code || __('missing')}</div>
            </div>
            <div className="youtube-proxy-pair-page__status" data-state={launchState}>
              {launchState === 'pending' && __('Preparing the app link...')}
              {launchState === 'launching' && __('Trying to open the app now...')}
              {launchState === 'opened' &&
                __('The browser handed off to the app. If you are back here, use the button below to try again.')}
              {launchState === 'fallback' &&
                __(
                  'The app did not open automatically. Tap the button below, or enter this pair code manually inside the phone app.'
                )}
              {launchState === 'invalid' && __('This pairing link is missing a valid code or relay origin.')}
            </div>
          </div>

          <div className="youtube-proxy-pair-page__meta">
            <div>
              <strong>{__('Relay origin')}</strong>: {relayOrigin || __('invalid')}
            </div>
            <div>
              <strong>{__('Auto submit')}</strong>: {autoSubmit ? __('yes') : __('no')}
            </div>
            {deepLink && (
              <div className="youtube-proxy-pair-page__link">
                <strong>{__('App link')}</strong>: {deepLink}
              </div>
            )}
          </div>

          <div className="youtube-proxy-pair-page__actions">
            <Button
              button="primary"
              label={__('Open Proxy App')}
              onClick={() => {
                setLaunchState('launching');
                launchDeepLink(deepLink, true);
              }}
              disabled={!deepLink}
            />
            <Button button="secondary" label={__('Back To Testbench')} navigate={relayTestbenchUrl} />
          </div>

          <div className="youtube-proxy-pair-page__notes">
            <div>{__('Keep the phone app running before you tap the app link.')}</div>
            <div>
              {__(
                'If your phone browser stays on this page, the app is probably not installed or the custom scheme was blocked.'
              )}
            </div>
            <div>{__('Manual fallback: open the app and enter the same pair code and relay origin shown here.')}</div>
          </div>
        </Card>
      </div>
    </Page>
  );
}
