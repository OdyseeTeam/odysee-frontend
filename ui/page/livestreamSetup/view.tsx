import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import { useLocation } from 'react-router-dom';
import React from 'react';
import Page from 'component/page';
import Button from 'component/button';
import Yrbl from 'component/yrbl';
import Lbry from 'lbry';
import { toHex } from 'util/hex';
import CopyableText from 'component/copyableText';
import Card from 'component/common/card';
import { getLivestreamIngestRtmpUrl } from 'constants/livestream';
import { ENABLE_NO_SOURCE_CLAIMS } from 'config';
import classnames from 'classnames';
import LivestreamForm from 'component/publish/livestream/livestreamForm';
import Icon from 'component/common/icon';
import YrblWalletEmpty from 'component/yrblWalletEmpty';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectHasChannels, selectFetchingMyChannels } from 'redux/selectors/claims';
import { doClearPublish } from 'redux/actions/publish';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { doFetchNoSourceClaimsForChannelId } from 'redux/actions/claims';
import { selectUser } from 'redux/selectors/user';
import { selectPendingLivestreamsForChannelId, selectLivestreamsForChannelId } from 'redux/selectors/livestream';
import { selectBalance } from 'redux/selectors/wallet';
import { selectPublishFormValues } from 'redux/selectors/publish';
import LivestreamStudio from 'component/livestreamStudio';
import LivestreamQuickCreate from 'component/livestreamQuickCreate/view';
import usePersistedState from 'effects/use-persisted-state';
import { WEBRTC_PUBLISH_PRESET_ORDER, type WebrtcPublishPresetId } from 'constants/webrtcPublish';
import { useLivestreamPublish } from 'contexts/livestreamPublish';
import useLivestreamMetrics from 'effects/use-livestream-metrics';
import LivestreamMetrics from 'component/livestreamMetrics/view';
import './style.scss';

const ALL_LIVESTREAM_TABS = ['Stream', 'Publish', 'Setup'];

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
  const BROWSER_STREAM_ENABLED = true;
  const VALID_LIVESTREAM_TABS = BROWSER_STREAM_ENABLED
    ? ALL_LIVESTREAM_TABS
    : ALL_LIVESTREAM_TABS.filter((t) => t !== 'Stream');
  const { search } = useLocation();
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
  const [cameraAutoStart, setCameraAutoStart] = usePersistedState('livestream-camera-autostart', false) as [
    boolean,
    (v: boolean) => void,
  ];
  const publishCtx = useLivestreamPublish();
  const isStreamActive = publishCtx.state.status === 'live' || publishCtx.state.status === 'connecting';

  function createStreamKey() {
    if (!channelId || !channelName || !sigData.signature || !sigData.signing_ts) return null;
    return `${channelId}?d=${toHex(channelName)}&s=${sigData.signature}&t=${sigData.signing_ts}`;
  }

  const formTitle = !editingURI ? __('Go Live') : __('Edit Livestream');
  const streamKey = createStreamKey();
  const pendingLength = pendingClaims.length;
  const approvedLivestreamClaimCount = myLivestreamClaims.length;
  const totalLivestreamClaims = pendingClaims.concat(myLivestreamClaims);

  function createNewLivestream() {
    setTab('Publish');
    dispatch(doClearPublish());
  }

  React.useEffect(() => {
    if (channelId && channelName) {
      Lbry.channel_sign({
        channel_id: channelId,
        hexdata: toHex(channelName),
      })
        .then((data) => setSigData(data))
        .catch(() => setSigData({ signature: null, signing_ts: null }));
    }
  }, [channelName, channelId]);

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

  const defaultTab = BROWSER_STREAM_ENABLED ? 'Stream' : 'Publish';
  const initialTab = urlTab && VALID_LIVESTREAM_TABS.includes(urlTab) ? urlTab : defaultTab;
  const [tab, setTab] = React.useState(initialTab);

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
    if (editingURI) setTab('Publish');
  }, [editingURI]);

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
    setTab('Publish');
  }

  return (
    <Page>
      {balance < 0.01 && <YrblWalletEmpty />}

      <div className="livestream-setup__header">
        <div className="livestream-setup__heading">
          <h1 className="livestream-setup__title">
            <Icon icon={ICONS.LIVESTREAM_MONOCHROME} size={28} />
            <span>{formTitle}</span>
          </h1>
          <p className="livestream-setup__subtitle">
            {__('Stream directly from your browser or use RTMP with OBS/Restream.')}
          </p>
        </div>
      </div>

      <div className="livestream-setup__toolbar">
        <div className="livestream-setup__tabs">
          {BROWSER_STREAM_ENABLED && (
            <button
              className={classnames('livestream-setup__tab', { 'livestream-setup__tab--active': tab === 'Stream' })}
              onClick={() => setTab('Stream')}
              disabled={balance < 0.01}
            >
              <Icon icon={ICONS.CAMERA} size={16} />
              {__('Browser Stream')}
            </button>
          )}
          <button
            className={classnames('livestream-setup__tab', { 'livestream-setup__tab--active': tab === 'Publish' })}
            onClick={() => setTab('Publish')}
            disabled={balance < 0.01}
          >
            <Icon icon={ICONS.ADD} size={16} />
            {__('Create / Edit')}
          </button>
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

            <button
              className={classnames('livestream-setup__float-toggle', {
                'livestream-setup__float-toggle--on': cameraAutoStart,
              })}
              onClick={() => setCameraAutoStart(!cameraAutoStart)}
              title={cameraAutoStart ? __('Camera auto-start on') : __('Camera auto-start off')}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </button>

            <button
              className={classnames('livestream-setup__float-toggle', {
                'livestream-setup__float-toggle--on': publishCtx.state.floatingPreviewEnabled,
              })}
              onClick={() => publishCtx.actions.setFloatingPreviewEnabled(!publishCtx.state.floatingPreviewEnabled)}
              title={publishCtx.state.floatingPreviewEnabled ? __('Floating preview on') : __('Floating preview off')}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </button>
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

      {/* Browser Stream Tab (WebRTC) */}
      {tab === 'Stream' && (
        <div className={editingURI ? 'disabled' : ''}>
          {!fetchingChannels && channelId && claimsFetched && approvedLivestreamClaimCount === 0 && (
            <LivestreamQuickCreate
              onCreated={() => {
                if (channelId) dispatch(doFetchNoSourceClaimsForChannelId(channelId));
              }}
            />
          )}
          {!fetchingChannels && channelId && approvedLivestreamClaimCount > 0 && (
            <LivestreamStudio
              streamKey={streamKey}
              livestreamEnabled={livestreamEnabled}
              hasApprovedLivestreamClaim
              presetId={presetId}
              signature={sigData.signature}
              signingTs={sigData.signing_ts}
            />
          )}
        </div>
      )}

      {/* Publish Tab */}
      {tab === 'Publish' && hasChannels && <LivestreamForm setClearStatus={setIsClear} disabled={balance < 0.01} />}

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
