import React from 'react';
import {
  addHyperbeamDebugListener,
  hyperbeamDebugColor,
  installHyperbeamFetchDebug,
  sanitizeHyperbeamDebugValue,
  sanitizeHyperbeamDebugUrl,
  type HyperbeamDebugEvent,
} from 'util/hyperbeamDebug';
import { ODYSEE_HYPERBEAM_NODE_API } from 'config';
import { getHyperbeamMode, HYPERBEAM_MODES, setHyperbeamMode, type HyperbeamMode } from 'util/hyperbeamMode';
import ClaimTrace from './claimTrace';

const MAX_EVENTS = 1200;
const MAX_RELEVANT_EVENTS = 24;
const FILTERS = [
  { key: 'get', label: 'get', color: 'rgba(255,255,255,0.76)' },
  { key: 'failed', label: 'failed', color: '#ff4d7d' },
  { key: 'original', label: 'original', color: '#94a3b8' },
  { key: 'native-device', label: 'native-device', color: '#0ea5e9' },
  { key: 'native:sdk-proxy', label: 'native:sdk-proxy', color: '#a78bfa' },
  { key: 'fallback', label: 'fallback', color: '#ffb020' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];
type ConsoleTab = 'trace' | 'requests';

export default function HyperbeamDebugConsole() {
  const [open, setOpen] = React.useState(true);
  const [maximized, setMaximized] = React.useState(false);
  const [mode, setMode] = React.useState<HyperbeamMode>(() => getHyperbeamMode());
  const [activeTab, setActiveTab] = React.useState<ConsoleTab>('trace');
  const [events, setEvents] = React.useState<Array<HyperbeamDebugEvent>>([]);
  const [filterCounts, setFilterCounts] = React.useState<Record<FilterKey, number>>(() => emptyFilterCounts());
  const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});
  const [activeFilters, setActiveFilters] = React.useState<Set<FilterKey>>(() => new Set());
  const [copied, setCopied] = React.useState(false);
  const [copiedRelevant, setCopiedRelevant] = React.useState(false);
  const logRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    installHyperbeamFetchDebug();
    return addHyperbeamDebugListener((event) => {
      setFilterCounts((current) => incrementFilterCounts(current, event));
      setEvents((current) => {
        const key = eventKey(event);
        const existingIndex = current.findLastIndex((currentEvent) => eventKey(currentEvent) === key);
        if (existingIndex !== -1) {
          const existing = current[existingIndex];
          const next = [...current];
          next[existingIndex] = {
            ...event,
            data: {
              ...event.data,
              repeatCount: Number(existing.data?.repeatCount || 1) + 1,
              firstSeen: existing.data?.firstSeen || existing.time,
              lastSeen: event.time,
            },
          };
          return next;
        }

        return [...current.slice(-(MAX_EVENTS - 1)), event];
      });
    });
  }, []);

  React.useEffect(() => {
    if (!open || !logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [events, open]);

  if (!ODYSEE_HYPERBEAM_NODE_API) return null;

  const last = events[events.length - 1];
  const visibleEvents =
    activeFilters.size === 0
      ? events
      : events.filter((event) =>
          FILTERS.some((filter) => activeFilters.has(filter.key) && eventMatchesFilter(event, filter.key))
        );

  const toggleFilter = (filter: FilterKey) => {
    setActiveFilters((current) => {
      const next = new Set(current);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  const copyEvents = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const text = JSON.stringify(events, null, 2);
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      })
      .catch(() => setCopied(false));
  };
  const copyRelevantEvents = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const text = JSON.stringify(
      {
        type: 'odysee_request_events',
        node: mode === HYPERBEAM_MODES.original ? undefined : String(ODYSEE_HYPERBEAM_NODE_API).replace(/\/+$/, ''),
        mode,
        generatedAt: new Date().toISOString(),
        events: relevantEvents(events, mode),
      },
      null,
      2
    );
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopiedRelevant(true);
        window.setTimeout(() => setCopiedRelevant(false), 1200);
      })
      .catch(() => setCopiedRelevant(false));
  };
  const onModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextMode = event.currentTarget.value as HyperbeamMode;
    setMode(nextMode);
    setHyperbeamMode(nextMode);
    setEvents([]);
    setFilterCounts(emptyFilterCounts());
    window.location.reload();
  };

  return (
    <div
      data-hyperbeam-debug-console
      style={{
        position: 'fixed',
        right: maximized ? 8 : 12,
        bottom: maximized ? 8 : 12,
        top: maximized ? 8 : undefined,
        left: maximized ? 8 : undefined,
        zIndex: 100000,
        width: maximized ? 'auto' : open ? 720 : 'auto',
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: maximized ? 'calc(100vh - 16px)' : '58vh',
        height: maximized ? 'calc(100vh - 16px)' : undefined,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 6,
        border: '1px solid rgba(222, 0, 80, 0.62)',
        background: 'rgba(12, 10, 12, 0.95)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        color: '#f9fafb',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        lineHeight: 1.35,
        boxShadow: '0 12px 34px rgba(0,0,0,0.46), 0 0 28px rgba(222,0,80,0.2)',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxSizing: 'border-box',
          padding: '0 8px 0 0',
          background: 'linear-gradient(90deg, rgba(222,0,80,0.42), rgba(222,0,80,0.12))',
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            border: 0,
            padding: '8px 10px',
            background: 'transparent',
            color: '#f9fafb',
            textAlign: 'left',
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          Odysee request log {open ? 'hide' : 'show'}
          {!open && last ? ` · ${last.label} · ${last.level}` : ''}
        </button>
        {open && (
          <div style={{ display: 'flex', gap: 4, flex: '0 0 auto' }}>
            <TabButton active={activeTab === 'trace'} onClick={() => setActiveTab('trace')}>
              Trace
            </TabButton>
            <TabButton active={activeTab === 'requests'} onClick={() => setActiveTab('requests')}>
              Requests {events.length}
            </TabButton>
          </div>
        )}
        <select
          value={mode}
          onClick={(event) => event.stopPropagation()}
          onChange={onModeChange}
          title="Select request wiring mode"
          style={{
            width: 88,
            height: 18,
            border: '1px solid rgba(255,255,255,0.28)',
            borderRadius: 4,
            padding: '0 2px',
            background: 'rgba(12,10,12,0.96)',
            color: '#f9fafb',
            fontSize: 10,
            lineHeight: 1,
          }}
        >
          <option value={HYPERBEAM_MODES.original}>Original</option>
          <option value={HYPERBEAM_MODES.hybrid}>Hybrid</option>
          <option value={HYPERBEAM_MODES.hyperbeam}>HyperBEAM</option>
        </select>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
            setMaximized((value) => !value);
          }}
          title={maximized ? 'Restore console' : 'Maximize console'}
          style={headerIconButtonStyle}
        >
          {maximized ? 'restore' : 'maximize'}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setOpen(false);
            setMaximized(false);
          }}
          title="Minimize console"
          style={headerIconButtonStyle}
        >
          minimize
        </button>
      </div>
      {open && (
        <>
          <div style={{ padding: '8px 9px 0' }}>
            <div style={{ overflowWrap: 'anywhere', marginBottom: 8, color: 'rgba(255,255,255,0.72)' }}>
              {modeEndpointLabel(mode)}
            </div>
          </div>
          {activeTab === 'trace' && <ClaimTrace events={events} />}
          {activeTab === 'requests' && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 9px 8px' }}>
                {FILTERS.map((filter) => {
                  const active = activeFilters.has(filter.key);
                  const disabled = filterDisabledInMode(filter.key, mode);
                  return (
                    <button
                      key={filter.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && toggleFilter(filter.key)}
                      title={
                        disabled
                          ? `${filter.label} disabled in ${modeLabel(mode)}`
                          : active
                            ? `Remove ${filter.label} filter`
                            : `Filter ${filter.label}`
                      }
                      style={{
                        border: `1px solid ${
                          disabled ? 'rgba(255,255,255,0.12)' : active ? filter.color : 'rgba(255,255,255,0.22)'
                        }`,
                        borderRadius: 4,
                        padding: '1px 6px',
                        background: disabled
                          ? 'rgba(255,255,255,0.025)'
                          : active
                            ? 'rgba(255,255,255,0.12)'
                            : 'rgba(255,255,255,0.05)',
                        color: disabled ? 'rgba(255,255,255,0.28)' : filter.color,
                        cursor: disabled ? 'default' : 'pointer',
                        font: 'inherit',
                        textDecoration: disabled ? 'line-through' : 'none',
                      }}
                    >
                      {filter.label} {filterCounts[filter.key] || 0}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={copyEvents}
                  disabled={events.length === 0}
                  title="Copy HyperBEAM log"
                  style={{
                    marginLeft: 'auto',
                    border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: 4,
                    padding: '1px 6px',
                    background: copied ? '#de0050' : 'rgba(255,255,255,0.08)',
                    color: '#f9fafb',
                    cursor: events.length === 0 ? 'default' : 'pointer',
                    font: 'inherit',
                    opacity: events.length === 0 ? 0.55 : 1,
                  }}
                >
                  {copied ? 'copied' : 'copy'}
                </button>
                <button
                  type="button"
                  onClick={copyRelevantEvents}
                  disabled={events.length === 0}
                  title="Copy only the entries needed for debugging"
                  style={{
                    border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: 4,
                    padding: '1px 6px',
                    background: copiedRelevant ? '#de0050' : 'rgba(255,255,255,0.08)',
                    color: '#f9fafb',
                    cursor: events.length === 0 ? 'default' : 'pointer',
                    font: 'inherit',
                    opacity: events.length === 0 ? 0.55 : 1,
                  }}
                >
                  {copiedRelevant ? 'copied' : 'copy fix'}
                </button>
              </div>
              <div ref={logRef} style={{ padding: '0 9px 9px', minHeight: 0, overflow: 'auto' }}>
                {events.length === 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.62)' }}>waiting for {modeWaitLabel(mode)} calls</div>
                )}
                {events.length !== 0 && visibleEvents.length === 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.62)' }}>no calls match the active filters</div>
                )}
                {visibleEvents.map((event) => {
                  const index = events.indexOf(event);
                  const isExpanded = expanded[index];
                  return (
                    <div key={`${event.time}-${event.label}-${index}`} style={{ marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => setExpanded((current) => ({ ...current, [index]: !current[index] }))}
                        style={{
                          width: '100%',
                          border: 0,
                          padding: '2px 0',
                          background: 'transparent',
                          color: 'rgba(255,255,255,0.84)',
                          cursor: 'pointer',
                          font: 'inherit',
                          textAlign: 'left',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <strong
                          style={{
                            color: eventColor(event),
                          }}
                        >
                          {isExpanded ? '-' : '+'}
                        </strong>{' '}
                        <strong
                          style={{
                            color: eventColor(event),
                          }}
                        >
                          {event.time}
                        </strong>{' '}
                        {event.label} {eventSummary(event, mode)}
                      </button>
                      {isExpanded && event.data !== undefined && (
                        <pre style={{ margin: '3px 0 0', whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.78)' }}>
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

const headerIconButtonStyle = {
  flex: '0 0 auto',
  height: 18,
  border: '1px solid rgba(255,255,255,0.28)',
  borderRadius: 4,
  padding: '0 6px',
  background: 'rgba(255,255,255,0.08)',
  color: '#f9fafb',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 10,
  lineHeight: 1,
} as const;

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1px solid ${active ? 'rgba(14,165,233,0.68)' : 'rgba(255,255,255,0.18)'}`,
        borderRadius: 4,
        padding: '2px 8px',
        background: active ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.045)',
        color: active ? '#e0f2fe' : 'rgba(255,255,255,0.72)',
        cursor: 'pointer',
        font: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

function eventColor(event: HyperbeamDebugEvent) {
  if (event.label === 'request') return hyperbeamDebugColor('info');
  return hyperbeamDebugColor(event.level, event.data?.sourceLayer || event.data?.deviceLayer);
}

function eventSummary(event: HyperbeamDebugEvent, mode: HyperbeamMode) {
  const data = event.data || {};
  const bits = [
    mode,
    data.repeatCount ? `x${data.repeatCount}` : undefined,
    data.method,
    data.status ? String(data.status) : undefined,
    data.deviceLayer,
    data.sourceLayer,
    data.elapsedMs !== undefined ? `${data.elapsedMs}ms` : undefined,
    data.devicePath,
  ].filter(Boolean);
  return bits.length ? `- ${bits.join(' ')}` : '';
}

function modeLabel(mode: HyperbeamMode) {
  switch (mode) {
    case HYPERBEAM_MODES.original:
      return 'Original wiring';
    case HYPERBEAM_MODES.hybrid:
      return 'Hybrid read path';
    case HYPERBEAM_MODES.hyperbeam:
      return 'HyperBEAM wiring';
    default:
      return mode;
  }
}

function modeEndpointLabel(mode: HyperbeamMode) {
  if (mode === HYPERBEAM_MODES.original) return `${modeLabel(mode)} · normal Odysee/API calls`;
  if (mode === HYPERBEAM_MODES.hybrid) {
    return `${modeLabel(mode)} · public reads through ${String(ODYSEE_HYPERBEAM_NODE_API).replace(
      /\/+$/,
      ''
    )}; private/internal calls stay original`;
  }
  return `${modeLabel(mode)} · canonical reads through ${String(ODYSEE_HYPERBEAM_NODE_API).replace(
    /\/+$/,
    ''
  )}; original fallback disabled`;
}

function modeWaitLabel(mode: HyperbeamMode) {
  return mode === HYPERBEAM_MODES.original ? 'Original' : mode === HYPERBEAM_MODES.hybrid ? 'Hybrid' : 'HyperBEAM';
}

function filterDisabledInMode(filter: FilterKey, mode: HyperbeamMode) {
  if (mode === HYPERBEAM_MODES.original) {
    return filter !== 'get' && filter !== 'failed' && filter !== 'original';
  }

  if (mode === HYPERBEAM_MODES.hybrid) {
    if (filter === 'original') return false;
    if (filter === 'native-device') return false;
    if (filter === 'native:sdk-proxy') return false;
    if (filter === 'fallback') return true;
    return false;
  }

  return false;
}

function emptyFilterCounts(): Record<FilterKey, number> {
  return FILTERS.reduce((counts, filter) => ({ ...counts, [filter.key]: 0 }), {} as Record<FilterKey, number>);
}

function incrementFilterCounts(
  current: Record<FilterKey, number>,
  event: HyperbeamDebugEvent
): Record<FilterKey, number> {
  let next = current;
  FILTERS.forEach((filter) => {
    if (eventMatchesFilter(event, filter.key)) {
      if (next === current) next = { ...current };
      next[filter.key] = Number(next[filter.key] || 0) + 1;
    }
  });
  return next;
}

function eventMatchesFilter(event: HyperbeamDebugEvent, filter: FilterKey) {
  const data = event.data || {};
  const sourceLayer = String(data.sourceLayer || '');
  const deviceLayer = String(data.deviceLayer || '');
  const isPlainRequest = event.label === 'request';

  switch (filter) {
    case 'failed':
      return (
        event.level === 'error' ||
        data.ok === false ||
        Number(data.status) >= 400 ||
        sourceLayer === 'native-missing' ||
        sourceLayer === 'native-failed'
      );
    case 'get':
      return String(data.method || '').toUpperCase() === 'GET';
    case 'original':
      if (isPlainRequest) return false;
      return sourceLayer === 'original';
    case 'native-device':
      if (isPlainRequest) return false;
      return deviceLayer === 'native-device';
    case 'fallback':
      if (isPlainRequest) return false;
      return sourceLayer.startsWith('fallback') || sourceLayer === 'device:fallback';
    case 'native:sdk-proxy':
      if (isPlainRequest) return false;
      return sourceLayer === 'native:sdk-proxy';
    default:
      return false;
  }
}

function eventKey(event: HyperbeamDebugEvent) {
  const data = event.data || {};
  const body = data.body || {};
  return JSON.stringify({
    label: event.label,
    level: event.level,
    method: data.method,
    status: data.status,
    ok: data.ok,
    pagePath: data.pagePath,
    devicePath: data.devicePath,
    device: data.device,
    deviceLayer: data.deviceLayer,
    sourceLayer: data.sourceLayer,
    sourceReason: data.sourceReason,
    reason: body.reason,
    kind: body.kind,
    key: body.key,
  });
}

function relevantEvents(events: Array<HyperbeamDebugEvent>, mode: HyperbeamMode) {
  const relevantIndexes = new Set<number>();

  events.forEach((event, index) => {
    if (isRelevant(event)) {
      relevantIndexes.add(index);
      const previous = events[index - 1];
      if (previous?.label === 'request') relevantIndexes.add(index - 1);
    }
  });

  return events
    .filter((_event, index) => relevantIndexes.has(index))
    .slice(-MAX_RELEVANT_EVENTS)
    .map((event) => compactEvent(event, mode));
}

function isRelevant(event: HyperbeamDebugEvent) {
  const data = event.data || {};
  const status = Number(data.status);
  const sourceLayer = String(data.sourceLayer || '');
  const deviceLayer = String(data.deviceLayer || '');
  return (
    event.level === 'error' ||
    data.ok === false ||
    status >= 400 ||
    sourceLayer === 'native:sdk-proxy' ||
    sourceLayer === 'native-device' ||
    deviceLayer === 'native-device' ||
    sourceLayer.startsWith('fallback') ||
    sourceLayer === 'native-missing' ||
    sourceLayer === 'native-failed' ||
    sourceLayer === 'unknown' ||
    data.sourceReason === 'native_source_required'
  );
}

function compactEvent(event: HyperbeamDebugEvent, mode: HyperbeamMode) {
  const data = event.data || {};
  const body = data.body;
  return pruneEmpty({
    mode,
    time: event.time,
    firstSeen: data.firstSeen,
    lastSeen: data.lastSeen,
    repeatCount: data.repeatCount,
    label: event.label,
    level: event.level,
    method: data.method,
    status: data.status,
    ok: data.ok,
    device: data.device,
    deviceLayer: data.deviceLayer,
    sourceLayer: data.sourceLayer,
    sourceReason: data.sourceReason,
    elapsedMs: data.elapsedMs,
    devicePath: compactPath(data.devicePath),
    url: data.url ? limitString(sanitizeHyperbeamDebugUrl(String(data.url)), 360) : undefined,
    bodyBytes: data.bodyBytes,
    contentType: data.contentType,
    response: compactBody(body),
  });
}

function compactBody(body: any) {
  body = sanitizeHyperbeamDebugValue(body);
  if (body === undefined || body === null) return undefined;
  if (typeof body !== 'object') return limitString(String(body), 1200);

  return pruneEmpty({
    status: body.status,
    reason: body.reason,
    kind: body.kind,
    key: compactKey(body.key),
    error: body.error,
    message: body.message,
    missing_record_path: body.missing_record_path,
    body: typeof body.body === 'string' ? limitString(body.body, 1200) : undefined,
    sourceLayer:
      body['source-layer'] ||
      body.source_layer ||
      body.sourceLayer ||
      body.result?.['source-layer'] ||
      body.result?.source_layer ||
      body.result?.sourceLayer,
    resultStatus: body.result?.status,
    resultReason: body.result?.reason,
    resultKind: body.result?.kind,
    resultKey: compactKey(body.result?.key),
  });
}

function compactPath(value: any) {
  const path = String(value || '');
  return limitString(
    path.replace(/([?&](?:params64|urls64|uri64|auth_token|token|signature)=)[^&\s]+/gi, '$1...'),
    260
  );
}

function compactKey(value: any) {
  value = sanitizeHyperbeamDebugValue(value);
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return value;

  const parsed = parseJsonObject(value);
  if (parsed) {
    const claimIds = Array.isArray(parsed.claim_ids) ? parsed.claim_ids : undefined;
    const commentIds =
      typeof parsed.comment_ids === 'string' ? parsed.comment_ids.split(',').filter(Boolean) : undefined;
    return pruneEmpty({
      claim_ids_count: claimIds?.length,
      claim_ids_sample: claimIds?.slice(0, 5),
      comment_ids_count: commentIds?.length,
      comment_ids_sample: commentIds?.slice(0, 5),
      page: parsed.page,
      page_size: parsed.page_size,
      no_totals: parsed.no_totals,
      channel_id: parsed.channel_id,
      channel_name: parsed.channel_name,
      claim_id: parsed.claim_id,
      sort_by: parsed.sort_by,
      top_level: parsed.top_level,
    });
  }

  return limitString(value, 360);
}

function parseJsonObject(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : undefined;
  } catch (_error) {
    return undefined;
  }
}

function pruneEmpty<T extends Record<string, any>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== '')
  );
}

function limitString(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}
