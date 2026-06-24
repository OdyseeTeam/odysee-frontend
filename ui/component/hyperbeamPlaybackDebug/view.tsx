import React from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { HYPERBEAM_BASE_URL } from 'config';
import { buildHyperbeamPlaybackUrl } from 'util/hyperbeam-playback';
import { fetchHyperbeamStreamVerification } from 'util/hyperbeam';
import './style.lazy.scss';

const TIMEOUT_MS = 8000;
const BODY_PREVIEW_LIMIT = 512 * 1024;

type Props = {
  uri: string;
  claim?: any;
  accessStatus?: string | null;
};

type DebugRequestKind = 'VERIFY' | 'LOCATOR' | 'SOURCE' | 'PLAYBACK' | 'MEDIA';

type DebugRequest = {
  kind: DebugRequestKind;
  method: string;
  url: string;
  path: string;
  ok: boolean;
  status?: number;
  statusText?: string;
  elapsedMs?: number;
  headers: Record<string, string>;
  body?: any;
  bodyText?: string;
  bodyBytes?: number;
  error?: string;
};

type FetchState = {
  loading: boolean;
  baseUrl?: string;
  verification?: any;
  verificationError?: string;
  mediaUrl?: string;
  requests: {
    claim?: DebugRequest;
    streamSource?: DebugRequest;
    claimOutputSource?: DebugRequest;
    channelClaim?: DebugRequest;
    channelSource?: DebugRequest;
    playback?: DebugRequest;
    media?: DebugRequest;
  };
};

type Step = {
  title: string;
  subtitle: string;
  status: string;
  statusKind: 'ok' | 'pending' | 'trusted' | 'warn' | 'error';
  question?: string;
  explanation?: string;
  catchText?: string;
  proofRows?: Array<[string, string | number | boolean | null | undefined]>;
  requests?: DebugRequest[];
};

type SignatureInput = {
  label: string;
  covered: string[];
  alg?: string;
  keyid?: string;
  tag?: string;
  nativeId?: string;
};

