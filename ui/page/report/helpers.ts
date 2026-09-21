import { IMG_CDN_PUBLISH_URL, JSON_RESPONSE_KEYS, UPLOAD_CONFIG } from 'constants/cdn_urls';
import { platform } from 'util/platform';
import { URL as SITE_URL } from 'config';
import { KIND_EMAIL_CHANGE, KIND_FEATURE, KIND_PROBLEM } from 'constants/report_issue';

export type Diagnostic = {
  label: string;
  value: string;
};

export type ReportPayload = {
  kind: string;
  area: string;
  areaLabel: string;
  symptoms: Array<string>;
  frequency: string;
  scope: string;
  started: string;
  alreadyTried: Array<string>;
  link: string;
  timestamp: string;
  description: string;
  screenshotUrl: string;
  recordingUrl: string;
  email: string;
  currentEmail: string;
  newEmail: string;
  diagnostics: Array<Diagnostic>;
};

// ****************************************************************************
// Diagnostics
// ****************************************************************************

/**
 * Everything support would otherwise have to ask for in a follow-up email.
 * Collected from the browser only -- nothing here is fetched or persisted, and
 * the whole list is shown to the reporter before they submit.
 */
export function collectDiagnostics(userId?: number | string | null): Array<Diagnostic> {
  const diagnostics: Array<Diagnostic> = [];

  const push = (label: string, value: any) => {
    if (value !== undefined && value !== null && value !== '') {
      diagnostics.push({ label, value: String(value) });
    }
  };

  try {
    push('Browser', platform.browserName());
    push('OS', platform.os());
    push('Device', platform.isMobile() ? 'Mobile' : 'Desktop');
    // Kept as a rough region signal (where the reporter likely is), which helps
    // with geo-restricted content and CDN-edge issues.
    push('Timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
    push('Build', process.env.BUILD_REV);
    push('User ID', userId);

    // `connection` is Chromium-only; absent elsewhere.
    const connection = (navigator as any).connection;
    if (connection) {
      push('Connection', [connection.effectiveType, connection.saveData ? 'data-saver' : ''].filter(Boolean).join(' '));
    }

    // Only useful when it points back at Odysee -- an external referrer tells us
    // nothing and may be private.
    if (SITE_URL && document.referrer && document.referrer.startsWith(SITE_URL)) {
      push('Came from', document.referrer);
    }
  } catch {
    // Diagnostics are best-effort: never block a report because a browser API
    // is missing or throws behind a privacy setting.
  }

  return diagnostics;
}

// ****************************************************************************
// Screenshot upload
// ****************************************************************************

/**
 * Uploads to the same image host used for publish thumbnails and returns the
 * hosted URL, which we then include as a plain link in the report.
 */
export async function uploadScreenshot(file: File): Promise<string> {
  const data = new FormData();
  data.append(UPLOAD_CONFIG.BLOB_KEY, file);
  data.append(UPLOAD_CONFIG.ACTION_KEY, UPLOAD_CONFIG.ACTION_VAL);

  const errorMessage = __('The image could not be uploaded. Try a different file.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(IMG_CDN_PUBLISH_URL, {
      method: 'POST',
      body: data,
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(errorMessage);

    const text = await response.text();
    const json = text.length ? JSON.parse(text) : {};
    const url = json[JSON_RESPONSE_KEYS.UPLOADED_URL];

    if (json[JSON_RESPONSE_KEYS.STATUS] !== 'success' || !url) throw new Error(errorMessage);

    return url;
  } catch {
    throw new Error(errorMessage);
  } finally {
    clearTimeout(timeout);
  }
}

// ****************************************************************************
// Validation
// ****************************************************************************

/**
 * Caps input length without passing a `maxlength`/`max` attribute down to
 * FormField -- the former is an invalid DOM prop and the latter renders a
 * character counter, which is noise on a link or email field.
 */
export function capped(value: string, limit: number): string {
  return value.length > limit ? value.slice(0, limit) : value;
}

/**
 * People paste what they see in the address bar, not a well-formed URL. Accepts
 * `odysee.com/@ch/vid`, `@ch/vid` and `/@ch/vid` alongside full links, and
 * returns something support can click.
 */
export function normalizeLink(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // A bare Odysee path -- resolve it against the site root.
  if (trimmed.startsWith('@') || trimmed.startsWith('/')) {
    const base = (SITE_URL || 'https://odysee.com').replace(/\/+$/, '');
    return `${base}/${trimmed.replace(/^\/+/, '')}`;
  }

  return `https://${trimmed.replace(/^\/+/, '')}`;
}

export function isValidLink(link: string): boolean {
  if (!link.trim()) return true;

  try {
    const { protocol, hostname } = new URL(normalizeLink(link));
    // A hostname with no dot is a typo, not a domain (`odysee` vs `odysee.com`).
    return (protocol === 'http:' || protocol === 'https:') && hostname.includes('.');
  } catch {
    return false;
  }
}

/** Accepts `mm:ss` and `hh:mm:ss`, matching the content-report form. */
export function isValidTimestamp(timestamp: string): boolean {
  if (!timestamp) return true;
  return /^\d{1,2}:[0-5]\d(:[0-5]\d)?$/.test(timestamp);
}

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

export function formatPlayerTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// ****************************************************************************
// Message composition
// ****************************************************************************

/**
 * Marker that identifies a user-submitted report inside the shared
 * `event/desktop_error` stream, which otherwise carries automated crash noise.
 * Downstream tooling (the support Slack hook) filters on it, so it MUST remain
 * the first thing in the message. @see #2978
 */
export const USER_FEEDBACK_PREFIX = 'UserFeedback';

const KIND_LABELS: { [key: string]: string } = {
  [KIND_FEATURE]: 'Feature request',
  [KIND_EMAIL_CHANGE]: 'Email change',
  [KIND_PROBLEM]: 'Problem',
};

/** One-line gist used for the support API marker line. */
function buildReportSummary(payload: ReportPayload): string {
  if (payload.kind === KIND_EMAIL_CHANGE) {
    return `[Email change] ${payload.currentEmail} -> ${payload.newEmail}`;
  }

  const area = payload.kind === KIND_FEATURE ? 'Feature request' : payload.areaLabel;
  const detail = payload.symptoms[0] || payload.description;
  const trimmed = detail.length > 80 ? `${detail.slice(0, 80)}…` : detail;
  return `[${area}] ${trimmed}`;
}

/**
 * The support API accepts a single free-text field, so every structured answer
 * is rendered into labelled sections here. Kept plain-text and stable so it
 * stays greppable on the receiving end.
 */
export function buildReportMessage(payload: ReportPayload): string {
  const lines: Array<string> = [`${USER_FEEDBACK_PREFIX}: ${buildReportSummary(payload)}`];

  const section = (title: string) => {
    lines.push('', `--- ${title} ---`);
  };
  const field = (label: string, value: string) => {
    if (value) lines.push(`${label}: ${value}`);
  };

  section('Report');
  field('Type', KIND_LABELS[payload.kind] || 'Problem');
  field('Current email', payload.currentEmail);
  field('Requested new email', payload.newEmail);
  field('Area', payload.areaLabel);
  field('Link', payload.link);
  field('Timestamp', payload.timestamp);
  field('Symptoms', payload.symptoms.join(', '));
  field('Frequency', payload.frequency);
  field('Scope', payload.scope);
  field('Started', payload.started);
  field('Already tried', payload.alreadyTried.join(', '));
  field('Screenshot', payload.screenshotUrl);
  field('Recording', payload.recordingUrl);
  field('Reply to', payload.email);

  section('Description');
  lines.push(payload.description);

  if (payload.diagnostics.length) {
    section('Diagnostics');
    payload.diagnostics.forEach(({ label, value }) => field(label, value));
  }

  return lines.join('\n').trim();
}

/**
 * Short, stable title so Sentry groups related reports together instead of
 * creating one issue per free-text description.
 */
export function buildReportTitle(payload: ReportPayload): string {
  const area =
    payload.kind === KIND_EMAIL_CHANGE
      ? 'Email change'
      : payload.kind === KIND_FEATURE
        ? 'Feature request'
        : payload.areaLabel || 'Problem';
  return `${USER_FEEDBACK_PREFIX}: [${area}]`;
}

/** Sentry receives only non-identifying, short scalar metadata. */
export function buildReportTags(payload: ReportPayload): { [key: string]: string } {
  return {
    origin: '/$/report',
    report_kind: payload.kind,
    report_area: payload.area,
    report_frequency: payload.frequency || 'unspecified',
    report_scope: payload.scope || 'unspecified',
    report_started: payload.started || 'unspecified',
    report_has_link: String(Boolean(payload.link)),
    report_has_screenshot: String(Boolean(payload.screenshotUrl)),
    report_has_recording: String(Boolean(payload.recordingUrl)),
    report_has_email: String(Boolean(payload.email)),
    report_symptom_count: String(payload.symptoms.length),
  };
}
