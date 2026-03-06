// @flow
import * as React from 'react';
import Page from 'component/page';
import Card from 'component/common/card';
import QRCode from 'component/common/qr-code';
import Button from 'component/button';
import { FormField } from 'component/common/form';
import * as PAGES from 'constants/pages';
import {
  clearConfiguredYouTubeProxySettings,
  fetchYouTubeResource,
  getConfiguredYouTubeProxyBaseUrl,
  getConfiguredYouTubeProxyMode,
  setConfiguredYouTubeProxyBaseUrl,
  setConfiguredYouTubeProxyMode,
  YOUTUBE_PROXY_MODE_AUTO,
  YOUTUBE_PROXY_MODE_DIRECT,
  YOUTUBE_PROXY_MODE_EXTENSION,
  YOUTUBE_PROXY_MODE_MOBILE,
} from 'util/youtubeProxy';
import type {
  YouTubeProxyHeaders,
  YouTubeProxyMethod,
  YouTubeProxyMode,
  YouTubeProxyResponseType,
  YouTubeProxyResult,
} from 'util/youtubeProxy';
import {
  buildYouTubeInnertubeContext,
  buildYouTubeInnertubeHeaders,
  detectYouTubeInnertubeConfig,
  getStoredYouTubeInnertubeConfig,
  setStoredYouTubeInnertubeConfig,
} from 'util/youtubeInnertube';
import type { YouTubeInnertubeConfig } from 'util/youtubeInnertube';

import './style.scss';

const DEFAULT_CHANNEL_ID = 'UCIBNAd4nO5rk6G8YaEudqNw';
const DEFAULT_CHANNEL_PATH = '@veritasium';
const DEFAULT_QUERY = 'veritasium';
const DEFAULT_VIDEO_ID = 'S4Qf8o4QSDs';
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_MANUAL_HEADERS = '{\n  "Accept": "application/json"\n}';
const DEFAULT_PAIR_RELAY_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';
const PAIR_STATUS_POLL_MS = 2000;

type ProbeDefinition = {
  id?: string,
  label: string,
  method?: YouTubeProxyMethod,
  url: string,
  headers?: YouTubeProxyHeaders,
  body?: string | { [string]: mixed } | Array<mixed> | number | boolean | null,
  responseType: YouTubeProxyResponseType,
};

type PairSession = {
  pairId: string,
  code: string,
  status: string,
  expiresAt: string,
  endpoint?: string,
  bindAddress?: string,
};

type CurrentResult = ProbeDefinition & {
  startedAt: string,
  finishedAt?: string,
  isPending?: boolean,
  result?: YouTubeProxyResult,
  error?: string,
};

type RecentRun = {
  label: string,
  method: YouTubeProxyMethod,
  url: string,
  status: number | 'ERR',
  ok: boolean,
  source: string,
  responseType: YouTubeProxyResponseType,
  finishedAt: string,
};

const MAX_PREVIEW_CHARS = 50000;

function buildWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId.trim() || DEFAULT_VIDEO_ID)}`;
}

function normalizeChannelPath(rawPath: string, channelId: string) {
  const trimmed = rawPath.trim();
  if (!trimmed) return channelId ? `channel/${channelId}` : DEFAULT_CHANNEL_PATH;

  try {
    return new URL(trimmed).pathname.replace(/^\/+|\/+$/g, '') || DEFAULT_CHANNEL_PATH;
  } catch {
    return trimmed.replace(/^\/+|\/+$/g, '') || DEFAULT_CHANNEL_PATH;
  }
}

function buildUploadsPlaylistId(channelId: string, playlistId: string) {
  if (playlistId.trim()) return playlistId.trim();
  return channelId.startsWith('UC') ? `UU${channelId.slice(2)}` : '';
}

function buildGetPresets({
  query,
  channelId,
  channelPath,
  videoId,
  playlistId,
}: {
  query: string,
  channelId: string,
  channelPath: string,
  videoId: string,
  playlistId: string,
}): Array<ProbeDefinition> {
  const normalizedChannelId = channelId.trim() || DEFAULT_CHANNEL_ID;
  const normalizedChannelPath = normalizeChannelPath(channelPath, normalizedChannelId);
  const normalizedQuery = query.trim() || DEFAULT_QUERY;
  const normalizedVideoId = videoId.trim() || DEFAULT_VIDEO_ID;
  const normalizedPlaylistId = buildUploadsPlaylistId(normalizedChannelId, playlistId);
  const watchUrl = buildWatchUrl(normalizedVideoId);

  return [
    {
      id: 'rss',
      label: __('Channel RSS Feed'),
      responseType: 'text',
      url: `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(normalizedChannelId)}`,
    },
    {
      id: 'oembed',
      label: __('Video oEmbed'),
      responseType: 'json',
      url: `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
    },
    {
      id: 'search',
      label: __('Search HTML'),
      responseType: 'text',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(normalizedQuery)}`,
    },
    {
      id: 'suggest',
      label: __('Search Suggestions'),
      responseType: 'text',
      url: `https://suggestqueries-clients6.youtube.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(
        normalizedQuery
      )}`,
    },
    {
      id: 'channel-root',
      label: __('Channel Root'),
      responseType: 'text',
      url: `https://www.youtube.com/${normalizedChannelPath}`,
    },
    {
      id: 'channel-videos',
      label: __('Channel Videos'),
      responseType: 'text',
      url: `https://www.youtube.com/${normalizedChannelPath}/videos`,
    },
    {
      id: 'channel-streams',
      label: __('Channel Streams'),
      responseType: 'text',
      url: `https://www.youtube.com/${normalizedChannelPath}/streams`,
    },
    {
      id: 'playlist',
      label: __('Playlist Page'),
      responseType: 'text',
      url: `https://www.youtube.com/playlist?list=${encodeURIComponent(normalizedPlaylistId)}`,
    },
    { id: 'watch', label: __('Watch Page'), responseType: 'text', url: watchUrl },
  ];
}