export default function HyperbeamPlaybackDebug({ uri, claim, accessStatus }: Props) {
  const { search } = useLocation();
  const urlParams = React.useMemo(() => new URLSearchParams(search), [search]);
  const enabled = urlParams.get('hb_debug') === '1' || urlParams.get('hb_debug') === 'true';
  const protectedPlayback = Boolean(accessStatus);
  const claimId = claim?.claim_id;
  const claimName = claim?.name;
  const signingChannel = claim?.signing_channel || {};
  const channelId = signingChannel?.claim_id;
  const channelName = signingChannel?.name;
  const source = claim?.value?.source || {};
  const playbackRequestUrl = React.useMemo(() => buildHyperbeamPlaybackUrl(uri), [uri]);
  const [state, setState] = React.useState<FetchState>({ loading: false, requests: {} });
  const [open, setOpen] = React.useState(true);
  const [dismissed, setDismissed] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setDismissed(false);
  }, [uri]);

  React.useEffect(() => {
    if (!enabled || protectedPlayback || !playbackRequestUrl) return;

    let cancelled = false;

    async function load() {
      const baseUrl = hyperbeamBaseUrl(playbackRequestUrl);
      const nextState: FetchState = { loading: false, baseUrl, requests: {} };

      setState({ loading: true, baseUrl, requests: {} });

      try {
        nextState.verification = await fetchHyperbeamStreamVerification(claim, uri);
      } catch (error) {
        nextState.verificationError = errorMessage(error);
      }

      const verification = nextState.verification || {};
      const initialTxid = firstString(
        pick(verification, 'txid'),
        claim?.txid,
        claim?.meta?.txid,
        pick(claim, 'transaction_hash', 'transaction-hash')
      );
      const initialNout = firstString(pick(verification, 'nout'), claim?.nout, claim?.meta?.nout);

      const claimUrl = baseUrl && claimId ? buildDeviceUrl(baseUrl, '~odysee@1.0/claim', { 'claim-id': claimId }) : '';
      const channelClaimUrl =
        baseUrl && channelId ? buildDeviceUrl(baseUrl, '~odysee@1.0/claim', { 'claim-id': channelId }) : '';

      const [claimRequest, playbackRequest, channelClaim] = await Promise.all([
        claimUrl ? fetchDebugRequest('LOCATOR', claimUrl) : Promise.resolve(undefined),
        fetchDebugRequest('PLAYBACK', playbackRequestUrl),
        channelClaimUrl ? fetchDebugRequest('LOCATOR', channelClaimUrl) : Promise.resolve(undefined),
      ]);

      nextState.requests.claim = claimRequest;
      nextState.requests.playback = playbackRequest;
      nextState.requests.channelClaim = channelClaim;

      const txid = firstString(initialTxid, pick(claimRequest?.body, 'txid'), pick(claimRequest?.body?.source, 'txid'));
      const nout = firstString(initialNout, pick(claimRequest?.body, 'nout'), pick(claimRequest?.body?.source, 'nout'));
      const streamSourceUrl = baseUrl && txid ? buildDeviceUrl(baseUrl, '~odysee@1.0/source', { id: txid }) : '';
      const claimOutputUrl =
        baseUrl && txid && nout !== undefined
          ? buildDeviceUrl(baseUrl, '~odysee@1.0/source', { id: `${txid}:${nout}` })
          : '';

      const [streamSource, claimOutputSource] = await Promise.all([
        streamSourceUrl ? fetchDebugRequest('SOURCE', streamSourceUrl) : Promise.resolve(undefined),
        claimOutputUrl ? fetchDebugRequest('SOURCE', claimOutputUrl) : Promise.resolve(undefined),
      ]);

      nextState.requests.streamSource = streamSource;
      nextState.requests.claimOutputSource = claimOutputSource;

      const channelTxid = firstString(
        pick(channelClaim?.body, 'txid'),
        pick(channelClaim?.body?.source, 'txid'),
        signingChannel?.txid,
        signingChannel?.meta?.txid
      );
      const channelNout = firstString(
        pick(channelClaim?.body, 'nout'),
        pick(channelClaim?.body?.source, 'nout'),
        signingChannel?.nout,
        signingChannel?.meta?.nout
      );
      const channelSourceId = channelTxid && channelNout !== undefined ? `${channelTxid}:${channelNout}` : channelTxid;
      const channelSourceUrl =
        baseUrl && channelSourceId ? buildDeviceUrl(baseUrl, '~odysee@1.0/source', { id: channelSourceId }) : '';

      if (channelSourceUrl) {
        nextState.requests.channelSource = await fetchDebugRequest('SOURCE', channelSourceUrl);
      }

      const playback = playbackRequest?.body || {};
      const mediaUrl = firstString(
        pick(playback, 'download_url', 'download-url', 'streaming_url', 'streaming-url'),
        pick(nextState.verification, 'download-url', 'download_url')
      );
      nextState.mediaUrl = mediaUrl;

      if (mediaUrl) {
        nextState.requests.media = await fetchDebugRequest('MEDIA', mediaUrl, { method: 'HEAD' });
      }

      if (!cancelled) setState(nextState);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [claim, channelId, claimId, enabled, playbackRequestUrl, protectedPlayback, uri]);

  if (!enabled || dismissed) return null;

  const copyTrace = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const trace = JSON.stringify(
      {
        type: 'odysee_hyperbeam_playback_trace',
        generated_at: new Date().toISOString(),
        uri,
        claim_id: claimId,
        claim_name: claimName,
        channel_id: channelId,
        playback_request_url: playbackRequestUrl,
        media_url: state.mediaUrl,
        verification: state.verification,
        requests: state.requests,
        errors: {
          verification: state.verificationError,
        },
      },
      null,
      2
    );

    navigator.clipboard
      ?.writeText(trace)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      })
      .catch(() => setCopied(false));
  };

  if (protectedPlayback) {
    return renderDebugPortal(
      <section
        className={`hyperbeam-debug ${open ? 'hyperbeam-debug--open' : 'hyperbeam-debug--closed'}`}
        role="dialog"
        aria-label={__('HyperBEAM playback trace')}
      >
        <DebugTopbar
          copied={copied}
          open={open}
          subtitle={__('protected content')}
          onCopy={copyTrace}
          onClose={() => setDismissed(true)}
          onToggle={() => setOpen((value) => !value)}
        />

        {open && (
          <div className="hyperbeam-debug__body">
            <DebugHeader status={__('skipped')} />
            <StepCard
              step={{
                title: __('Protected playback'),
                subtitle: __('access-gated playback is not traced'),
                status: __('not traced'),
                statusKind: 'warn',
                explanation: __(
                  'Debug playback tracing is disabled for protected content so access keys stay off HyperBEAM.'
                ),
                catchText: __(
                  'This prevents auth or purchase tokens from being forwarded into public device requests.'
                ),
              }}
              index={0}
            />
          </div>
        )}
      </section>
    );
  }

  const verification = state.verification || {};
  const playback = state.requests.playback?.body || {};
  const mediaHeaders = state.requests.media?.headers || {};
  const txid = firstString(
    pick(verification, 'txid'),
    claim?.txid,
    claim?.meta?.txid,
    pick(claim, 'transaction_hash', 'transaction-hash')
  );
  const nout = firstString(pick(verification, 'nout'), claim?.nout, claim?.meta?.nout);
  const descriptorPath = pick(verification, 'descriptor-store-path', 'descriptor_store_path');
  const streamPath = pick(verification, 'stream-store-path', 'stream_store_path');
  const claimPath = pick(verification, 'claim-store-path', 'claim_store_path');
  const channelPath = pick(verification, 'channel-store-path', 'channel_store_path');
  const claimProofPath = pick(verification, 'claim-proof-store-path', 'claim_proof_store_path');
  const claimOutputId = txid && nout !== undefined ? `${txid}:${nout}` : undefined;
  const channelPublicKey = firstString(
    pick(signingChannel?.value, 'public_key', 'public-key'),
    pick(signingChannel, 'public_key', 'public-key'),
    pick(state.requests.channelClaim?.body, 'public-key', 'public_key')
  );
  const mediaUrl = state.mediaUrl;
  const mediaPath = mediaUrl ? safePath(mediaUrl) : '';

  const steps: Step[] = [
    {
      title: __('Parse input'),
      subtitle: claimId ? `claim ${shorten(claimId)}` : uri,
      status: claimId || uri ? __('client-observed') : __('pending'),
      statusKind: claimId || uri ? 'ok' : 'pending',
      question: __('What did the browser start with?'),
      explanation: __(
        'The page starts with an Odysee URL and the claim metadata already loaded by the app. HyperBEAM receives only the public locator needed for playback.'
      ),
      catchText: __(
        'This catches accidental use of private playback parameters before the request leaves the frontend.'
      ),
      proofRows: [
        [__('url'), uri],
        [__('claim id'), claimId],
        [__('claim name'), claimName],
        [__('channel id'), channelId],
      ],
    },
    {
      title: __('Resolve claim'),
      subtitle: state.requests.claim ? requestSubtitle(state.requests.claim) : __('claim locator request'),
      status: requestStatus(state.requests.claim, claimId ? __('hyperbeam-signed') : __('pending')),
      statusKind: requestStatusKind(state.requests.claim, claimId ? 'trusted' : 'pending'),
      question: __('Which public claim does the name point at?'),
      explanation: __(
        'The claim locator path returns a node-signed view of the public claim. It is useful for debugging locator/currentness behavior, while raw source proof uses the txid:nout object below.'
      ),
      catchText: __('This catches a node resolving the page name to a different public claim than the page expected.'),
      proofRows: [
        [__('claim store'), claimPath],
        [__('claim proof store'), claimProofPath],
        [__('proof strength'), pick(verification, 'proof-strength', 'claim-proof-strength')],
        [__('claim op'), pick(verification, 'claim-op')],
      ],
      requests: compactRequests([state.requests.claim]),
    },
    {
      title: __('Stream transaction'),
      subtitle: txid ? `txid ${shorten(txid)}` : __('waiting for transaction id'),
      status: requestStatus(state.requests.streamSource, txid ? __('client-verifiable') : __('pending')),
      statusKind: requestStatusKind(state.requests.streamSource, txid ? 'ok' : 'pending'),
      question: __('Are these the real on-chain transaction bytes?'),
      explanation: __(
        'HyperBEAM reads the stream transaction by native txid. The response exposes source commitments in HTTP headers so a verifier can bind the response to the raw LBRY transaction object.'
      ),
      catchText: __(
        'This catches modified or substituted transaction bytes because the native commitment would no longer match the requested txid.'
      ),
      proofRows: [
        [__('txid'), txid],
        [__('nout'), nout],
        [__('source bytes'), formatBytes(state.requests.streamSource?.bodyBytes)],
        [__('native id'), nativeIdFromRequest(state.requests.streamSource) || txid],
      ],
      requests: compactRequests([state.requests.streamSource]),
    },
    {
      title: __('Claim output'),
      subtitle: claimOutputId ? `outpoint ${shorten(claimOutputId)}` : __('waiting for outpoint'),
      status: requestStatus(state.requests.claimOutputSource, claimOutputId ? __('client-verifiable') : __('pending')),
      statusKind: requestStatusKind(state.requests.claimOutputSource, claimOutputId ? 'ok' : 'pending'),
      question: __('Which output actually contains the stream claim?'),
      explanation: __(
        'The canonical source object is txid:nout. The claim id is an index, while this outpoint identifies the raw chain output carrying the stream claim.'
      ),
      catchText: __(
        'This catches a node swapping the claim envelope or using a claim id without the matching source output.'
      ),
      proofRows: [
        [__('outpoint'), claimOutputId],
        [__('claim id'), claimId],
        [__('claim proof store'), claimProofPath],
        [__('claim output bytes'), formatBytes(state.requests.claimOutputSource?.bodyBytes)],
      ],
      requests: compactRequests([state.requests.claimOutputSource]),
    },
    {
      title: __('Channel evidence'),
      subtitle: channelId ? `channel ${shorten(channelId)}` : __('no signing channel'),
      status: channelId ? requestStatus(state.requests.channelClaim, __('trusted')) : __('not applicable'),
      statusKind: channelId ? requestStatusKind(state.requests.channelClaim, 'trusted') : 'pending',
      question: __('Whose channel supposedly published this?'),
      explanation: __(
        'The signed stream claim names its channel. The debug view fetches the channel claim separately, then shows the public key and source path used as channel evidence.'
      ),
      catchText: __(
        'This catches a node substituting a different channel or public key to make a forged signature look valid.'
      ),
      proofRows: [
        [__('channel id'), channelId],
        [__('channel name'), channelName],
        [__('channel store'), channelPath],
        [__('channel claim op'), pick(verification, 'channel-claim-op')],
        [__('public key'), shorten(channelPublicKey, 72)],
      ],
      requests: compactRequests([state.requests.channelClaim, state.requests.channelSource]),
    },
    {
      title: __('Descriptor'),
      subtitle: descriptorPath
        ? `descriptor ${shorten(String(descriptorPath).split('/').pop() || '')}`
        : source.sd_hash
          ? `sd_hash ${shorten(source.sd_hash)}`
          : __('waiting for descriptor'),
      status: descriptorPath || source.sd_hash ? __('client-verifiable') : __('pending'),
      statusKind: descriptorPath || source.sd_hash ? 'ok' : 'pending',
      question: __('Which descriptor maps the claim to media blobs?'),
      explanation: __(
        'The stream claim signs the sd_hash. HyperBEAM records the descriptor store path and source hash so the media route can be tied back to that descriptor.'
      ),
      catchText: __(
        'This catches descriptor substitution: a different descriptor would not match the signed sd_hash/source hash evidence.'
      ),
      proofRows: [
        [__('sd_hash'), pick(verification, 'sd-hash', 'sd_hash') || source.sd_hash],
        [__('signed sd_hash'), pick(verification, 'signed-sd-hash', 'signed_sd_hash')],
        [__('source hash'), pick(verification, 'source-hash', 'source_hash') || source.hash],
        [__('source size'), pick(verification, 'source-size', 'source_size') || source.size],
        [__('descriptor store'), descriptorPath],
        [__('stream store'), streamPath],
      ],
    },
    {
      title: __('Playback route'),
      subtitle: state.requests.playback ? requestSubtitle(state.requests.playback) : __('playback request'),
      status: requestStatus(state.requests.playback, mediaUrl ? __('hyperbeam-routed') : __('pending')),
      statusKind: requestStatusKind(state.requests.playback, mediaUrl ? 'ok' : 'pending'),
      question: __('How does the page get a playable URL?'),
      explanation: __(
        'The video player calls the HyperBEAM playback route. That route resolves the public stream and returns the media URL the native browser video element can consume.'
      ),
      catchText: __(
        'This catches frontend fallback to the original Odysee path when the debug route is expected to go through HyperBEAM.'
      ),
      proofRows: [
        [__('request'), safePath(playbackRequestUrl)],
        [__('media url'), mediaPath],
        [__('media type'), pick(playback, 'media_type', 'media-type') || source.media_type],
        [__('duration'), formatDuration(pick(playback, 'duration'))],
      ],
      requests: compactRequests([state.requests.playback]),
    },
    {
      title: __('Media bytes'),
      subtitle: mediaUrl ? mediaPath : __('waiting for media URL'),
      status: requestStatus(
        state.requests.media,
        mediaHeaders.signature && mediaHeaders['signature-input'] ? __('hyperbeam-signed') : __('pending')
      ),
      statusKind: requestStatusKind(
        state.requests.media,
        mediaHeaders.signature && mediaHeaders['signature-input'] ? 'ok' : 'pending'
      ),
      question: __('Can the browser stream byte ranges?'),
      explanation: __(
        'The final probe is a HEAD request against the playable media route. Range and digest headers show that the browser can stream video bytes while still seeing HyperBEAM response commitments.'
      ),
      catchText: __(
        'This catches missing range support, missing digest headers, or accidental CDN-only playback in the debug flow.'
      ),
      proofRows: [
        [__('accept-ranges'), mediaHeaders['accept-ranges']],
        [__('content-length'), mediaHeaders['content-length']],
        [__('content-range'), mediaHeaders['content-range']],
        [__('content-digest'), shorten(mediaHeaders['content-digest'], 96)],
        [__('signature-input'), signatureInputSummary(mediaHeaders['signature-input'])],
      ],
      requests: compactRequests([state.requests.media]),
    },
  ];

  return renderDebugPortal(
    <section
      className={`hyperbeam-debug ${open ? 'hyperbeam-debug--open' : 'hyperbeam-debug--closed'}`}
      role="dialog"
      aria-label={__('HyperBEAM playback trace')}
    >
      <DebugTopbar
        copied={copied}
        open={open}
        subtitle={
          state.loading
            ? __('loading')
            : mediaUrl
              ? `media ${safePath(mediaUrl)}`
              : claimName || claimId || __('waiting')
        }
        onCopy={copyTrace}
        onClose={() => setDismissed(true)}
        onToggle={() => setOpen((value) => !value)}
      />

      {open && (
        <div className="hyperbeam-debug__body">
          <DebugHeader status={state.loading ? __('loading') : mediaUrl ? __('ready') : __('waiting')} />

          {state.verificationError && (
            <div className="hyperbeam-debug__notice hyperbeam-debug__notice--error">
              <strong>{__('verification request failed')}</strong>
              <span>{state.verificationError}</span>
            </div>
          )}

          <div className="hyperbeam-debug__steps">
            {steps.map((step, index) => (
              <StepCard index={index} key={step.title} step={step} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function DebugTopbar({
  copied,
  open,
  subtitle,
  onClose,
  onCopy,
  onToggle,
}: {
  copied: boolean;
  open: boolean;
  subtitle: string;
  onClose: () => void;
  onCopy: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onToggle: () => void;
}) {
  return (
    <div className="hyperbeam-debug__topbar">
      <button className="hyperbeam-debug__toggle" type="button" onClick={onToggle}>
        <span>{open ? __('HyperBEAM playback trace hide') : __('HyperBEAM playback trace show')}</span>
        <small>{subtitle}</small>
      </button>
      {open && (
        <button className="hyperbeam-debug__copy" type="button" onClick={onCopy}>
          {copied ? __('copied') : __('copy json')}
        </button>
      )}
      <button
        className="hyperbeam-debug__close"
        type="button"
        title={__('Close HyperBEAM playback trace')}
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
      >
        x
      </button>
    </div>
  );
}

function renderDebugPortal(content: React.ReactNode) {
  return typeof document === 'undefined' ? content : createPortal(content, document.body);
}

function DebugHeader({ status }: { status: string }) {
  return (
    <div className="hyperbeam-debug__header">
      <div>
        <div className="hyperbeam-debug__eyebrow">{__('HyperBEAM proof path')}</div>
        <h2>{__('Name to bytes')}</h2>
        <p>{__('Public Odysee locator -> native source objects -> signed byte-range media response.')}</p>
      </div>
      <code>{status}</code>
    </div>
  );
}

function StepCard({ index, step }: { index: number; step: Step }) {
  return (
    <details className={`hyperbeam-debug__step hyperbeam-debug__step--${step.statusKind}`} open>
      <summary>
        <span className="hyperbeam-debug__step-title">{`${index + 1}. ${step.title}`}</span>
        <span className="hyperbeam-debug__step-subtitle">{step.subtitle}</span>
        <strong>{step.status}</strong>
      </summary>

      {(step.question || step.explanation || step.catchText) && (
        <div className="hyperbeam-debug__explain">
          {step.question && <h3>{step.question}</h3>}
          {step.explanation && <p>{step.explanation}</p>}
          {step.catchText && <p className="hyperbeam-debug__catch">{step.catchText}</p>}
        </div>
      )}

      {step.proofRows && <ProofRows rows={step.proofRows} />}

      {step.requests && step.requests.length > 0 && (
        <div className="hyperbeam-debug__request-list">
          <div className="hyperbeam-debug__section-label">{__('requests')}</div>
          {step.requests.map((request) => (
            <RequestBlock key={`${request.kind}:${request.method}:${request.url}`} request={request} />
          ))}
        </div>
      )}
    </details>
  );
}

function ProofRows({ rows }: { rows: Array<[string, string | number | boolean | null | undefined]> }) {
  const visibleRows = rows.filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (visibleRows.length === 0) return null;

  return (
    <div className="hyperbeam-debug__proof">
      <div className="hyperbeam-debug__section-label">{__('proof')}</div>
      <dl>
        {visibleRows.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt>{label}</dt>
            <dd>{String(value)}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}

function RequestBlock({ request }: { request: DebugRequest }) {
  const commitments = commitmentsFromRequest(request);
  const rawSignatureInput = request.headers['signature-input'];

  return (
    <div
      className={`hyperbeam-debug__request hyperbeam-debug__request--${
        request.error || (request.status && request.status >= 400) ? 'error' : request.kind.toLowerCase()
      }`}
    >
      <div className="hyperbeam-debug__request-line">
        <span className="hyperbeam-debug__request-kind">{request.kind}</span>
        <strong>{request.method}</strong>
        <code>{request.path}</code>
        <span>
          {request.error
            ? `failed (${request.error})`
            : `-> ${request.status || 'pending'} (${request.elapsedMs || 0}ms)`}
        </span>
      </div>

      {request.bodyBytes !== undefined && (
        <p className="hyperbeam-debug__request-note">{`${__('body')}: ${formatBytes(request.bodyBytes)}`}</p>
      )}

      {commitments.length > 0 && (
        <div className="hyperbeam-debug__commitments">
          {commitments.map((commitment) => (
            <CommitmentCard commitment={commitment} kind={request.kind} key={`${request.url}:${commitment.label}`} />
          ))}
        </div>
      )}

      {rawSignatureInput && (
        <details className="hyperbeam-debug__raw">
          <summary>{__('raw signature-input header')}</summary>
          <code>{rawSignatureInput}</code>
        </details>
      )}
    </div>
  );
}

function CommitmentCard({ commitment, kind }: { commitment: SignatureInput; kind: DebugRequestKind }) {
  const cardKind = commitmentKind(commitment, kind);

  return (
    <div className={`hyperbeam-debug__commitment hyperbeam-debug__commitment--${cardKind}`}>
      <div className="hyperbeam-debug__commitment-heading">
        <span>{commitmentLabel(cardKind)}</span>
        {commitment.alg && <strong>{`alg="${commitment.alg}"`}</strong>}
      </div>
      {commitment.keyid && <p>{`${__('keyid')}: ${shorten(commitment.keyid, 86)}`}</p>}
      {commitment.nativeId && <p>{`${__('native-id')}: ${commitment.nativeId}`}</p>}
      {commitment.covered.length > 0 && <p>{`${__('covers')}: ${commitment.covered.join(', ')}`}</p>}
      <p>{`${__('commitment label')}: ${commitment.label}`}</p>
    </div>
  );
}

async function fetchDebugRequest(kind: DebugRequestKind, url: string, init: RequestInit = {}): Promise<DebugRequest> {
  const method = String(init.method || 'GET').toUpperCase();
  const started = performance.now();

  try {
    const response = await fetch(url, {
      ...init,
      method,
      signal: timeoutSignal(TIMEOUT_MS),
    });
    const headers = headersToObject(response.headers);
    const result: DebugRequest = {
      kind,
      method,
      url,
      path: safePath(url),
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      elapsedMs: Math.round(performance.now() - started),
      headers,
    };

    if (method !== 'HEAD') {
      const body = await readResponseBody(response, headers);
      Object.assign(result, body);
    }

    return result;
  } catch (error) {
    return {
      kind,
      method,
      url,
      path: safePath(url),
      ok: false,
      elapsedMs: Math.round(performance.now() - started),
      headers: {},
      error: errorMessage(error),
    };
  }
}

async function readResponseBody(
  response: Response,
  headers: Record<string, string>
): Promise<Pick<DebugRequest, 'body' | 'bodyText' | 'bodyBytes'>> {
  const buffer = await response.arrayBuffer();
  const bodyBytes = buffer.byteLength;
  if (bodyBytes === 0 || bodyBytes > BODY_PREVIEW_LIMIT) return { bodyBytes };

  const bodyText = new TextDecoder().decode(buffer);
  const contentType = headers['content-type'] || '';
  if (contentType.includes('json') || bodyText.trim().startsWith('{') || bodyText.trim().startsWith('[')) {
    try {
      return { body: JSON.parse(bodyText), bodyBytes };
    } catch {
      return { bodyText, bodyBytes };
    }
  }

  return { bodyText, bodyBytes };
}

function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
}

function hyperbeamBaseUrl(playbackRequestUrl: string): string {
  if (HYPERBEAM_BASE_URL) return String(HYPERBEAM_BASE_URL).replace(/\/$/, '');

  try {
    return new URL(playbackRequestUrl).origin;
  } catch {
    return '';
  }
}

function buildDeviceUrl(baseUrl: string, path: string, params: Record<string, string>): string {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

function compactRequests(requests: Array<DebugRequest | undefined>): DebugRequest[] {
  return requests.filter(Boolean);
}

function commitmentsFromRequest(request: DebugRequest): SignatureInput[] {
  return parseSignatureInput(request.headers['signature-input']);
}

function parseSignatureInput(header: string | null | undefined): SignatureInput[] {
  if (!header) return [];

  return splitHeaderEntries(header)
    .map((entry) => {
      const labelMatch = entry.match(/^\s*([^=]+)=/);
      const coveredMatch = entry.match(/\(([^)]*)\)/);
      if (!labelMatch) return null;

      return {
        label: labelMatch[1].trim(),
        covered: coveredMatch ? coveredMatch[1].replace(/"/g, '').split(/\s+/).filter(Boolean) : [],
        alg: paramValue(entry, 'alg'),
        keyid: paramValue(entry, 'keyid'),
        tag: paramValue(entry, 'tag'),
        nativeId: paramValue(entry, 'native-id'),
      };
    })
    .filter(Boolean) as SignatureInput[];
}

function splitHeaderEntries(header: string): string[] {
  const entries: string[] = [];
  let current = '';
  let inQuotes = false;
  let parenDepth = 0;

  for (const char of header) {
    if (char === '"' && current[current.length - 1] !== '\\') inQuotes = !inQuotes;
    if (!inQuotes && char === '(') parenDepth += 1;
    if (!inQuotes && char === ')') parenDepth = Math.max(0, parenDepth - 1);

    if (!inQuotes && parenDepth === 0 && char === ',') {
      if (current.trim()) entries.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) entries.push(current.trim());
  return entries;
}

function paramValue(entry: string, name: string): string | undefined {
  const match = entry.match(new RegExp(`;${name}=("[^"]*"|[^;,\\s]+)`));
  if (!match) return undefined;
  return match[1].replace(/^"|"$/g, '');
}

function commitmentKind(commitment: SignatureInput, requestKind: DebugRequestKind): 'source' | 'node' | 'derived' {
  if (commitment.alg?.startsWith('lbry-')) return 'source';
  if (commitment.alg?.includes('rsa-pss')) return 'node';
  if (commitment.alg?.includes('hmac') || commitment.keyid === 'constant:ao') return 'derived';
  return requestKind === 'SOURCE' ? 'source' : 'node';
}

function commitmentLabel(kind: 'source' | 'node' | 'derived'): string {
  if (kind === 'source') return __('source-format commitment');
  if (kind === 'node') return __('node transport signature');
  return __('derived message-id commitment');
}

function nativeIdFromRequest(request: DebugRequest | undefined): string | undefined {
  return parseSignatureInput(request?.headers['signature-input']).find((input) => input.nativeId)?.nativeId;
}

function requestSubtitle(request: DebugRequest): string {
  return `${request.method} ${request.path}`;
}

function requestStatus(request: DebugRequest | undefined, fallback: string): string {
  if (!request) return fallback;
  if (request.error) return __('failed');
  if (request.status && request.status >= 400) return String(request.status);
  return request.headers['signature-input'] ? __('signed') : fallback;
}

function requestStatusKind(request: DebugRequest | undefined, fallback: Step['statusKind']): Step['statusKind'] {
  if (!request) return fallback;
  if (request.error || (request.status && request.status >= 400)) return 'error';
  return request.headers['signature-input'] ? 'ok' : fallback;
}

function pick(source: any, ...keys: string[]): any {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null) return source[key];
  }
}

function firstString(...values: any[]): string | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
}

function shorten(value: string | null | undefined, maxLength = 32): string | undefined {
  if (!value) return undefined;
  return value.length > maxLength ? `${value.slice(0, Math.ceil(maxLength / 2))}...${value.slice(-8)}` : value;
}

function safePath(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

function signatureInputSummary(signatureInput: string | null | undefined): string | undefined {
  const commitments = parseSignatureInput(signatureInput);
  if (commitments.length === 0) return signatureInput ? __('present') : undefined;
  return commitments
    .map((commitment) => `${commitment.label}: ${commitment.covered.slice(0, 5).join(', ')}`)
    .join(' | ');
}

function formatDuration(value: any): string | undefined {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function formatBytes(value: any): string | undefined {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeoutSignal(ms: number): AbortSignal | undefined {
  const timeout = typeof AbortSignal !== 'undefined' && (AbortSignal as any).timeout;
  return typeof timeout === 'function' ? timeout(ms) : undefined;
}

function errorMessage(error: any): string {
  return error && error.name === 'AbortError' ? __('request timed out') : String(error?.message || error);
}
