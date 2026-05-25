import dayjs from 'util/dayjs';

type DurationUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

export function secondsToHms(seconds: number): string {
  seconds = Math.floor(seconds);
  var hours = Math.floor(seconds / 3600);
  var minutes = Math.floor(seconds / 60) % 60;
  var seconds = seconds % 60;
  return [hours, minutes, seconds]
    .map((v) => (v < 10 ? '0' + v : v))
    .filter((v, i) => v !== '00' || i > 0)
    .join(':');
}

function formatDurationUnit(duration: number, unit: DurationUnit): string {
  switch (unit) {
    case 'year':
      return duration === 1 ? __('%duration% year', { duration }) : __('%duration% years', { duration });
    case 'month':
      return duration === 1 ? __('%duration% month', { duration }) : __('%duration% months', { duration });
    case 'day':
      return duration === 1 ? __('%duration% day', { duration }) : __('%duration% days', { duration });
    case 'hour':
      return duration === 1 ? __('%duration% hour', { duration }) : __('%duration% hours', { duration });
    case 'minute':
      return duration === 1 ? __('%duration% minute', { duration }) : __('%duration% minutes', { duration });
    case 'second':
      return duration === 1 ? __('%duration% second', { duration }) : __('%duration% seconds', { duration });
  }
}

function joinDurationParts(parts: string[]): string {
  if (parts.length <= 1) return parts[0] || '';

  try {
    return new Intl.ListFormat(navigator.language, { style: 'long', type: 'conjunction' }).format(parts);
  } catch {
    return parts.join(', ');
  }
}

export function secondsToDhms(seconds: number): string {
  seconds = Number(seconds);
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];

  if (d > 0) parts.push(formatDurationUnit(d, 'day'));
  if (h > 0) parts.push(formatDurationUnit(h, 'hour'));
  if (m > 0) parts.push(formatDurationUnit(m, 'minute'));
  if (s > 0 && d === 0 && h === 0) parts.push(formatDurationUnit(s, 'second'));

  return joinDurationParts(parts);
}
export function hmsToSeconds(str: string): number {
  let timeParts = str.split(':'),
    seconds = 0,
    multiplier = 1;

  if (timeParts.length > 0) {
    while (timeParts.length > 0) {
      let nextPart = parseInt(timeParts.pop(), 10);

      if (!Number.isInteger(nextPart)) {
        nextPart = 0;
      }

      seconds += multiplier * nextPart;
      multiplier *= 60;
    }
  } else {
    seconds = 0;
  }

  return seconds;
}
// Only intended use of future dates is for claims, in case of scheduled
// publishes or livestreams, used in util/formatAriaLabel
export function getTimeAgoStr(
  date: Date | string | number,
  showFutureDate?: boolean,
  genericSecondsString?: boolean,
  zeroDurationStr: string = 'Just now'
) {
  const units: DurationUnit[] = ['year', 'month', 'day', 'hour', 'minute', 'second'];
  let duration = 0;
  let unit: DurationUnit = 'second';
  for (const candidateUnit of units) {
    // dayjs() is very liberal with it's rounding.
    // Always round down dates for better youtube parity.
    duration = Math.floor(dayjs().diff(date, `${candidateUnit}s` as any));
    unit = candidateUnit;
    if (duration > 0 || (showFutureDate && duration * -1 > 0)) break;
  }

  // negative duration === it's a future date from now
  if (duration < 0 && showFutureDate) {
    duration = duration * -1;

    switch (unit) {
      case 'year':
        return duration === 1 ? __('in %duration% year', { duration }) : __('in %duration% years', { duration });
      case 'month':
        return duration === 1 ? __('in %duration% month', { duration }) : __('in %duration% months', { duration });
      case 'day':
        return duration === 1 ? __('in %duration% day', { duration }) : __('in %duration% days', { duration });
      case 'hour':
        return duration === 1 ? __('in %duration% hour', { duration }) : __('in %duration% hours', { duration });
      case 'minute':
        return duration === 1 ? __('in %duration% minute', { duration }) : __('in %duration% minutes', { duration });
      case 'second':
        return __('in a few seconds');
    }
  }

  if (duration <= 0) return __(zeroDurationStr);
  if (unit === 'second' && genericSecondsString) return __('A few seconds ago');

  switch (unit) {
    case 'year':
      return duration === 1 ? __('%duration% year ago', { duration }) : __('%duration% years ago', { duration });
    case 'month':
      return duration === 1 ? __('%duration% month ago', { duration }) : __('%duration% months ago', { duration });
    case 'day':
      return duration === 1 ? __('%duration% day ago', { duration }) : __('%duration% days ago', { duration });
    case 'hour':
      return duration === 1 ? __('%duration% hour ago', { duration }) : __('%duration% hours ago', { duration });
    case 'minute':
      return duration === 1 ? __('%duration% minute ago', { duration }) : __('%duration% minutes ago', { duration });
    case 'second':
      return duration === 1 ? __('%duration% second ago', { duration }) : __('%duration% seconds ago', { duration });
  }
}
export const getCurrentTimeInSec = (): number => Math.floor(Date.now() / 1000);
export const formatDateToMonthAndDay = (date: Date | string | number): string =>
  dayjs(new Date(date)).format('MMMM DD');
export const formatDateToMonthDayAndYear = (date: Date | string | number): string =>
  dayjs(new Date(date)).format('MMMM DD YYYY');