function buildPostPresets({
  query,
  channelId,
  videoId,
  innertube,
}: {
  query: string,
  channelId: string,
  videoId: string,
  innertube: YouTubeInnertubeConfig,
}): Array<ProbeDefinition> {
  if (!innertube.apiKey.trim() || !innertube.clientVersion.trim()) return [];

  const apiKey = innertube.apiKey.trim();
  const headers = buildYouTubeInnertubeHeaders(innertube);
  const context = buildYouTubeInnertubeContext(innertube);

  return [
    {
      id: 'youtubei-search',
      label: __('Innertube Search'),
      method: 'POST',
      responseType: 'json',
      url: `https://www.youtube.com/youtubei/v1/search?prettyPrint=false&key=${encodeURIComponent(apiKey)}`,
      headers,
      body: { context, query: query.trim() || DEFAULT_QUERY },
    },
    {
      id: 'youtubei-browse',
      label: __('Innertube Channel Browse'),
      method: 'POST',
      responseType: 'json',
      url: `https://www.youtube.com/youtubei/v1/browse?prettyPrint=false&key=${encodeURIComponent(apiKey)}`,
      headers,
      body: { context, browseId: channelId.trim() || DEFAULT_CHANNEL_ID },
    },
    {
      id: 'youtubei-next',
      label: __('Innertube Next'),
      method: 'POST',
      responseType: 'json',
      url: `https://www.youtube.com/youtubei/v1/next?prettyPrint=false&key=${encodeURIComponent(apiKey)}`,
      headers,
      body: { context, videoId: videoId.trim() || DEFAULT_VIDEO_ID },
    },
    {
      id: 'youtubei-player',
      label: __('Innertube Player'),
      method: 'POST',
      responseType: 'json',
      url: `https://youtubei.googleapis.com/youtubei/v1/player?prettyPrint=false&key=${encodeURIComponent(apiKey)}`,
      headers,
      body: { context, videoId: videoId.trim() || DEFAULT_VIDEO_ID, contentCheckOk: true, racyCheckOk: true },
    },
  ];
}

function parseHeadersText(text: string): YouTubeProxyHeaders {
  const trimmed = text.trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(__('Headers must be a JSON object.'));
  }

  const headers: YouTubeProxyHeaders = {};
  const sourceHeaders: { [string]: mixed } = (parsed: any);

  Object.keys(sourceHeaders).forEach((key) => {
    const value = sourceHeaders[key];
    if (typeof value === 'string') {
      headers[key] = value;
    }
  });

  return headers;
}

function parseBodyText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return undefined;

  try {
    return JSON.parse(trimmed);
  } catch {
    return text;
  }
}

function formatPreview(result: ?YouTubeProxyResult) {
  if (!result) return '';
  const content =
    result.responseType === 'json'
      ? JSON.stringify(result.data, null, 2)
      : typeof result.data === 'string'
      ? result.data
      : JSON.stringify(result.data, null, 2);

  if (!content) return '';
  return content.length <= MAX_PREVIEW_CHARS ? content : `${content.slice(0, MAX_PREVIEW_CHARS)}\n\n...`;
}

function formatJson(value: mixed) {
  return value ? JSON.stringify(value, null, 2) : '';
}

