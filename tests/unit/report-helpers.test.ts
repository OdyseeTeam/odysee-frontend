import fs from 'node:fs';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';
import type { ReportPayload } from '../../ui/page/report/helpers';

let ISSUE: typeof import('../../ui/constants/report_issue');
let buildReportMessage: (payload: ReportPayload) => string;
let buildReportTags: (payload: ReportPayload) => Record<string, string>;
let buildReportTitle: (payload: ReportPayload) => string;
let normalizeLink: (link: string) => string;
let uploadScreenshot: (file: File) => Promise<string>;
const originalFetch = globalThis.fetch;

const makePayload = (overrides: Partial<ReportPayload> = {}): ReportPayload => ({
  kind: ISSUE.KIND_PROBLEM,
  area: ISSUE.AREA_PLAYBACK,
  areaLabel: 'Watching a video',
  symptoms: ['Buffering or stuttering'],
  frequency: ISSUE.FREQUENCY_ALWAYS,
  scope: ISSUE.SCOPE_SINGLE,
  started: 'Earlier today',
  alreadyTried: ['Reloaded the page'],
  link: 'https://odysee.com/@channel/video',
  timestamp: '01:23',
  description: 'Private description supplied to support',
  screenshotUrl: 'https://images.odysee.com/screenshot.png',
  recordingUrl: 'https://odysee.com/@channel/recording',
  email: 'reporter@example.com',
  currentEmail: '',
  newEmail: '',
  diagnostics: [{ label: 'User ID', value: '123' }],
  ...overrides,
});

beforeAll(async () => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      i18n_messages: {},
      navigator: { language: 'en' },
    },
  });

  ISSUE = await import('../../ui/constants/report_issue');
  const helpers = await import('../../ui/page/report/helpers');
  buildReportMessage = helpers.buildReportMessage;
  buildReportTags = helpers.buildReportTags;
  buildReportTitle = helpers.buildReportTitle;
  normalizeLink = helpers.normalizeLink;
  uploadScreenshot = helpers.uploadScreenshot;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.useRealTimers();
});

describe('report helpers', () => {
  it('keeps identifying report details out of the Sentry title', () => {
    const problemTitle = buildReportTitle(makePayload({ symptoms: [] }));
    const emailChangeTitle = buildReportTitle(
      makePayload({
        kind: ISSUE.KIND_EMAIL_CHANGE,
        area: ISSUE.AREA_ACCOUNT,
        areaLabel: '',
        currentEmail: 'old@example.com',
        newEmail: 'new@example.com',
      })
    );

    expect(problemTitle).toBe('UserFeedback: [Watching a video]');
    expect(problemTitle).not.toContain('Private description');
    expect(emailChangeTitle).toBe('UserFeedback: [Email change]');
    expect(emailChangeTitle).not.toContain('example.com');
  });

  it('labels screenshots and recordings separately in the support message and tags', () => {
    const payload = makePayload();
    const message = buildReportMessage(payload);
    const tags = buildReportTags(payload);

    expect(message).toContain(`Screenshot: ${payload.screenshotUrl}`);
    expect(message).toContain(`Recording: ${payload.recordingUrl}`);
    expect(tags.report_has_screenshot).toBe('true');
    expect(tags.report_has_recording).toBe('true');
  });

  it('normalizes required-link input after trimming it', () => {
    expect(normalizeLink('   ')).toBe('');
    expect(normalizeLink('  @channel/video  ')).toBe('https://odysee.com/@channel/video');
  });

  it('uses the generic upload error for failed HTTP responses', async () => {
    const readBody = vi.fn();
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, text: readBody });

    await expect(uploadScreenshot(new File(['image'], 'report.png'))).rejects.toThrow(
      'The image could not be uploaded. Try a different file.'
    );
    expect(readBody).not.toHaveBeenCalled();
  });

  it('aborts screenshot uploads that do not finish', async () => {
    vi.useFakeTimers();
    let uploadSignal: AbortSignal | undefined;
    globalThis.fetch = vi.fn((_url, options) => {
      uploadSignal = options?.signal;
      return new Promise((_resolve, reject) => {
        uploadSignal?.addEventListener('abort', () => reject(new Error('aborted')));
      });
    }) as typeof fetch;

    const upload = uploadScreenshot(new File(['image'], 'report.png'));
    const rejection = expect(upload).rejects.toThrow('The image could not be uploaded. Try a different file.');
    await vi.advanceTimersByTimeAsync(30000);

    await rejection;
    expect(uploadSignal?.aborted).toBe(true);
  });
});

describe('report translations', () => {
  it('includes every dynamically translated taxonomy string in app-strings.json', () => {
    const appStrings = JSON.parse(
      fs.readFileSync(new URL('../../static/app-strings.json', import.meta.url), 'utf8')
    ) as Record<string, string>;
    const taxonomyStrings = [
      ...ISSUE.AREAS.flatMap((area) => [area.label, area.linkLabel, ...area.symptoms]),
      ...ISSUE.FREQUENCIES,
      ...ISSUE.SCOPES,
      ...ISSUE.STARTED_OPTIONS,
      ...ISSUE.ALREADY_TRIED_OPTIONS,
    ].filter((value): value is string => Boolean(value));

    taxonomyStrings.forEach((value) => expect(appStrings[value]).toBe(value));
  });
});
