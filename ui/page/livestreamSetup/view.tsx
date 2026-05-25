import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import React from 'react';
import Page from 'component/page';
import Button from 'component/button';
import Yrbl from 'component/yrbl';
import Lbry from 'lbry';
import { toHex } from 'util/hex';
import CopyableText from 'component/copyableText';
import Card from 'component/common/card';
import { getLivestreamIngestRtmpUrl, NEW_LIVESTREAM_REPLAY_API } from 'constants/livestream';
import { ENABLE_NO_SOURCE_CLAIMS } from 'config';
import classnames from 'classnames';
import Icon from 'component/common/icon';
import YrblWalletEmpty from 'component/yrblWalletEmpty';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectHasChannels, selectFetchingMyChannels } from 'redux/selectors/claims';
import { doClearPublish, doUpdatePublishForm } from 'redux/actions/publish';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { doFetchNoSourceClaimsForChannelId } from 'redux/actions/claims';
import { selectUser } from 'redux/selectors/user';
import { selectUserHasValidOdyseeMembership } from 'redux/selectors/memberships';
import { selectPendingLivestreamsForChannelId, selectLivestreamsForChannelId } from 'redux/selectors/livestream';
import { selectBalance } from 'redux/selectors/wallet';
import { selectPublishFormValues } from 'redux/selectors/publish';
import ClaimPreview from 'component/claimPreview';
import LivestreamQuickCreate from 'component/livestreamQuickCreate/view';
import { lazyImport } from 'util/lazyImport';

const ChatLayout = lazyImport(() => import('component/chat' /* webpackChunkName: "chat" */));
import usePersistedState from 'effects/use-persisted-state';
import { WEBRTC_PUBLISH_PRESET_ORDER, type WebrtcPublishPresetId } from 'constants/webrtcPublish';
import { useLivestreamPublish } from 'contexts/livestreamPublish';
import useLivestreamMetrics from 'effects/use-livestream-metrics';
import LivestreamMetrics from 'component/livestreamMetrics/view';
import './style.scss';

const ALL_LIVESTREAM_TABS = ['Preview', 'Stream', 'Setup'];

