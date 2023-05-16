// @flow
import moment from 'moment';

export function formatDateStr(date: Date, prefix: string = '', zeroDurationStr: string = 'Just now') {
  const suffixList = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];
  const showFutureDate = true;
  const genericSecondsString = false;

  let duration = 0;
  let suffix = '';
  let str = '';

  suffixList.some((s) => {
    // moment() is very liberal with it's rounding.
    // Always round down dates for better youtube parity.
    duration = Math.floor(moment().diff(date, s));
    suffix = s;

    return duration > 0 || (showFutureDate && duration * -1 > 0);
  });

  // Strip off the ending 's' for the singular suffix
  if (duration === 1 || (duration === -1 && showFutureDate)) {
    suffix = suffix.replace(/s$/g, '');
  }

  if (duration < 0 && showFutureDate) {
    if (suffix === 'second' || suffix === 'seconds') {
      str = prefix ? `${prefix} in a few seconds` : 'in a few seconds';
    } else {
      str = prefix ? `${prefix} in %duration% ${suffix}` : `in %duration% ${suffix}`;
    }
    duration = duration * -1;
  } else if (duration <= 0) {
    str = zeroDurationStr;
  } else {
    if (suffix === 'seconds' && genericSecondsString) {
      str = prefix ? `${prefix} a few seconds ago` : 'A few seconds ago';
    } else {
      str = prefix ? `${prefix} %duration% ${suffix} ago` : `%duration% ${suffix} ago`;
    }
  }

  return __(str, { duration });
}
