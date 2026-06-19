import React from 'react';
import { useLocation } from 'react-router-dom';
import { buildHyperbeamPlaybackUrl } from 'util/hyperbeam-playback';
import { fetchHyperbeamStreamVerification } from 'util/hyperbeam';
import './style.lazy.scss';

const TIMEOUT_MS = 8000;

type Props = {
  uri: string;
  claim?: any;
  accessStatus?: string | null;
};

type FetchState = {
  playback?: any;
  playbackError?: string;
  verification?: any;
  verificationError?: string;
  mediaHeaders?: Record<string, string>;
  mediaError?: string;
  mediaUrl?: string;
  loading: boolean;
};

type Step = {
  title: string;
  detail: string;
  status: string;
  statusKind: 'ok' | 'pending' | 'warn' | 'error';
  rows?: Array<[string, string | null | undefined]>;
};

export default function HyperbeamPlaybackDebug({ uri, claim, accessStatus }: Props) {
  const { search } = useLocation();
  const urlParams = React.useMemo(() => new URLSearchParams(search), [search]);
  const enabled = urlParams.get('hb_debug') === '1' || urlParams.get('hb_debug') === 'true';
  const protectedPlayback = Boolean(accessStatus);
  const claimId = claim?.claim_id;
  const claimName = claim?.name;
  const channelId = claim?.signing_channel?.claim_id;
  const source = claim?.value?.source || {};
  const playbackRequestUrl = React.useMemo(() => buildHyperbeamPlaybackUrl(uri), [uri]);
  const [state, setState] = React.useState<FetchState>({ loading: false });
  const [open, setOpen] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!enabled || protectedPlayback || !playbackRequestUrl) return;

    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    async function load() {
      setState({ loading: true });

      const nextState: FetchState = { loading: false };

      try {
        nextState.verification = await fetchHyperbeamStreamVerification(claim, uri);
      } catch (error) {
        nextState.verificationError = errorMessage(error);
      }

      try {
        const response = await fetch(playbackRequestUrl, { signal: controller.signal });
        nextState.playback = response.ok ? await response.json() : null;
        if (!response.ok) nextState.playbackError = `${response.status} ${response.statusText}`;
      } catch (error) {
        nextState.playbackError = errorMessage(error);
      }

      const mediaUrl = pick(nextState.playback, 'download_url', 'download-url', 'streaming_url', 'streaming-url');
      nextState.mediaUrl = typeof mediaUrl === 'string' ? mediaUrl : undefined;

      if (nextState.mediaUrl) {
        try {
          const response = await fetch(nextState.mediaUrl, {
            method: 'HEAD',
            signal: controller.signal,
          });
          nextState.mediaHeaders = headersToObject(response.headers);
          if (!response.ok) nextState.mediaError = `${response.status} ${response.statusText}`;
        } catch (error) {
          nextState.mediaError = errorMessage(error);
        }
      }

      clearTimeout(timer);
      if (!cancelled) setState(nextState);
    }

    load();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [claim, enabled, playbackRequestUrl, protectedPlayback, uri]);

  if (!enabled) return null;

  const copyTrace = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const trace = JSON.stringify(
      {
        type: 'odysee_hyperbeam_playback_trace',
        generated_at: new Date().toISOString(),
        uri,
        claim_id: claimId,
        claim_name: claimName,
        playback_request_url: playbackRequestUrl,
        media_url: state.mediaUrl,
        verification: state.verification,
        playback: state.playback,
        media_headers: state.mediaHeaders,
        errors: {
          verification: state.verificationError,
          playback: state.playbackError,
          media: state.mediaError,
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
    return (
      <section
        className={`hyperbeam-debug ${open ? 'hyperbeam-debug--open' : 'hyperbeam-debug--closed'}`}
        role="dialog"
        aria-label={__('HyperBEAM playback trace')}
      >
        <div className="hyperbeam-debug__topbar">
          <button className="hyperbeam-debug__toggle" type="button" onClick={() => setOpen((value) => !value)}>
            <span>{__('HyperBEAM playback trace')}</span>
            <small>{__('protected content')}</small>
          </button>
        </div>

        {open && (
          <div className="hyperbeam-debug__body">
            <div className="hyperbeam-debug__header">
              <div>
                <div className="hyperbeam-debug__eyebrow">{__('HyperBEAM playback trace')}</div>
                <h2>{__('Name to bytes')}</h2>
              </div>
              <code>{__('skipped')}</code>
            </div>

            <details className="hyperbeam-debug__step hyperbeam-debug__step--warn" open>
              <summary>
                <span>{__('Protected playback')}</span>
                <strong>{__('not traced')}</strong>
              </summary>
              <p>{__('Debug playback tracing is disabled for protected content so access keys stay off HyperBEAM.')}</p>
            </details>
          </div>
        )}
      </section>
    );
  }

  const verification = state.verification || {};
  const playback = state.playback || {};
  const headers = state.mediaHeaders || {};
  const mediaUrl = state.mediaUrl;
  const descriptorPath = pick(verification, 'descriptor-store-path', 'descriptor_store_path');
  const streamPath = pick(verification, 'stream-store-path', 'stream_store_path');
  const claimProofPath = pick(verification, 'claim-proof-store-path', 'claim_proof_store_path');
  const mediaPath = mediaUrl ? safePath(mediaUrl) : '';
  const signedFields = signedHeaderFields(headers['signature-input']);

  const steps: Step[] = [
    {
      title: __('Page input'),
      detail: claimName ? `name: ${claimName}` : uri,
      status: claimName || uri ? __('ready') : __('pending'),
      statusKind: claimName || uri ? 'ok' : 'pending',
      rows: [
        [__('uri'), uri],
        [__('claim id'), claimId],
      ],
    },
    {
      title: __('Claim resolved'),
      detail: claimId ? `claim_id ${shorten(claimId)}` : __('waiting for Odysee claim data'),
      status: claimId ? __('resolved') : __('pending'),
      statusKind: claimId ? 'ok' : 'pending',
      rows: [
        [__('channel id'), channelId],
        [__('claim proof'), claimProofPath],
      ],
    },
    {
      title: __('Stream object'),
      detail: state.verificationError
        ? state.verificationError
        : streamPath
          ? `store path ${streamPath}`
          : state.loading
            ? __('checking stream verification')
            : __('no stream verification returned'),
      status: state.verificationError
        ? __('failed')
        : streamPath || verification.device
          ? __('hyperbeam')
          : __('pending'),
      statusKind: state.verificationError ? 'error' : streamPath || verification.device ? 'ok' : 'pending',
      rows: [
        [__('device'), pick(verification, 'device')],
        [__('stream store'), streamPath],
        [__('txid'), pick(verification, 'txid')],
      ],
    },
    {
      title: __('Descriptor and source'),
      detail: descriptorPath
        ? `descriptor ${shorten(String(descriptorPath).split('/').pop() || '')}`
        : source.sd_hash
          ? `sd_hash ${shorten(source.sd_hash)}`
          : __('waiting for source metadata'),
      status: descriptorPath || source.sd_hash ? __('linked') : __('pending'),
      statusKind: descriptorPath || source.sd_hash ? 'ok' : 'pending',
      rows: [
        [__('sd_hash'), pick(verification, 'sd-hash', 'sd_hash') || source.sd_hash],
        [__('source hash'), pick(verification, 'source-hash', 'source_hash') || source.hash],
        [__('source size'), pick(verification, 'source-size', 'source_size') || source.size],
        [__('descriptor store'), descriptorPath],
      ],
    },
    {
      title: __('Playback route'),
      detail: state.playbackError
        ? state.playbackError
        : mediaPath
          ? mediaPath
          : state.loading
            ? __('resolving playback URL')
            : __('no playback URL returned'),
      status: state.playbackError ? __('failed') : mediaUrl ? __('media URL') : __('pending'),
      statusKind: state.playbackError ? 'error' : mediaUrl ? 'ok' : 'pending',
      rows: [
        [__('request'), safePath(playbackRequestUrl)],
        [__('media type'), pick(playback, 'media_type', 'media-type') || source.media_type],
        [__('duration'), formatDuration(pick(playback, 'duration'))],
      ],
    },
    {
      title: __('Byte response'),
      detail: state.mediaError
        ? state.mediaError
        : headers.signature && headers['signature-input']
          ? __('range-capable media with HyperBEAM HTTP signatures')
          : state.loading
            ? __('checking media headers')
            : __('media headers not signed or not available'),
      status: state.mediaError
        ? __('failed')
        : headers.signature && headers['signature-input']
          ? __('signed')
          : __('pending'),
      statusKind: state.mediaError ? 'error' : headers.signature && headers['signature-input'] ? 'ok' : 'pending',
      rows: [
        [__('accept-ranges'), headers['accept-ranges']],
        [__('content-length'), headers['content-length']],
        [__('content-digest'), shorten(headers['content-digest'])],
        [__('signature'), headers.signature ? __('present') : undefined],
        [__('signature-input'), signedFields || (headers['signature-input'] ? __('present') : undefined)],
      ],
    },
  ];

  return (
    <section
      className={`hyperbeam-debug ${open ? 'hyperbeam-debug--open' : 'hyperbeam-debug--closed'}`}
      role="dialog"
      aria-label={__('HyperBEAM playback trace')}
    >
      <div className="hyperbeam-debug__topbar">
        <button className="hyperbeam-debug__toggle" type="button" onClick={() => setOpen((value) => !value)}>
          <span>{__('HyperBEAM playback trace')}</span>
          <small>
            {state.loading
              ? __('loading')
              : mediaUrl
                ? `media ${safePath(mediaUrl)}`
                : claimName || claimId || __('waiting')}
          </small>
        </button>
        <button className="hyperbeam-debug__copy" type="button" onClick={copyTrace}>
          {copied ? __('copied') : __('copy')}
        </button>
      </div>

      {open && (
        <div className="hyperbeam-debug__body">
          <div className="hyperbeam-debug__header">
            <div>
              <div className="hyperbeam-debug__eyebrow">{__('HyperBEAM playback trace')}</div>
              <h2>{__('Name to bytes')}</h2>
            </div>
            <code>{state.loading ? __('loading') : mediaUrl ? __('ready') : __('waiting')}</code>
          </div>

          <div className="hyperbeam-debug__steps">
            {steps.map((step, index) => (
              <details
                className={`hyperbeam-debug__step hyperbeam-debug__step--${step.statusKind}`}
                key={step.title}
                open
              >
                <summary>
                  <span>{`${index + 1}. ${step.title}`}</span>
                  <strong>{step.status}</strong>
                </summary>
                <p>{step.detail}</p>
                {step.rows && (
                  <dl>
                    {step.rows
                      .filter(([, value]) => value !== undefined && value !== null && value !== '')
                      .map(([label, value]) => (
                        <React.Fragment key={label}>
                          <dt>{label}</dt>
                          <dd>{String(value)}</dd>
                        </React.Fragment>
                      ))}
                  </dl>
                )}
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
}

function pick(source: any, ...keys: string[]): any {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null) return source[key];
  }
}

function shorten(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return value.length > 24 ? `${value.slice(0, 14)}...${value.slice(-8)}` : value;
}

function safePath(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

function signedHeaderFields(signatureInput: string | null | undefined): string | undefined {
  if (!signatureInput) return undefined;
  const match = signatureInput.match(/\(([^)]*)\)/);
  if (!match) return __('present');
  const fields = match[1].replace(/"/g, '').split(/\s+/).filter(Boolean);
  return fields.length > 6 ? `${fields.slice(0, 6).join(', ')}, ...` : fields.join(', ');
}

function formatDuration(value: any): string | undefined {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function errorMessage(error: any): string {
  return error && error.name === 'AbortError' ? __('request timed out') : String(error?.message || error);
}