export default function LivestreamSetupPage() {
  const LIVESTREAM_CLAIM_POLL_IN_MS = 60000;
  const dispatch = useAppDispatch();
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  const { claim_id: channelId, name: channelName } = activeChannelClaim || {};
  const publishFormValues = useAppSelector(selectPublishFormValues);
  const editingURI = publishFormValues?.editingURI;
  const hasChannels = useAppSelector(selectHasChannels);
  const fetchingChannels = useAppSelector(selectFetchingMyChannels);
  const myLivestreamClaims = useAppSelector((state) =>
    selectLivestreamsForChannelId(state, channelId)
  ) as Array<StreamClaim>;
  const pendingClaims = useAppSelector((state) =>
    selectPendingLivestreamsForChannelId(state, channelId)
  ) as Array<StreamClaim>;
  const user = useAppSelector(selectUser);
  const balance = useAppSelector(selectBalance);
  const hasPremium = useAppSelector(selectUserHasValidOdyseeMembership);
  const BROWSER_STREAM_ENABLED = Boolean(hasPremium);
  const VALID_LIVESTREAM_TABS = BROWSER_STREAM_ENABLED
    ? ALL_LIVESTREAM_TABS
    : ALL_LIVESTREAM_TABS.filter((t) => t !== 'Stream' && t !== 'Preview');
  const { search } = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(search);
  const urlTab = urlParams.get('t');
  const [sigData, setSigData] = React.useState<{ signature: any; signing_ts: any }>({
    signature: undefined,
    signing_ts: undefined,
  });
  const { odysee_live_disabled: liveDisabled } = user || {};
  const livestreamEnabled = Boolean(ENABLE_NO_SOURCE_CLAIMS && user && !liveDisabled);
  const [isClear, setIsClear] = React.useState(false);
  const [presetId, setPresetId] = usePersistedState('livestream-quality-preset', 'balanced') as [
    WebrtcPublishPresetId,
    (v: WebrtcPublishPresetId) => void,
  ];
  const [cameraAutoStart, setCameraAutoStart] = usePersistedState('livestream-camera-autostart', true) as [
    boolean,
    (v: boolean) => void,
  ];
  const publishCtx = useLivestreamPublish();
  const isStreamActive = publishCtx.state.status === 'live' || publishCtx.state.status === 'connecting';
  const createBtnRef = React.useRef<HTMLButtonElement>(null);
  const [arrowOffset, setArrowOffset] = React.useState<number>(18);
  React.useLayoutEffect(() => {
    const btn = createBtnRef.current;
    if (!btn) return;
    const measure = () =>
      setArrowOffset((prev) => {
        const next = btn.offsetWidth / 2;
        return prev === next ? prev : next;
      });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(btn);
    return () => ro.disconnect();
  }, []);

  function createStreamKey() {
    if (!channelId || !channelName || !sigData.signature || !sigData.signing_ts) return null;
    return `${channelId}?d=${toHex(channelName)}&s=${sigData.signature}&t=${sigData.signing_ts}`;
  }

  const formTitle = !editingURI ? __('Go Live') : __('Edit Livestream');
  const streamKey = createStreamKey();
  const pendingLength = pendingClaims.length;
  const approvedLivestreamClaimCount = myLivestreamClaims.length;
  const studioMountRef = React.useRef<HTMLDivElement | null>(null);
  const setStudioMountAction = publishCtx.actions.setStudioMount;
  const handleStudioMountRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      studioMountRef.current = el;
      setStudioMountAction(el);
    },
    [setStudioMountAction]
  );
  const totalLivestreamClaims = React.useMemo(() => {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    return pendingClaims.concat(myLivestreamClaims).filter((c: any) => {
      if (!c) return false;
      if (c.claim_id && seenIds.has(c.claim_id)) return false;
      if (c.name && seenNames.has(c.name)) return false;
      if (c.claim_id) seenIds.add(c.claim_id);
      if (c.name) seenNames.add(c.name);
      return true;
    });
  }, [pendingClaims, myLivestreamClaims]);

  function createNewLivestream() {
    dispatch(doClearPublish());
    navigate(`/$/${PAGES.LIVESTREAM_CREATE}`);
  }

  React.useEffect(() => {
    if (channelId && channelName) {
      Lbry.channel_sign({
        channel_id: channelId,
        hexdata: toHex(channelName),
      })
        .then((data: any) => setSigData(data))
        .catch(() => setSigData({ signature: null, signing_ts: null }));
    }
  }, [channelName, channelId]);

  React.useEffect(() => {
    if (!channelId || !BROWSER_STREAM_ENABLED) return;
    publishCtx.actions.setStudioProps({
      streamKey,
      livestreamUri: totalLivestreamClaims[0]?.canonical_url,
      livestreamEnabled,
      hasApprovedLivestreamClaim: approvedLivestreamClaimCount > 0,
      presetId,
      signature: sigData.signature,
      signingTs: sigData.signing_ts,
    });
  }, [
    channelId,
    streamKey,
    totalLivestreamClaims,
    livestreamEnabled,
    approvedLivestreamClaimCount,
    presetId,
    sigData.signature,
    sigData.signing_ts,
    publishCtx.actions,
  ]);

  const [hasReplays, setHasReplays] = React.useState(false);
  React.useEffect(() => {
    if (!channelId || !channelName || !sigData.signature || !sigData.signing_ts) return;
    let cancelled = false;
    const url =
      `${NEW_LIVESTREAM_REPLAY_API}?channel_claim_id=${String(channelId)}` +
      `&signature=${sigData.signature}&signature_ts=${sigData.signing_ts}&channel_name=${encodeURIComponent(channelName)}`;
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const data: Array<any> = json?.data || json || [];
        const usable = data.some((d: any) => {
          const s = typeof d?.Status === 'string' ? d.Status.toLowerCase() : '';
          return s === 'inprogress' || s === 'ready';
        });
        setHasReplays(usable);
      })
      .catch(() => {
        if (!cancelled) setHasReplays(false);
      });
    return () => {
      cancelled = true;
    };
  }, [channelId, channelName, sigData.signature, sigData.signing_ts]);

  React.useEffect(() => {
    let checkClaimsInterval: ReturnType<typeof setInterval> | undefined;
    if (!channelId) return;
    dispatch(doFetchNoSourceClaimsForChannelId(channelId));
    checkClaimsInterval = setInterval(
      () => dispatch(doFetchNoSourceClaimsForChannelId(channelId)),
      LIVESTREAM_CLAIM_POLL_IN_MS
    );
    return () => {
      if (checkClaimsInterval) clearInterval(checkClaimsInterval);
    };
  }, [channelId, pendingLength, dispatch]);

  const defaultTab = BROWSER_STREAM_ENABLED ? 'Preview' : 'Setup';
  const TAB_STORAGE_KEY = 'livestream-setup-last-tab';
  const initialTab = (() => {
    if (urlTab && VALID_LIVESTREAM_TABS.includes(urlTab)) return urlTab;
    try {
      const stored = localStorage.getItem(TAB_STORAGE_KEY);
      if (stored && VALID_LIVESTREAM_TABS.includes(stored)) return stored;
    } catch {}
    return defaultTab;
  })();
  const [tab, setTabState] = React.useState(initialTab);
  const setTab = React.useCallback(
    (next: string) => {
      setTabState(next);
      try {
        localStorage.setItem(TAB_STORAGE_KEY, next);
      } catch {}
      const sp = new URLSearchParams(search);
      if (next === defaultTab) sp.delete('t');
      else sp.set('t', next);
      const qs = sp.toString();
      navigate({ pathname: `/$/${PAGES.LIVESTREAM}`, search: qs ? `?${qs}` : '' }, { replace: true });
    },
    [search, navigate, defaultTab]
  );

  React.useEffect(() => {
    if (urlTab && !VALID_LIVESTREAM_TABS.includes(urlTab)) setTab(defaultTab);
  }, [urlTab, defaultTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stream metrics (active when live via any method -- WebRTC or RTMP)
  const metricsActive = tab === 'Setup';
  const serverMetrics = useLivestreamMetrics(
    channelId,
    channelName,
    sigData.signature,
    sigData.signing_ts,
    metricsActive
  );

  React.useEffect(() => {
    if (editingURI) navigate(`/$/${PAGES.LIVESTREAM_CREATE}`);
  }, [editingURI, navigate]);

  // Default to Publish tab when user has no livestream claims.
  // We wait for the first fetch to complete by tracking when myLivestreamClaims transitions
  // from its initial empty state after the channelId-triggered fetch.
  const claimsFetchedRef = React.useRef(false);
  const prevChannelIdRef = React.useRef(channelId);
  React.useEffect(() => {
    // Reset when channel changes
    if (channelId !== prevChannelIdRef.current) {
      claimsFetchedRef.current = false;
      prevChannelIdRef.current = channelId;
    }
  }, [channelId]);
  // The fetch is dispatched in the interval effect above. After it resolves,
  // myLivestreamClaims will update (even if still empty). We detect "fetched"
  // by waiting one tick after the fetch dispatch.
  const [claimsFetched, setClaimsFetched] = React.useState(false);
  React.useEffect(() => {
    if (!channelId || claimsFetchedRef.current) return;
    // Give the fetch time to resolve (the dispatch happens synchronously above,
    // but the selector update comes on the next render cycle).
    const timer = setTimeout(() => {
      claimsFetchedRef.current = true;
      setClaimsFetched(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [channelId]);

  React.useEffect(() => {
    if (urlTab && VALID_LIVESTREAM_TABS.includes(urlTab)) setTab(urlTab);
  }, [urlTab]);

  function resetForm() {
    dispatch(doClearPublish());
    navigate(`/$/${PAGES.LIVESTREAM_CREATE}`);
  }

  return (
    <Page>
      {balance < 0.01 && <YrblWalletEmpty />}

      <div className="livestream-setup__header">
        <div className="livestream-setup__heading">
          <h1 className="page__title page__title--margin">
            <Icon icon={ICONS.LIVESTREAM_MONOCHROME} />
            <label>{formTitle}</label>
          </h1>
          <p className="livestream-setup__subtitle">
            {__('Stream directly from your browser or use RTMP with OBS/Restream.')}
          </p>
        </div>
        <div className="livestream-setup__header-actions">
          <button
            className="livestream-setup__create-btn livestream-setup__create-btn--secondary"
            onClick={() => navigate(`/$/${PAGES.LIVESTREAM_CREATE}?s=Replay`)}
            disabled={balance < 0.01 || (totalLivestreamClaims.length === 0 && !hasReplays)}
          >
            <Icon icon={ICONS.MENU} size={16} />
            {__('Publish replay')}
          </button>
          <button
            ref={createBtnRef}
            className="livestream-setup__create-btn"
            onClick={() => navigate(`/$/${PAGES.LIVESTREAM_CREATE}`)}
            disabled={balance < 0.01}
          >
            <Icon icon={ICONS.ADD} size={16} />
            {__('Create / Edit')}
          </button>
          {totalLivestreamClaims.length === 0 && (
            <p
              className="help help--notice livestream-setup__claim-hint"
              style={{ ['--claim-hint-arrow-right' as any]: `${arrowOffset}px` }}
            >
              {__('Before you can go live, you have to create a livestream claim.')}
            </p>
          )}
        </div>
      </div>

      <div className="livestream-setup__toolbar">
        <div className="livestream-setup__tabs">
          {BROWSER_STREAM_ENABLED && (
            <button
              className={classnames('livestream-setup__tab', { 'livestream-setup__tab--active': tab === 'Preview' })}
              onClick={() => setTab('Preview')}
              disabled={balance < 0.01}
            >
              <Icon icon={ICONS.EYE} size={16} />
              {__('Preview')}
            </button>
          )}
          {BROWSER_STREAM_ENABLED && (
            <button
              className={classnames('livestream-setup__tab', { 'livestream-setup__tab--active': tab === 'Stream' })}
              onClick={() => setTab('Stream')}
              disabled={balance < 0.01}
            >
              <Icon icon={ICONS.CAMERA} size={16} />
              {__('Browser Stream (Beta)')}
            </button>
          )}
          <button
            className={classnames('livestream-setup__tab', {
              'livestream-setup__tab--active': tab === 'Setup',
            })}
            onClick={() => setTab('Setup')}
            disabled={balance < 0.01 || Boolean(editingURI)}
          >
            <Icon icon={ICONS.SETTINGS} size={16} />
            {__('RTMP Setup')}
          </button>
        </div>

        {tab === 'Stream' && (
          <div className="livestream-setup__stream-options">
            <div className="livestream-setup__option-group">
              <span className="livestream-setup__option-label">{__('Quality')}</span>
              <div className="livestream-setup__quality-pills">
                {WEBRTC_PUBLISH_PRESET_ORDER.map((id) => (
                  <button
                    key={id}
                    className={classnames('livestream-setup__quality-pill', {
                      'livestream-setup__quality-pill--active': presetId === id,
                    })}
                    onClick={() => setPresetId(id)}
                    disabled={isStreamActive}
                  >
                    {id === 'data_saver' && '480p'}
                    {id === 'balanced' && '720p'}
                    {id === 'hd' && '1080p'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* No channels */}
      {!fetchingChannels && !hasChannels && (
        <Yrbl
          type="happy"
          title={__("You haven't created a channel yet, let's fix that!")}
          actions={
            <div className="section__actions">
              <Button button="primary" navigate={`/$/${PAGES.CHANNEL_NEW}`} label={__('Create A Channel')} />
            </div>
          }
        />
      )}

      {tab === 'Preview' && (
        <div className="livestream-setup__preview">
          <div className="livestream-setup__preview-video">
            <div className="livestream-setup__preview-placeholder" />
            {!isStreamActive && (
              <div className="livestream-setup__preview-offair">
                <span className="livestream-setup__preview-offair-dot" />
                {__('OFF AIR')}
              </div>
            )}
          </div>
          <div
            className={classnames('livestream-setup__preview-chat-wrap', {
              'livestream-setup__preview-chat-wrap--disabled':
                !isStreamActive || !totalLivestreamClaims[0]?.canonical_url,
            })}
          >
            <React.Suspense fallback={null}>
              <ChatLayout uri={totalLivestreamClaims[0]?.canonical_url || ''} />
            </React.Suspense>
          </div>
        </div>
      )}

      {!fetchingChannels && channelId && BROWSER_STREAM_ENABLED && (
        <div
          className={classnames({ disabled: editingURI })}
          style={tab !== 'Stream' ? { display: 'none' } : undefined}
        >
          <div ref={handleStudioMountRef} className="livestream-setup__studio-host" />
        </div>
      )}

      {/* RTMP Setup Tab */}
      {tab === 'Setup' && (
        <div className={editingURI ? 'disabled' : ''}>
          {!livestreamEnabled && (
            <Card
              background
              className="livestream-setup__disabled-card"
              title={__('Livestreaming disabled')}
              body={
                <p className="help">
                  {__('This account has livestreaming disabled. Contact hello@odysee.com for help.')}
                </p>
              }
            />
          )}

          {livestreamEnabled && (
            <div className="livestream-setup__rtmp">
              {!fetchingChannels && channelId && (
                <>
                  {/* Stream Key Card */}
                  <div
                    className={classnames('livestream-setup__key-card', {
                      'livestream-setup__key-card--disabled': !streamKey || totalLivestreamClaims.length === 0,
                    })}
                  >
                    <div className="livestream-setup__key-header">
                      <h3 className="livestream-setup__key-title">{__('Stream Credentials')}</h3>
                      <p className="livestream-setup__key-subtitle">
                        {__('Use these in OBS, Restream, or any RTMP-compatible software.')}
                      </p>
                    </div>
                    <div className="livestream-setup__key-fields">
                      <CopyableText
                        primaryButton
                        enableInputMask={!streamKey || totalLivestreamClaims.length === 0}
                        name="stream-server"
                        label={__('Server URL')}
                        copyable={getLivestreamIngestRtmpUrl()}
                        snackMessage={__('Copied server URL.')}
                        disabled={!streamKey || totalLivestreamClaims.length === 0}
                      />
                      <CopyableText
                        primaryButton
                        enableInputMask
                        name="livestream-key"
                        label={__('Stream Key')}
                        copyable={
                          !streamKey || totalLivestreamClaims.length === 0 ? getLivestreamIngestRtmpUrl() : streamKey
                        }
                        snackMessage={__('Copied stream key.')}
                      />
                    </div>
                  </div>

                  {/* OBS Tips */}
                  <details className="livestream-setup__tips">
                    <summary className="livestream-setup__tips-summary">{__('Recommended OBS settings')}</summary>
                    <div className="livestream-setup__tips-body">
                      <ul>
                        <li>{__('Bitrate: 1000-2500 kbps')}</li>
                        <li>{__('Keyframes: 2')}</li>
                        <li>{__('Profile: High')}</li>
                        <li>{__('Tune: Zerolatency')}</li>
                      </ul>
                      <p className="livestream-setup__tips-note">
                        {__('Max bitrate: 7000 kbps. Mobile: use PRISM Live Studio.')}
                      </p>
                    </div>
                  </details>

                  {/* Stream Health Metrics */}
                  <LivestreamMetrics metrics={serverMetrics} mode="card" />

                  {/* Recent Streams */}
                  {totalLivestreamClaims.length > 0 && (
                    <div className="livestream-setup__recent">
                      <h3 className="livestream-setup__recent-title">{__('Recent Streams')}</h3>
                      {totalLivestreamClaims.slice(0, 5).map((c: any) => (
                        <ClaimPreview key={c.claim_id} uri={c.permanent_url} />
                      ))}
                    </div>
                  )}

                  {/* No claims warning */}
                  {totalLivestreamClaims.length === 0 && (
                    <div className="livestream-setup__no-claims">
                      <p>{__('You need to publish a livestream claim before you can stream.')}</p>
                      <div className="livestream-setup__no-claims-actions">
                        <Button
                          button="primary"
                          onClick={() => createNewLivestream()}
                          label={__('Create a Livestream')}
                        />
                        <Button
                          button="alt"
                          onClick={() => dispatch(doFetchNoSourceClaimsForChannelId(channelId))}
                          label={__('Refresh')}
                          icon={ICONS.REFRESH}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