function normalizeRelayOrigin(rawOrigin: string) {
  const trimmed = rawOrigin.trim();
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

function buildPairLandingUrl(code: string, relayOrigin: string, autoSubmit: boolean = true) {
  const normalizedOrigin = normalizeRelayOrigin(relayOrigin);
  const normalizedCode = String(code || '').trim();

  if (!normalizedOrigin || !normalizedCode) {
    return '';
  }

  return `${normalizedOrigin}/$/${PAGES.YOUTUBE_PROXY_PAIR}?code=${encodeURIComponent(
    normalizedCode
  )}&relay=${encodeURIComponent(normalizedOrigin)}&auto=${autoSubmit ? '1' : '0'}`;
}

async function requestPairing(relayOrigin: string, path: string, options: RequestOptions = {}): Promise<PairSession> {
  const normalizedOrigin = normalizeRelayOrigin(relayOrigin);
  if (!normalizedOrigin) {
    throw new Error(__('Enter a valid pairing relay origin first.'));
  }

  const response = await fetch(`${normalizedOrigin}${path}`, {
    credentials: 'omit',
    ...(options || {}),
  });
  const json: any = await response.json().catch(() => null);

  if (!response.ok || !json || !json.success) {
    throw new Error((json && json.error) || __('Pairing request failed.'));
  }

  return json.data;
}

export default function YouTubeProxyTestPage() {
  const [proxyMode, setProxyMode] = React.useState<YouTubeProxyMode>(getConfiguredYouTubeProxyMode());
  const [mobileProxyUrl, setMobileProxyUrl] = React.useState(getConfiguredYouTubeProxyBaseUrl() || '');
  const [pairRelayOrigin, setPairRelayOrigin] = React.useState(DEFAULT_PAIR_RELAY_ORIGIN);
  const [pairSession, setPairSession] = React.useState<?PairSession>(null);
  const [isCreatingPair, setIsCreatingPair] = React.useState(false);
  const [query, setQuery] = React.useState(DEFAULT_QUERY);
  const [channelId, setChannelId] = React.useState(DEFAULT_CHANNEL_ID);
  const [channelPath, setChannelPath] = React.useState(DEFAULT_CHANNEL_PATH);
  const [videoId, setVideoId] = React.useState(DEFAULT_VIDEO_ID);
  const [playlistId, setPlaylistId] = React.useState('');
  const [timeoutMs, setTimeoutMs] = React.useState(String(DEFAULT_TIMEOUT_MS));
  const [innertube, setInnertube] = React.useState<YouTubeInnertubeConfig>(getStoredYouTubeInnertubeConfig());
  const [manualMethod, setManualMethod] = React.useState<YouTubeProxyMethod>('GET');
  const [manualUrl, setManualUrl] = React.useState(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${DEFAULT_CHANNEL_ID}`
  );
  const [manualResponseType, setManualResponseType] = React.useState<YouTubeProxyResponseType>('text');
  const [manualHeadersText, setManualHeadersText] = React.useState(DEFAULT_MANUAL_HEADERS);
  const [manualBodyText, setManualBodyText] = React.useState('');
  const [statusMessage, setStatusMessage] = React.useState('');
  const [currentResult, setCurrentResult] = React.useState<?CurrentResult>(null);
  const [recentRuns, setRecentRuns] = React.useState<Array<RecentRun>>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [isDetecting, setIsDetecting] = React.useState(false);

  const parsedTimeoutMs = Number(timeoutMs) || DEFAULT_TIMEOUT_MS;
  const getPresets = buildGetPresets({ query, channelId, channelPath, videoId, playlistId });
  const postPresets = buildPostPresets({ query, channelId, videoId, innertube });
  const activePairEndpoint = pairSession && pairSession.endpoint;
  const pairingDeepLink = pairSession ? buildPairDeepLink(pairSession.code, pairRelayOrigin, true) : '';
  const pairingQrValue = pairSession ? buildPairLandingUrl(pairSession.code, pairRelayOrigin, true) : '';

  function updateInnertube(key: $Keys<YouTubeInnertubeConfig>, value: string) {
    setInnertube((prev) => ({ ...prev, [key]: value }));
  }

  React.useEffect(() => {
    setStoredYouTubeInnertubeConfig(innertube);
  }, [innertube]);

  const applyPairedEndpoint = React.useCallback((sessionData: PairSession) => {
    const preferredEndpoint = sessionData && sessionData.endpoint;
    if (!preferredEndpoint) {
      return;
    }

    const normalizedBaseUrl = setConfiguredYouTubeProxyBaseUrl(preferredEndpoint);
    setConfiguredYouTubeProxyMode(YOUTUBE_PROXY_MODE_MOBILE);
    setProxyMode(YOUTUBE_PROXY_MODE_MOBILE);
    setMobileProxyUrl(normalizedBaseUrl || preferredEndpoint);
    setStatusMessage(
      __('Paired mobile proxy at %url%', {
        url: normalizedBaseUrl || preferredEndpoint,
      })
    );
  }, []);

  function applyProxySettings() {
    const normalizedBaseUrl = setConfiguredYouTubeProxyBaseUrl(mobileProxyUrl);
    setConfiguredYouTubeProxyMode(proxyMode);
    setMobileProxyUrl(normalizedBaseUrl || '');

    if (proxyMode === YOUTUBE_PROXY_MODE_MOBILE && !normalizedBaseUrl) {
      setStatusMessage(__('Saved proxy mode, but mobile mode needs a valid base URL.'));
      return;
    }

    setStatusMessage(
      proxyMode === YOUTUBE_PROXY_MODE_MOBILE && normalizedBaseUrl
        ? __('Saved mobile proxy at %url%', { url: normalizedBaseUrl })
        : __('Saved proxy mode: %mode%', { mode: proxyMode })
    );
  }

  function clearProxySettings() {
    clearConfiguredYouTubeProxySettings();
    setProxyMode(YOUTUBE_PROXY_MODE_AUTO);
    setMobileProxyUrl('');
    setStatusMessage(__('Cleared stored YouTube proxy settings.'));
  }

  function clearPairingState() {
    setPairSession(null);
    setStatusMessage(__('Cleared the current pairing state.'));
  }

  async function createPairingCode() {
    setIsCreatingPair(true);
    setStatusMessage(__('Creating a pairing code...'));

    try {
      const data = await requestPairing(pairRelayOrigin, '/$/api/youtubeProxyPair/v1/create', {
        method: 'POST',
      });

      setPairSession(data);
      setStatusMessage(
        __('Pair code %code% created. Open the phone app and enter it before %time%.', {
          code: data.code,
          time: new Date(data.expiresAt).toLocaleTimeString(),
        })
      );
    } catch (error) {
      setStatusMessage(error && error.message ? error.message : String(error));
    } finally {
      setIsCreatingPair(false);
    }
  }

  React.useEffect(() => {
    if (!pairSession || pairSession.status !== 'pending' || !pairSession.pairId) {
      return undefined;
    }

    let stopped = false;
    let timeoutId;

    async function pollPairingSession() {
      try {
        const nextSession = await requestPairing(
          pairRelayOrigin,
          `/$/api/youtubeProxyPair/v1/status/${encodeURIComponent(pairSession.pairId)}`,
          { method: 'GET' }
        );

        if (stopped) {
          return;
        }

        setPairSession(nextSession);

        if (nextSession.status === 'ready' && nextSession.endpoint) {
          applyPairedEndpoint(nextSession);
          return;
        }

        timeoutId = window.setTimeout(pollPairingSession, PAIR_STATUS_POLL_MS);
      } catch (error) {
        if (!stopped) {
          setStatusMessage(error && error.message ? error.message : String(error));
        }
      }
    }

    timeoutId = window.setTimeout(pollPairingSession, PAIR_STATUS_POLL_MS);

    return () => {
      stopped = true;
      window.clearTimeout(timeoutId);
    };
  }, [applyPairedEndpoint, pairRelayOrigin, pairSession]);

  async function detectInnertube() {
    setIsDetecting(true);
    setStatusMessage(__('Detecting Innertube config from the watch page...'));

    try {
      const detected = await detectYouTubeInnertubeConfig({
        videoId,
        timeoutMs: parsedTimeoutMs,
      });

      setInnertube((prev) => ({
        ...prev,
        apiKey: detected.apiKey || prev.apiKey,
        clientName: detected.clientName || prev.clientName,
        clientVersion: detected.clientVersion || prev.clientVersion,
        hl: detected.hl || prev.hl,
        gl: detected.gl || prev.gl,
        visitorData: detected.visitorData || prev.visitorData,
      }));
      setStatusMessage(
        __('Detected Innertube config via %source%. Client %client_name% / %client_version%', {
          source: proxyMode,
          client_name: detected.clientName || innertube.clientName,
          client_version: detected.clientVersion,
        })
      );
    } catch (error) {
      setStatusMessage(error && error.message ? error.message : String(error));
    } finally {
      setIsDetecting(false);
    }
  }

  React.useEffect(() => {
    if (isDetecting || innertube.apiKey.trim() || innertube.clientVersion.trim()) {
      return undefined;
    }

    detectInnertube();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runProbe(probe: ProbeDefinition) {
    const startedAt = new Date().toISOString();

    setIsRunning(true);
    setStatusMessage(__('Running %probe%...', { probe: probe.label }));
    setCurrentResult({ ...probe, startedAt, isPending: true });

    try {
      const result = await fetchYouTubeResource({
        url: probe.url,
        method: probe.method,
        headers: probe.headers,
        body: probe.body,
        responseType: probe.responseType,
        timeoutMs: parsedTimeoutMs,
      });
      const nextResult = { ...probe, startedAt, finishedAt: new Date().toISOString(), result };

      setCurrentResult(nextResult);
      setRecentRuns((prev) =>
        [
          {
            label: probe.label,
            method: probe.method || 'GET',
            url: probe.url,
            status: result.status,
            ok: result.ok,
            source: result.source,
            responseType: probe.responseType,
            finishedAt: nextResult.finishedAt,
          },
          ...prev,
        ].slice(0, 8)
      );
      setStatusMessage(
        result.ok
          ? __('Completed %method% via %source% with HTTP %status%', {
              method: probe.method || 'GET',
              source: result.source,
              status: String(result.status),
            })
          : __('Proxy returned %status% for %method% via %source%', {
              method: probe.method || 'GET',
              source: result.source,
              status: String(result.status),
            })
      );
    } catch (error) {
      const nextResult = {
        ...probe,
        startedAt,
        finishedAt: new Date().toISOString(),
        error: error && error.message ? error.message : String(error),
      };

      setCurrentResult(nextResult);
      setRecentRuns((prev) =>
        [
          {
            label: probe.label,
            method: probe.method || 'GET',
            url: probe.url,
            status: 'ERR',
            ok: false,
            source: __('transport'),
            responseType: probe.responseType,
            finishedAt: nextResult.finishedAt,
          },
          ...prev,
        ].slice(0, 8)
      );
      setStatusMessage(nextResult.error);
    } finally {
      setIsRunning(false);
    }
  }

  function runManualProbe() {
    let headers;
    try {
      headers = parseHeadersText(manualHeadersText);
    } catch (error) {
      setStatusMessage(error && error.message ? error.message : String(error));
      return;
    }

    runProbe({
      label: __('Manual Probe'),
      method: manualMethod,
      url: manualUrl,
      headers,
      body: manualMethod === 'POST' ? parseBodyText(manualBodyText) : undefined,
      responseType: manualResponseType,
    });
  }

  const previewText = currentResult && currentResult.result ? formatPreview(currentResult.result) : '';
  const requestHeadersText = formatJson(currentResult && currentResult.headers);
  const requestBodyText =
    currentResult && currentResult.body !== undefined
      ? typeof currentResult.body === 'string'
        ? currentResult.body
        : formatJson(currentResult.body)
      : '';
  const currentProxyResult = currentResult && currentResult.result;
  const responseHeadersText = formatJson(currentProxyResult && currentProxyResult.headers);

  return (
    <Page noFooter fullWidthPage className="card-stack youtube-proxy-test-page">
      <Card
        title={__('YouTube Proxy Testbench')}
        subtitle={__('Manual probes for the shared Woo YouTube proxy client.')}
      >
        <div className="youtube-proxy-test-page__hero">
          <div className="youtube-proxy-test-page__hero-copy">
            <div className="youtube-proxy-test-page__badge">
              {__('Current mode')}: <strong>{proxyMode}</strong>
            </div>
            <div className="youtube-proxy-test-page__hero-note">
              {mobileProxyUrl
                ? __('Stored mobile proxy: %url%', { url: mobileProxyUrl })
                : __('No mobile proxy URL stored.')}
            </div>
            <div className="youtube-proxy-test-page__hero-note">
              {__('POST probes need the extension bridge to add POST support when you are testing in extension mode.')}
            </div>
          </div>
          <div className="section__actions">
            <Button button="secondary" label={__('Apply Proxy Settings')} onClick={applyProxySettings} />
            <Button button="link" label={__('Clear')} onClick={clearProxySettings} />
          </div>
        </div>
        {statusMessage && <p className="youtube-proxy-test-page__status">{statusMessage}</p>}
      </Card>

      <Card title={__('Proxy Settings')} subtitle={__('Choose how this page routes YouTube requests.')}>
        <div className="youtube-proxy-test-page__field-grid">
          <FormField
            type="select"
            name="yt_proxy_mode"
            label={__('Proxy mode')}
            value={proxyMode}
            onChange={(e) => setProxyMode((e.target.value: any))}
          >
            <option value={YOUTUBE_PROXY_MODE_AUTO}>{__('auto')}</option>
            <option value={YOUTUBE_PROXY_MODE_EXTENSION}>{__('extension')}</option>
            <option value={YOUTUBE_PROXY_MODE_MOBILE}>{__('mobile')}</option>
            <option value={YOUTUBE_PROXY_MODE_DIRECT}>{__('direct')}</option>
          </FormField>
          <FormField
            type="text"
            name="yt_proxy_mobile_url"
            label={__('Mobile proxy URL')}
            placeholder="http://192.168.1.20:19191"
            value={mobileProxyUrl}
            onChange={(e) => setMobileProxyUrl(e.target.value)}
          />
          <FormField
            type="number"
            name="yt_proxy_timeout"
            label={__('Timeout (ms)')}
            value={timeoutMs}
            onChange={(e) => setTimeoutMs(e.target.value)}
          />
        </div>
      </Card>

      <Card
        title={__('Desktop Pairing')}
        subtitle={__(
          'Create a short-lived code here, then enter it in the phone app so the app can register its current proxy URL back to this browser.'
        )}
      >
        <div className="youtube-proxy-test-page__field-grid youtube-proxy-test-page__field-grid--pairing">
          <FormField
            type="text"
            name="yt_proxy_pair_relay_origin"
            label={__('Pairing relay origin')}
            value={pairRelayOrigin}
            onChange={(e) => setPairRelayOrigin(e.target.value)}
            helper={__(
              'Use the same origin the phone app will talk to. If this page is on localhost, the phone cannot reach it unless you expose that server on your LAN or a public URL.'
            )}
          />
          <div className="youtube-proxy-test-page__pair-actions">
            <Button
              button="secondary"
              label={isCreatingPair ? __('Creating...') : __('Create Pair Code')}
              onClick={createPairingCode}
              disabled={isCreatingPair}
            />
            <Button button="link" label={__('Clear Pairing')} onClick={clearPairingState} />
          </div>
        </div>
        <div className="youtube-proxy-test-page__pair-help">
          {__(
            "This path now pairs only the phone's HTTP proxy URL. Create a code here, scan the QR with the phone, and let the app register its LAN URL back to this browser."
          )}
        </div>

        {pairSession ? (
          <div className="youtube-proxy-test-page__pair-card">
            <div className="youtube-proxy-test-page__pair-qr">
              <div className="youtube-proxy-test-page__pair-code">{pairSession.code}</div>
              <div className="youtube-proxy-test-page__pair-qr-grid">
                {pairingQrValue && (
                  <div className="youtube-proxy-test-page__pair-qr-card">
                    <div className="youtube-proxy-test-page__pair-qr-label">{__('Landing Page')}</div>
                    <div className="youtube-proxy-test-page__pair-qr-art">
                      <QRCode value={pairingQrValue} />
                    </div>
                  </div>
                )}
                {pairingDeepLink && (
                  <div className="youtube-proxy-test-page__pair-qr-card">
                    <div className="youtube-proxy-test-page__pair-qr-label">{__('Direct App Link')}</div>
                    <div className="youtube-proxy-test-page__pair-qr-art">
                      <QRCode value={pairingDeepLink} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="youtube-proxy-test-page__pair-meta">
              <div>
                <strong>{__('Status')}</strong>: {pairSession.status}
              </div>
              <div>
                <strong>{__('Expires')}</strong>: {new Date(pairSession.expiresAt).toLocaleTimeString()}
              </div>
              <div>
                <strong>{__('Relay')}</strong>: {normalizeRelayOrigin(pairRelayOrigin) || __('invalid origin')}
              </div>
              {activePairEndpoint && (
                <div>
                  <strong>{__('Endpoint')}</strong>: {activePairEndpoint}
                </div>
              )}
              {pairSession.bindAddress && (
                <div>
                  <strong>{__('Bind address')}</strong>: {pairSession.bindAddress}
                </div>
              )}
              {pairingQrValue && (
                <div>
                  <strong>{__('QR landing link')}</strong>: {pairingQrValue}
                </div>
              )}
              {pairingDeepLink && (
                <div>
                  <strong>{__('Direct app link')}</strong>: {pairingDeepLink}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="help">{__('No pairing code created yet.')}</div>
        )}
      </Card>

      <Card title={__('Common Inputs')} subtitle={__('These seed the preset probes below.')}>
        <div className="youtube-proxy-test-page__field-grid">
          <FormField
            type="text"
            name="yt_proxy_query"
            label={__('Search query')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <FormField
            type="text"
            name="yt_proxy_channel_id"
            label={__('Channel ID')}
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
          />
          <FormField
            type="text"
            name="yt_proxy_channel_path"
            label={__('Channel path or handle')}
            value={channelPath}
            onChange={(e) => setChannelPath(e.target.value)}
          />
          <FormField
            type="text"
            name="yt_proxy_video_id"
            label={__('Video ID')}
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
          />
          <FormField
            type="text"
            name="yt_proxy_playlist_id"
            label={__('Playlist ID')}
            value={playlistId}
            onChange={(e) => setPlaylistId(e.target.value)}
          />
        </div>
      </Card>

      <Card
        title={__('Innertube Config')}
        subtitle={__(
          'Auto-detect an API key and client version from the watch page, then use them for youtubei POST probes.'
        )}
      >
        <div className="youtube-proxy-test-page__field-grid">
          <FormField
            type="text"
            name="yt_proxy_api_key"
            label={__('Innertube API key')}
            value={innertube.apiKey}
            onChange={(e) => updateInnertube('apiKey', e.target.value)}
          />
          <FormField
            type="text"
            name="yt_proxy_client_name"
            label={__('Header client name')}
            value={innertube.clientName}
            onChange={(e) => updateInnertube('clientName', e.target.value)}
            helper={__('For web this is usually 1.')}
          />
          <FormField
            type="text"
            name="yt_proxy_client_version"
            label={__('Client version')}
            value={innertube.clientVersion}
            onChange={(e) => updateInnertube('clientVersion', e.target.value)}
          />
          <FormField
            type="text"
            name="yt_proxy_hl"
            label={__('HL')}
            value={innertube.hl}
            onChange={(e) => updateInnertube('hl', e.target.value)}
          />
          <FormField
            type="text"
            name="yt_proxy_gl"
            label={__('GL')}
            value={innertube.gl}
            onChange={(e) => updateInnertube('gl', e.target.value)}
          />
        </div>
        <div className="section__actions">
          <Button
            button="secondary"
            label={isDetecting ? __('Detecting...') : __('Auto-detect From Watch Page')}
            onClick={detectInnertube}
            disabled={isDetecting || isRunning}
          />
        </div>
      </Card>

      <Card
        title={__('GET Presets')}
        subtitle={__('RSS, oEmbed, search, channel pages, and other GET-friendly endpoints.')}
      >
        <div className="youtube-proxy-test-page__preset-grid">
          {getPresets.map((preset) => (
            <section key={preset.id} className="youtube-proxy-test-page__preset-card">
              <div className="youtube-proxy-test-page__preset-label">{preset.label}</div>
              <code className="youtube-proxy-test-page__endpoint">{preset.url}</code>
              <div className="section__actions">
                <Button
                  button="secondary"
                  label={isRunning ? __('Running...') : __('Run')}
                  onClick={() => runProbe(preset)}
                  disabled={isRunning}
                />
              </div>
            </section>
          ))}
        </div>
      </Card>

      <Card title={__('POST Presets')} subtitle={__('youtubei probes that use the new POST-capable proxy contract.')}>
        {postPresets.length === 0 ? (
          <div className="help">{__('Auto-detect or fill the Innertube API key and client version first.')}</div>
        ) : (
          <div className="youtube-proxy-test-page__preset-grid">
            {postPresets.map((preset) => (
              <section key={preset.id} className="youtube-proxy-test-page__preset-card">
                <div className="youtube-proxy-test-page__preset-label">{preset.label}</div>
                <div className="youtube-proxy-test-page__request-chip-row">
                  <span className="youtube-proxy-test-page__request-chip">{preset.method}</span>
                  <span className="youtube-proxy-test-page__request-chip">{preset.responseType}</span>
                </div>
                <code className="youtube-proxy-test-page__endpoint">{preset.url}</code>
                <pre className="youtube-proxy-test-page__preview youtube-proxy-test-page__preview--small">
                  {formatJson(preset.body)}
                </pre>
                <div className="section__actions">
                  <Button
                    button="secondary"
                    label={isRunning ? __('Running...') : __('Run')}
                    onClick={() => runProbe(preset)}
                    disabled={isRunning}
                  />
                </div>
              </section>
            ))}
          </div>
        )}
      </Card>

      <Card title={__('Manual Probe')} subtitle={__('Try any allowed YouTube URL with GET, HEAD, or POST.')}>
        <div className="youtube-proxy-test-page__field-grid youtube-proxy-test-page__field-grid--manual">
          <FormField
            type="text"
            name="yt_proxy_manual_url"
            label={__('Target URL')}
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
          />
          <FormField
            type="select"
            name="yt_proxy_manual_method"
            label={__('Method')}
            value={manualMethod}
            onChange={(e) => setManualMethod((e.target.value: any))}
          >
            <option value="GET">{__('GET')}</option>
            <option value="HEAD">{__('HEAD')}</option>
            <option value="POST">{__('POST')}</option>
          </FormField>
          <FormField
            type="select"
            name="yt_proxy_manual_type"
            label={__('Response type')}
            value={manualResponseType}
            onChange={(e) => setManualResponseType((e.target.value: any))}
          >
            <option value="text">{__('text')}</option>
            <option value="json">{__('json')}</option>
          </FormField>
        </div>
        <div className="youtube-proxy-test-page__field-grid youtube-proxy-test-page__field-grid--stacked">
          <FormField
            type="textarea"
            name="yt_proxy_manual_headers"
            label={__('Headers JSON')}
            value={manualHeadersText}
            onChange={(e) => setManualHeadersText(e.target.value)}
            max={4000}
            hideSuggestions
          />
          <FormField
            type="textarea"
            name="yt_proxy_manual_body"
            label={__('Body')}
            value={manualBodyText}
            onChange={(e) => setManualBodyText(e.target.value)}
            max={16000}
            hideSuggestions
          />
        </div>
        <div className="section__actions">
          <Button
            button="primary"
            label={isRunning ? __('Running...') : __('Run Manual Probe')}
            onClick={runManualProbe}
            disabled={isRunning}
          />
        </div>
      </Card>

      <Card
        title={__('Latest Response')}
        subtitle={
          currentResult
            ? __('%method% %label% - %url%', {
                method: currentResult.method || 'GET',
                label: currentResult.label,
                url: currentResult.url,
              })
            : __('Run a probe to inspect the response.')
        }
      >
        {currentResult ? (
          <div className="youtube-proxy-test-page__result-grid">
            <div className="youtube-proxy-test-page__result-meta">
              <div>
                <strong>{__('Started')}</strong>: {currentResult.startedAt}
              </div>
              {currentResult.finishedAt && (
                <div>
                  <strong>{__('Finished')}</strong>: {currentResult.finishedAt}
                </div>
              )}
              <div>
                <strong>{__('Method')}</strong>: {currentResult.method || 'GET'}
              </div>
              {currentProxyResult && (
                <>
                  <div>
                    <strong>{__('Source')}</strong>: {currentProxyResult.source}
                  </div>
                  <div>
                    <strong>{__('HTTP')}</strong>: {currentProxyResult.status} {currentProxyResult.statusText}
                  </div>
                </>
              )}
              {currentResult.error && <div className="error__text">{currentResult.error}</div>}
            </div>

            <div>
              <div className="youtube-proxy-test-page__result-label">{__('Request Headers')}</div>
              <pre className="youtube-proxy-test-page__preview youtube-proxy-test-page__preview--small">
                {requestHeadersText || __('No request headers.')}
              </pre>
            </div>

            <div>
              <div className="youtube-proxy-test-page__result-label">{__('Request Body')}</div>
              <pre className="youtube-proxy-test-page__preview youtube-proxy-test-page__preview--small">
                {requestBodyText || __('No request body.')}
              </pre>
            </div>

            {currentProxyResult && (
              <>
                <div>
                  <div className="youtube-proxy-test-page__result-label">{__('Response Headers')}</div>
                  <pre className="youtube-proxy-test-page__preview youtube-proxy-test-page__preview--small">
                    {responseHeadersText}
                  </pre>
                </div>
                <div className="youtube-proxy-test-page__result-column-span">
                  <div className="youtube-proxy-test-page__result-label">{__('Body Preview')}</div>
                  <pre className="youtube-proxy-test-page__preview">{previewText}</pre>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="help">{__('No response captured yet.')}</div>
        )}
      </Card>

      <Card title={__('Recent Runs')} subtitle={__('Quick status history for this browser session.')}>
        {recentRuns.length === 0 ? (
          <div className="help">{__('No probes have been run yet.')}</div>
        ) : (
          <div className="youtube-proxy-test-page__history">
            {recentRuns.map((run, index) => (
              <div key={`${run.url}_${run.finishedAt}_${index}`} className="youtube-proxy-test-page__history-item">
                <div className="youtube-proxy-test-page__history-topline">
                  <strong>{run.label}</strong>
                  <span
                    className={`youtube-proxy-test-page__history-status ${
                      run.ok
                        ? 'youtube-proxy-test-page__history-status--ok'
                        : 'youtube-proxy-test-page__history-status--bad'
                    }`}
                  >
                    {run.status}
                  </span>
                </div>
                <div className="youtube-proxy-test-page__history-subline">
                  {run.method} - {run.source} - {run.responseType}
                </div>
                <code className="youtube-proxy-test-page__endpoint">{run.url}</code>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Page>
  );
}
