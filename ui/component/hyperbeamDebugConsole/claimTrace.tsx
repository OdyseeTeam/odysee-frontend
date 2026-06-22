import React from 'react';
import { sanitizeHyperbeamDebugValue, sanitizeHyperbeamDebugUrl, type HyperbeamDebugEvent } from 'util/hyperbeamDebug';
import { HYPERBEAM_DEVICE, hyperbeamDeviceUrl } from 'util/hyperbeamDevices';

type TraceStatus = 'pending' | 'running' | 'ok' | 'warn' | 'failed' | 'skipped';
type TraceKind = 'input' | 'locator' | 'source' | 'facade' | 'transport';

type TraceStep = {
  key: string;
  label: string;
  kind: TraceKind;
  status: TraceStatus;
  detail?: string;
  url?: string;
  statusCode?: number;
  sourceAlg?: string;
  response?: any;
};

type DiscoveredClaim = {
  key: string;
  label: string;
  traceTarget: string;
  claimId?: string;
  txid?: string;
  nout?: string;
  sdHash?: string;
  provenance: 'page' | 'visible' | 'observed';
  source: string;
  valueType?: string;
  order?: number;
  summary?: any;
};

export default function ClaimTrace({ events }: { events: Array<HyperbeamDebugEvent> }) {
  const [renderedClaimVersion, setRenderedClaimVersion] = React.useState(0);
  const discoveredClaims = React.useMemo(() => discoverClaims(events), [events, renderedClaimVersion]);
  const pageClaims = discoveredClaims.filter((claim) => claim.provenance !== 'observed');
  const observedClaims = discoveredClaims.filter((claim) => claim.provenance === 'observed');
  const [target, setTarget] = React.useState('');
  const [steps, setSteps] = React.useState<Array<TraceStep>>(() => initialSteps(''));
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const materializedEvidence = React.useRef<Set<string>>(new Set());
  const displayedClaims = pageClaims.length === 0 ? observedClaims : pageClaims;
  const displayedClaimLabel = pageClaims.length === 0 ? 'current page responses' : 'page / visible';
  const selectedClaim = React.useMemo(
    () => discoveredClaims.find((claim) => claim.traceTarget === target),
    [discoveredClaims, target]
  );

  React.useEffect(() => {
    const appRoot = document.querySelector('#app') || document.body;
    let frame = 0;
    const bump = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setRenderedClaimVersion((version) => version + 1));
    };
    const observer = new MutationObserver(bump);
    observer.observe(appRoot, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-hyperbeam-claim-id'],
    });
    const timer = window.setTimeout(bump, 1000);
    bump();
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  React.useEffect(() => {
    if (target || discoveredClaims.length === 0) return;
    const firstClaim = pageClaims[0] || observedClaims[0];
    if (!firstClaim) return;
    setTarget(firstClaim.traceTarget);
    setSteps(initialSteps(firstClaim.traceTarget, firstClaim, events));
  }, [discoveredClaims.length, events, observedClaims, pageClaims, target]);

  React.useEffect(() => {
    if (!target || !selectedClaim) return;
    setSteps(initialSteps(target, selectedClaim, events));
  }, [events, selectedClaim, target]);

  React.useEffect(() => {
    if (!selectedClaim) return;

    const requests: Array<Promise<Response | null>> = [];
    const enqueue = (key: string, url: string) => {
      if (!url || materializedEvidence.current.has(key)) return;
      materializedEvidence.current.add(key);
      requests.push(fetch(url, { headers: { accept: 'application/json' } }).catch(() => null));
    };

    if (selectedClaim.txid && !cachedSourceObservation(events, selectedClaim.txid)) {
      enqueue(
        `tx:${selectedClaim.txid}`,
        hyperbeamDeviceUrl(HYPERBEAM_DEVICE.odysee, 'transaction', { txid: selectedClaim.txid })
      );
    }

    if (
      selectedClaim.valueType === 'stream' &&
      selectedClaim.sdHash &&
      !cachedSourceObservation(events, selectedClaim.sdHash)
    ) {
      enqueue(
        `descriptor:${selectedClaim.sdHash}`,
        hyperbeamDeviceUrl(HYPERBEAM_DEVICE.odysee, 'descriptor', { 'sd-hash': selectedClaim.sdHash })
      );
    }

    if (requests.length !== 0) Promise.allSettled(requests);
  }, [events, selectedClaim]);

  const selectClaim = React.useCallback(
    (claim: DiscoveredClaim) => {
      setTarget(claim.traceTarget);
      setSteps(initialSteps(claim.traceTarget, claim, events));
    },
    [events]
  );

  return (
    <div
      style={{
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        minWidth: 0,
        width: '100%',
        boxSizing: 'border-box',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        padding: '8px 9px 9px',
        background: 'rgba(255,255,255,0.025)',
      }}
    >
      {displayedClaims.length !== 0 && (
        <div
          style={{
            display: 'grid',
            gap: 4,
            flex: '0 0 auto',
            minWidth: 0,
            maxHeight: 'min(154px, 28vh)',
            overflow: 'auto',
            marginBottom: 6,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            padding: 4,
            background: 'rgba(0,0,0,0.1)',
          }}
        >
          <ClaimGroup label={displayedClaimLabel} claims={displayedClaims} target={target} onSelect={selectClaim} />
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gap: 4,
          flex: '1 1 auto',
          alignContent: 'start',
          gridAutoRows: 'max-content',
          minHeight: 0,
          minWidth: 0,
          overflow: 'auto',
          paddingRight: 2,
        }}
      >
        {steps.map((step, index) => {
          const isExpanded = expanded[step.key];
          return (
            <div
              key={step.key}
              style={{
                minWidth: 0,
                maxWidth: '100%',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                background: 'rgba(0,0,0,0.12)',
              }}
            >
              <button
                type="button"
                onClick={() => setExpanded((current) => ({ ...current, [step.key]: !current[step.key] }))}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
                  alignItems: 'center',
                  gap: 6,
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  border: 0,
                  padding: '4px 6px',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.86)',
                  cursor: 'pointer',
                  font: 'inherit',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', minWidth: 76 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      minWidth: 18,
                      color: 'rgba(255,255,255,0.5)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {index + 1}.
                  </span>
                  <span style={{ color: statusColor(step.status) }}>{isExpanded ? '-' : '+'}</span>
                  <span style={{ color: kindColor(step.kind) }}>{step.kind}</span>
                </span>
                <span
                  style={{
                    minWidth: 0,
                    overflow: isExpanded ? 'visible' : 'hidden',
                    textOverflow: isExpanded ? undefined : 'ellipsis',
                    whiteSpace: isExpanded ? 'normal' : 'nowrap',
                    color: 'rgba(255,255,255,0.86)',
                  }}
                >
                  {step.label}
                  {step.statusCode ? ` · ${step.statusCode}` : ''}
                  {step.sourceAlg ? ` · ${step.sourceAlg}` : ''}
                  {step.detail ? ` · ${step.detail}` : ''}
                </span>
                <span
                  style={{
                    justifySelf: 'end',
                    color: statusColor(step.status),
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.status}
                </span>
              </button>
              {isExpanded && (
                <pre
                  style={{
                    display: 'block',
                    boxSizing: 'border-box',
                    width: 'calc(100% - 12px)',
                    maxWidth: 'calc(100% - 12px)',
                    minWidth: 0,
                    margin: '0 6px 6px',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    color: 'rgba(255,255,255,0.72)',
                  }}
                >
                  {JSON.stringify(
                    sanitizeHyperbeamDebugValue({
                      url: step.url ? sanitizeHyperbeamDebugUrl(step.url) : undefined,
                      detail: step.detail,
                      statusCode: step.statusCode,
                      sourceAlg: step.sourceAlg,
                      response: step.response,
                    }),
                    null,
                    2
                  )}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClaimGroup({
  claims,
  label,
  onSelect,
  target,
}: {
  claims: Array<DiscoveredClaim>;
  label: string;
  onSelect: (claim: DiscoveredClaim) => void;
  target: string;
}) {
  if (claims.length === 0) return null;

  return (
    <>
      <div style={{ color: 'rgba(255,255,255,0.46)', padding: '2px 2px 0' }}>
        {label} {claims.length}
      </div>
      {claims.map((claim) => (
        <button
          key={claim.key}
          type="button"
          onClick={() => onSelect(claim)}
          title={[
            claim.claimId ? `claim ${claim.claimId}` : undefined,
            claim.txid && claim.nout !== undefined ? `outpoint ${claim.txid}:${claim.nout}` : undefined,
            claim.sdHash ? `sd ${claim.sdHash}` : undefined,
            `provenance ${claim.provenance}`,
            claim.source,
          ]
            .filter(Boolean)
            .join(' · ')}
          style={{
            display: 'grid',
            gridTemplateColumns: '76px minmax(0, 1fr) minmax(92px, 148px)',
            gap: 6,
            alignItems: 'center',
            width: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            border: `1px solid ${claim.traceTarget === target ? 'rgba(14,165,233,0.74)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 4,
            padding: '3px 5px',
            background: claim.traceTarget === target ? 'rgba(14,165,233,0.18)' : 'rgba(255,255,255,0.04)',
            color: '#f9fafb',
            cursor: 'pointer',
            font: 'inherit',
            textAlign: 'left',
          }}
        >
          <span style={{ color: provenanceColor(claim.provenance), overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {claim.provenance}
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{claim.label}</span>
          <span
            style={{
              color: 'rgba(255,255,255,0.48)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {claimIdLabel(claim)}
          </span>
        </button>
      ))}
    </>
  );
}

function discoverClaims(events: Array<HyperbeamDebugEvent>): Array<DiscoveredClaim> {
  const claims = new Map<string, DiscoveredClaim>();
  const context = pageClaimContext();

  context.renderedClaims.forEach((claim) => {
    claimAliases({
      claimId: claim.claimId,
      txid: claim.txid,
      nout: claim.nout,
      sdHash: claim.sdHash,
      urls: [claim.traceTarget],
      traceTarget: claim.traceTarget,
    }).forEach((alias) => claims.set(alias, claim));
  });

  events.forEach((event) => {
    const data = event.data || {};
    if (!isCurrentPageEvent(data, context)) return;

    const source = String(data.devicePath || data.url || 'response');
    if (!isClaimResponseSource(source)) return;

    const body = data.body;
    if (!body || typeof body !== 'object') return;

    collectPageChannelIds(body.result, context);
    collectPageChannelIds(body.response, context);
    collectPageChannelIds(body, context);
  });

  events.forEach((event) => {
    const data = event.data || {};
    if (!isCurrentPageEvent(data, context)) return;

    const source = String(data.devicePath || data.url || 'response');
    if (!isClaimResponseSource(source)) return;

    const body = data.body;
    if (!body || typeof body !== 'object') return;

    collectClaims(body.result, claims, source, context);
    collectClaims(body.response, claims, source, context);
    collectClaims(body, claims, source, context);
  });

  return dedupeClaims([...new Set(claims.values())])
    .sort(compareClaims)
    .slice(0, 80);
}

function collectPageChannelIds(value: any, context: PageClaimContext) {
  if (!value) return;

  if (Array.isArray(value)) {
    value.forEach((item) => collectPageChannelIds(item, context));
    return;
  }

  if (typeof value !== 'object') return;

  const valueType = stringField(value, ['value_type', 'value.type', 'claim.value_type', 'raw.value_type']);
  const claimId = stringField(value, ['claim_id', 'claim-id']);
  const urls = [
    stringField(value, ['canonical_url']),
    stringField(value, ['permanent_url']),
    stringField(value, ['short_url']),
  ].filter(Boolean);

  if (valueType === 'channel' && claimId && claimProvenance({ urls, source: 'resolve' }, context) === 'page') {
    context.pageChannelIds.add(claimId);
  }

  if (Array.isArray(value.items)) value.items.forEach((item: any) => collectPageChannelIds(item, context));
  if (Array.isArray(value.claims)) value.claims.forEach((item: any) => collectPageChannelIds(item, context));

  Object.entries(value).forEach(([, item]) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) collectPageChannelIds(item, context);
  });
}

function collectClaims(value: any, claims: Map<string, DiscoveredClaim>, source: string, context: PageClaimContext) {
  if (!value) return;

  if (Array.isArray(value)) {
    value.forEach((item) => collectClaims(item, claims, source, context));
    return;
  }

  if (typeof value !== 'object') return;

  if (Array.isArray(value.items)) value.items.forEach((item: any) => collectClaim(item, claims, source, context));
  if (Array.isArray(value.claims)) value.claims.forEach((item: any) => collectClaim(item, claims, source, context));

  Object.entries(value).forEach(([, item]) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) collectClaim(item, claims, source, context);
  });

  collectClaim(value, claims, source, context);
}

function collectClaim(value: any, claims: Map<string, DiscoveredClaim>, source: string, context: PageClaimContext) {
  if (!value || typeof value !== 'object') return;

  const claimId = stringField(value, ['claim_id', 'claim-id']);
  const txid = stringField(value, ['txid']);
  const nout = stringField(value, ['nout']);
  const sdHash = claimSdHash(value);
  const valueType = stringField(value, ['value_type', 'value.type', 'claim.value_type', 'raw.value_type']);
  const urls = [
    stringField(value, ['canonical_url']),
    stringField(value, ['permanent_url']),
    stringField(value, ['short_url']),
  ].filter(Boolean);
  if (!claimId && !txid && !sdHash) return;
  if (!isResolvedPageClaim(valueType)) return;

  const traceTarget = txid && nout !== undefined ? `${txid}:${nout}` : claimId || urls[0];
  if (!traceTarget) return;

  const aliases = claimAliases({ claimId, txid, nout, sdHash, urls, traceTarget });
  const key = aliases[0];
  const title = stringField(value, ['value.title', 'title', 'name', 'canonical_url', 'permanent_url']) || key;
  const provenance = claimProvenance({ urls, source }, context);
  const signingChannelId = stringField(value, ['signing_channel.claim_id']);
  if (!claimMatchesCurrentPage(valueType, claimId, signingChannelId, urls, provenance, context)) return;

  const existing = aliases.map((alias) => claims.get(alias)).find(Boolean);
  if (existing) {
    const merged = {
      ...existing,
      label: existing.label || limitLabel(title),
      traceTarget: existing.traceTarget || traceTarget,
      claimId: existing.claimId || claimId,
      txid: existing.txid || txid,
      nout: existing.nout || nout,
      sdHash: existing.sdHash || sdHash,
      source: existing.source || source,
      valueType: existing.valueType || valueType,
      order: existing.order,
      summary: existing.summary || claimSummary(value),
      provenance: provenanceRank(existing.provenance) <= provenanceRank(provenance) ? existing.provenance : provenance,
    };
    aliases.forEach((alias) => claims.set(alias, merged));
    return;
  }

  const claim = {
    key,
    label: limitLabel(title),
    traceTarget,
    claimId,
    txid,
    nout,
    sdHash,
    provenance,
    source,
    valueType,
    summary: claimSummary(value),
  };
  aliases.forEach((alias) => claims.set(alias, claim));
}

function isClaimResponseSource(source: string) {
  return /^(?:claim_search|resolve|claim)$|(?:method=|\/)(?:claim_search|resolve|claim)(?:[?&/]|$)/.test(source);
}

function isResolvedPageClaim(valueType: string | undefined) {
  return valueType === 'stream' || valueType === 'channel';
}

function claimMatchesCurrentPage(
  valueType: string | undefined,
  claimId: string | undefined,
  signingChannelId: string | undefined,
  urls: Array<string>,
  provenance: DiscoveredClaim['provenance'],
  context: PageClaimContext
) {
  if (provenance === 'page') return true;
  if (context.currentChannelPrefix) {
    const normalizedUrls = urls.map(normalizeComparable).filter(Boolean);
    if (normalizedUrls.some((url) => url.startsWith(`${context.currentChannelPrefix}/`))) return true;
    return false;
  }
  if (context.pageChannelIds.size === 0) return true;
  if (valueType === 'channel') return Boolean(claimId && context.pageChannelIds.has(claimId));
  return Boolean(signingChannelId && context.pageChannelIds.has(signingChannelId));
}

function dedupeClaims(claims: Array<DiscoveredClaim>) {
  const byKey = new Map<string, DiscoveredClaim>();

  claims.forEach((claim) => {
    const key = canonicalClaimKey(claim);
    const existing = byKey.get(key);
    if (!existing || shouldReplaceClaim(existing, claim)) byKey.set(key, claim);
  });

  return [...byKey.values()];
}

function canonicalClaimKey(claim: DiscoveredClaim) {
  if (claim.claimId) return `claim:${claim.claimId}`;
  if (claim.txid && claim.nout !== undefined) return `outpoint:${claim.txid}:${claim.nout}`;
  if (claim.sdHash) return `sd:${claim.sdHash}`;
  return normalizeComparable(claim.traceTarget) || claim.key;
}

function shouldReplaceClaim(existing: DiscoveredClaim, next: DiscoveredClaim) {
  const existingRank = provenanceRank(existing.provenance);
  const nextRank = provenanceRank(next.provenance);
  if (nextRank !== existingRank) return nextRank < existingRank;
  if (existing.source === 'visible-page' && next.source !== 'visible-page') return true;
  return next.label.length > existing.label.length && existing.label === existing.traceTarget;
}

function claimAliases({
  claimId,
  txid,
  nout,
  sdHash,
  urls,
  traceTarget,
}: {
  claimId?: string;
  txid?: string;
  nout?: string;
  sdHash?: string;
  urls: Array<string>;
  traceTarget: string;
}) {
  return [
    claimId ? `claim:${claimId}` : undefined,
    txid && nout !== undefined ? `outpoint:${txid}:${nout}` : undefined,
    txid ? `tx:${txid}` : undefined,
    sdHash ? `sd:${sdHash}` : undefined,
    ...urls.map((url) => {
      const normalized = normalizeComparable(url);
      return normalized.length > 1 ? `url:${normalized}` : undefined;
    }),
    `target:${traceTarget}`,
  ].filter(Boolean);
}

type PageClaimContext = {
  currentPageKey: string;
  currentPath: string;
  currentUrl: string;
  currentChannelPrefix: string;
  pageChannelIds: Set<string>;
  renderedClaims: Array<DiscoveredClaim>;
};

function pageClaimContext(): PageClaimContext {
  if (typeof window === 'undefined') {
    return {
      currentPageKey: '',
      currentPath: '',
      currentUrl: '',
      currentChannelPrefix: '',
      pageChannelIds: new Set(),
      renderedClaims: [],
    };
  }

  const currentPath = normalizeComparable(window.location.pathname + window.location.hash);
  return {
    currentPageKey: normalizePagePath(`${window.location.pathname}${window.location.search}${window.location.hash}`),
    currentPath,
    currentUrl: normalizeComparable(window.location.href),
    currentChannelPrefix: channelPrefixFromPath(currentPath),
    pageChannelIds: new Set(),
    renderedClaims: renderedPageClaims(),
  };
}

function channelPrefixFromPath(path: string) {
  const firstSegment = path.split('/').filter(Boolean)[0] || '';
  return firstSegment.startsWith('@') && firstSegment.includes(':') ? `/${firstSegment}` : '';
}

function renderedPageClaims(): Array<DiscoveredClaim> {
  if (typeof document === 'undefined') return [];

  const claims = new Map<string, DiscoveredClaim>();
  document.querySelectorAll('[data-hyperbeam-claim-id]').forEach((element, order) => {
    const htmlElement = element as HTMLElement;
    if (!isVisibleElement(htmlElement)) return;

    const claimId = htmlElement.dataset.hyperbeamClaimId;
    const txid = htmlElement.dataset.hyperbeamClaimTxid;
    const nout = htmlElement.dataset.hyperbeamClaimNout;
    const sdHash = htmlElement.dataset.hyperbeamClaimSdHash;
    const uri = htmlElement.dataset.hyperbeamClaimUri || '';
    const title = htmlElement.dataset.hyperbeamClaimTitle || uri || claimId || '';
    const valueType = htmlElement.dataset.hyperbeamClaimType;
    if (!claimId || !isResolvedPageClaim(valueType)) return;

    const traceTarget = txid && nout !== undefined && nout !== '' ? `${txid}:${nout}` : claimId || uri;
    const key = `claim:${claimId}`;
    if (claims.has(key)) return;

    claims.set(key, {
      key,
      label: limitLabel(title),
      traceTarget,
      claimId,
      txid,
      nout,
      sdHash,
      provenance: renderedClaimProvenance(uri),
      source: 'rendered-claim-preview',
      valueType,
      order,
      summary: sanitizeHyperbeamDebugValue({
        title,
        claim_id: claimId,
        value_type: valueType,
        txid,
        nout,
        sd_hash: sdHash,
        canonical_url: uri,
        signing_channel: {
          claim_id: htmlElement.dataset.hyperbeamSigningChannelId,
        },
      }),
    });
  });

  return [...claims.values()];
}

function renderedClaimProvenance(uri: string): DiscoveredClaim['provenance'] {
  if (typeof window === 'undefined') return 'visible';
  const normalizedUri = normalizeComparable(uri);
  const currentUrl = normalizeComparable(window.location.href);
  const currentPath = normalizeComparable(window.location.pathname + window.location.hash);
  return normalizedUri && (normalizedUri === currentUrl || normalizedUri === currentPath) ? 'page' : 'visible';
}

function isVisibleElement(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
}

function isCurrentPageEvent(data: any, context: PageClaimContext) {
  const pagePath = typeof data.pagePath === 'string' ? data.pagePath : '';
  return Boolean(pagePath && normalizePagePath(pagePath) === context.currentPageKey);
}

function claimProvenance(
  claim: { urls: Array<string>; source: string },
  context: PageClaimContext
): DiscoveredClaim['provenance'] {
  const normalizedUrls = claim.urls.map(normalizeComparable).filter(Boolean);
  if (normalizedUrls.some((url) => url.length > 1 && (url === context.currentUrl || url === context.currentPath))) {
    return 'page';
  }

  return 'visible';
}

function normalizeComparable(value: string) {
  const clean = comparablePath(value).split(/[?#]/)[0].toLowerCase();
  return clean
    .replace(/^https?:\/\/(?:www\.)?odysee\.com/, '')
    .replace(/^lbry:\/\//, '/')
    .replace(/#/g, ':')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');
}

function comparablePath(value: string) {
  if (value.startsWith('lbry://')) return value;

  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://odysee.com';
    const url = new URL(value, base);
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
    const odyseeHost = url.hostname === 'odysee.com' || url.hostname === 'www.odysee.com';
    if (odyseeHost || url.hostname === currentHost) return url.pathname;
  } catch {
    return value;
  }

  return value;
}

function normalizePagePath(value: string) {
  return value
    .replace(/#.*$/, '')
    .replace(/[?&](?:utm_[^=]+|t|start|autoplay)=[^&]*/g, '')
    .replace(/[?&]$/, '');
}

function compareClaims(a: DiscoveredClaim, b: DiscoveredClaim) {
  return (
    provenanceRank(a.provenance) - provenanceRank(b.provenance) ||
    (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
    a.label.localeCompare(b.label)
  );
}

function provenanceRank(provenance: DiscoveredClaim['provenance']) {
  if (provenance === 'page') return 0;
  if (provenance === 'visible') return 1;
  return 2;
}

function claimIdNeedles(claimId: string) {
  const clean = claimId.toLowerCase();
  return [clean, clean.slice(0, 12), clean.slice(0, 8), clean.slice(0, 6)].filter((needle) => needle.length >= 6);
}

function claimIdLabel(claim: DiscoveredClaim) {
  if (claim.claimId) return claim.claimId.slice(0, 10);
  if (claim.txid && claim.nout !== undefined) return `${claim.txid.slice(0, 8)}:${claim.nout}`;
  if (claim.sdHash) return claim.sdHash.slice(0, 10);
  return claim.traceTarget.slice(0, 14);
}

function initialSteps(
  target: string,
  selectedClaim?: DiscoveredClaim,
  events: Array<HyperbeamDebugEvent> = []
): Array<TraceStep> {
  const parsed = target ? parseTarget(target) : undefined;
  const txid = parsed?.txid || selectedClaim?.txid;
  const nout = parsed?.nout ?? selectedClaim?.nout;
  const sdHash = selectedClaim?.sdHash;
  const isChannelClaim = selectedClaim?.valueType === 'channel';
  const outputLabel = isChannelClaim ? 'channel output' : 'claim output';
  const txSource = txid ? cachedSourceObservation(events, txid) : undefined;
  const descriptorSource = sdHash ? cachedSourceObservation(events, sdHash) : undefined;
  const descriptorSteps: Array<TraceStep> = isChannelClaim
    ? [
        {
          key: 'extract-descriptor',
          label: 'Skip stream descriptor ID',
          kind: 'locator',
          status: 'skipped',
          detail: 'channel claim has no stream descriptor',
          response: sanitizeHyperbeamDebugValue({ value_type: selectedClaim?.valueType, sd_hash: sdHash }),
        },
        {
          key: 'descriptor-source',
          label: 'Skip descriptor/blob source object',
          kind: 'source',
          status: 'skipped',
          detail: 'channel claim has no descriptor/blob source object',
        },
        {
          key: 'descriptor-commitment',
          label: 'Skip descriptor/blob commitment headers',
          kind: 'source',
          status: 'skipped',
          detail: 'channel claim has no descriptor/blob commitment path',
        },
      ]
    : [
        {
          key: 'extract-descriptor',
          label: 'Extract stream descriptor ID',
          kind: 'locator',
          status: sdHash ? 'ok' : selectedClaim ? 'skipped' : target ? 'pending' : 'skipped',
          detail: sdHash || 'no sd_hash in loaded claim metadata',
          response: sanitizeHyperbeamDebugValue({ sd_hash: sdHash }),
        },
        {
          key: 'descriptor-source',
          label: 'Fetch descriptor/blob source object',
          kind: 'source',
          ...sourceObservationStep(descriptorSource, sdHash),
        },
        {
          key: 'descriptor-commitment',
          label: 'Check descriptor/blob commitment headers',
          kind: 'source',
          ...commitmentObservationStep(descriptorSource, sdHash, 'descriptor/blob'),
        },
      ];

  return [
    {
      key: 'parse',
      label: 'Parse target',
      kind: 'input',
      status: target ? 'ok' : 'skipped',
      detail: selectedClaim ? `${parsed?.detail || 'loaded claim'} · ${selectedClaim.label}` : parsed?.detail,
      response: sanitizeHyperbeamDebugValue({
        ...parsed,
        selectedClaim: selectedClaim?.summary,
      }),
    },
    {
      key: 'locate',
      label: 'Resolve claim locator',
      kind: 'locator',
      status: txid || selectedClaim?.claimId ? 'ok' : target ? 'pending' : 'skipped',
      detail: txid ? `${txid}${nout !== undefined ? `:${nout}` : ''}` : selectedClaim?.claimId,
      response: selectedClaim?.summary,
    },
    {
      key: 'extract-claim',
      label: 'Extract claim source IDs',
      kind: 'locator',
      status: txid ? 'ok' : target ? 'pending' : 'skipped',
      detail: txid
        ? `txid ${txid.slice(0, 12)}${nout !== undefined ? `:${nout}` : ''}${sdHash ? ` · sd ${sdHash.slice(0, 12)}` : ''}`
        : undefined,
      response: sanitizeHyperbeamDebugValue({ claim_id: selectedClaim?.claimId, txid, nout, sd_hash: sdHash }),
    },
    {
      key: 'tx-source',
      label: 'Fetch transaction source object',
      kind: 'source',
      ...sourceObservationStep(txSource, txid),
    },
    {
      key: 'tx-commitment',
      label: 'Check transaction commitment headers',
      kind: 'source',
      ...commitmentObservationStep(txSource, txid, 'transaction'),
    },
    {
      key: 'claim-source',
      label: `Extract ${outputLabel} from transaction`,
      kind: 'source',
      ...derivedClaimOutputStep(txSource, txid, nout, outputLabel),
    },
    {
      key: 'claim-commitment',
      label: `Check ${outputLabel} commitment path`,
      kind: 'source',
      ...derivedClaimOutputCommitmentStep(txSource, txid, nout, outputLabel),
    },
    ...descriptorSteps,
    {
      key: 'facade-check',
      label: 'Diagnostic verified-stream facade check',
      kind: 'facade',
      status: target ? 'skipped' : 'pending',
      detail: target ? 'manual trace action only' : undefined,
    },
  ];
}

function cachedSourceObservation(events: Array<HyperbeamDebugEvent>, id: string | undefined) {
  if (!id) return undefined;
  const encodedId = encodeURIComponent(id).toLowerCase();
  const cleanId = id.toLowerCase();

  return [...events].reverse().find((event) => {
    if (event.label !== 'response') return false;
    const data = event.data || {};
    const path = String(data.devicePath || data.url || '').toLowerCase();
    return (
      (path.includes('/~odysee@1.0/source') ||
        path.includes('/~odysee@1.0/transaction') ||
        path.includes('/~odysee@1.0/descriptor')) &&
      (path.includes(encodedId) || path.includes(cleanId))
    );
  });
}

function derivedClaimOutputStep(
  event: HyperbeamDebugEvent | undefined,
  txid: string | undefined,
  nout: string | undefined,
  outputLabel = 'claim output'
): Omit<TraceStep, 'key' | 'label' | 'kind'> {
  if (!txid || nout === undefined) {
    return {
      status: 'skipped',
      detail: 'no txid:nout available',
    };
  }

  if (!event) {
    return {
      status: 'warn',
      detail: `transaction evidence not observed for ${outputLabel} ${nout}`,
      response: sanitizeHyperbeamDebugValue({ txid, nout }),
    };
  }

  return {
    status: event.data?.ok ? 'ok' : 'failed',
    detail: `${outputLabel} ${nout} is inside verified transaction ${txid.slice(0, 12)}`,
    url: event.data?.url,
    statusCode: event.data?.status,
    sourceAlg: event.data?.sourceAlg,
    response: sanitizeHyperbeamDebugValue({
      txid,
      nout,
      transactionDevice: event.data?.responseDevice,
      signatureInput: event.data?.signatureInput,
    }),
  };
}

function derivedClaimOutputCommitmentStep(
  event: HyperbeamDebugEvent | undefined,
  txid: string | undefined,
  nout: string | undefined,
  outputLabel = 'claim output'
): Omit<TraceStep, 'key' | 'label' | 'kind'> {
  if (!txid || nout === undefined) {
    return {
      status: 'skipped',
      detail: 'no txid:nout available',
    };
  }

  if (!event) {
    return {
      status: 'warn',
      detail: 'transaction commitment was not observed during page load',
      response: sanitizeHyperbeamDebugValue({ txid, nout }),
    };
  }

  return {
    status: event.data?.sourceAlg ? 'ok' : 'failed',
    detail: event.data?.sourceAlg
      ? `${outputLabel} ${nout} covered by transaction commitment`
      : `missing transaction commitment for ${outputLabel}`,
    url: event.data?.url,
    statusCode: event.data?.status,
    sourceAlg: event.data?.sourceAlg,
    response: sanitizeHyperbeamDebugValue({
      txid,
      nout,
      sourceLayer: event.data?.sourceLayer,
      signatureInput: event.data?.signatureInput,
    }),
  };
}

function sourceObservationStep(
  event: HyperbeamDebugEvent | undefined,
  id: string | undefined
): Omit<TraceStep, 'key' | 'label' | 'kind'> {
  if (!id) {
    return {
      status: 'skipped',
      detail: 'no source ID available',
    };
  }

  if (!event) {
    return {
      status: 'warn',
      detail: `not observed during page load · expected ${id.slice(0, 18)}`,
      response: sanitizeHyperbeamDebugValue({ id }),
    };
  }

  const data = event.data || {};
  return {
    status: data.ok ? 'ok' : 'failed',
    detail: data.contentType || data.sourceLayer || 'source response observed',
    url: data.url,
    statusCode: data.status,
    sourceAlg: data.sourceAlg,
    response: sanitizeHyperbeamDebugValue({
      id,
      sourceLayer: data.sourceLayer,
      sourceReason: data.sourceReason,
      contentType: data.contentType,
      contentLength: data.contentLength,
      signatureInput: data.signatureInput,
      body: data.body,
    }),
  };
}

function commitmentObservationStep(
  event: HyperbeamDebugEvent | undefined,
  id: string | undefined,
  label: string
): Omit<TraceStep, 'key' | 'label' | 'kind'> {
  if (!id) {
    return {
      status: 'skipped',
      detail: 'no source ID available',
    };
  }

  if (!event) {
    return {
      status: 'warn',
      detail: `${label} source was not fetched during page load`,
      response: sanitizeHyperbeamDebugValue({ id }),
    };
  }

  const data = event.data || {};
  return {
    status: data.sourceAlg ? 'ok' : 'failed',
    detail: data.sourceAlg ? `native ${label} commitment visible` : `missing ${label} commitment header`,
    url: data.url,
    statusCode: data.status,
    sourceAlg: data.sourceAlg,
    response: sanitizeHyperbeamDebugValue({
      id,
      sourceLayer: data.sourceLayer,
      signatureInput: data.signatureInput,
    }),
  };
}

function parseTarget(target: string) {
  const clean = target.trim();
  const outpoint = clean.match(/^([0-9a-f]{64}):(\d+)$/i);
  if (outpoint) {
    return { kind: 'source', txid: outpoint[1].toLowerCase(), nout: outpoint[2], detail: 'explicit txid:nout' };
  }
  const txid = clean.match(/^[0-9a-f]{64}$/i);
  if (txid) return { kind: 'source', txid: clean.toLowerCase(), detail: 'explicit txid' };
  const claimId = clean.match(/^[0-9a-f]{40}$/i);
  if (claimId) return { kind: 'locator', detail: 'claim id locator' };
  return { kind: 'locator', detail: 'URL/name locator' };
}

function stringField(value: any, paths: Array<string>) {
  for (const path of paths) {
    const found = path.split('.').reduce((current, key) => current?.[key], value);
    if (found !== undefined && found !== null && String(found)) return String(found);
  }
  return undefined;
}

function limitLabel(value: string) {
  return value.length > 42 ? `${value.slice(0, 39)}...` : value;
}

function claimSdHash(value: any) {
  return stringField(value, [
    'sd-hash',
    'sd_hash',
    'source.sd_hash',
    'value.source.sd_hash',
    'raw.value.source.sd_hash',
    'claim.value.source.sd_hash',
    'stream.source.sd_hash',
  ]);
}

function claimSummary(value: any) {
  return sanitizeHyperbeamDebugValue({
    title: stringField(value, ['value.title', 'title']),
    name: stringField(value, ['name']),
    claim_id: stringField(value, ['claim_id', 'claim-id']),
    value_type: stringField(value, ['value_type', 'value.type', 'claim.value_type', 'raw.value_type']),
    txid: stringField(value, ['txid']),
    nout: stringField(value, ['nout']),
    sd_hash: claimSdHash(value),
    canonical_url: stringField(value, ['canonical_url']),
    permanent_url: stringField(value, ['permanent_url']),
    signing_channel: value?.signing_channel
      ? {
          claim_id: value.signing_channel.claim_id,
          name: value.signing_channel.name,
          title: value.signing_channel.value?.title,
          canonical_url: value.signing_channel.canonical_url,
        }
      : undefined,
  });
}

function statusColor(status: TraceStatus) {
  switch (status) {
    case 'ok':
      return '#22c55e';
    case 'warn':
      return '#ffb020';
    case 'failed':
      return '#ff4d7d';
    case 'running':
      return '#38bdf8';
    case 'skipped':
      return 'rgba(255,255,255,0.42)';
    default:
      return 'rgba(255,255,255,0.66)';
  }
}

function kindColor(kind: TraceKind) {
  switch (kind) {
    case 'source':
      return '#0ea5e9';
    case 'locator':
    case 'facade':
      return '#ffb020';
    case 'transport':
      return '#a78bfa';
    default:
      return 'rgba(255,255,255,0.72)';
  }
}

function provenanceColor(provenance: DiscoveredClaim['provenance']) {
  switch (provenance) {
    case 'page':
      return '#22c55e';
    case 'visible':
      return '#0ea5e9';
    default:
      return 'rgba(255,255,255,0.18)';
  }
}
