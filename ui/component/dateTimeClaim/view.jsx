// @flow
import type { ClaimTsList } from 'redux/selectors/claims';

import React from 'react';
import moment from 'moment';

import { formatDateStr } from './helper';
import { SCHEDULED_TAGS } from 'constants/tags';

type Props = {
  uri: ?string,
  format?: 'date-only',
  disableFromNowFormat?: boolean,
  // --- Internal ---
  claimTsList: ClaimTsList,
  clock24h: ?boolean,
  tags: ?Array<string>,
};

function DateTimeClaim(props: Props) {
  const { claimTsList, clock24h, disableFromNowFormat, format, tags } = props;

  const date: ?Date = resolveDate(tags, claimTsList);
  const clockFormat = clock24h ? 'HH:mm' : 'hh:mm A';
  const title = moment(date).format(`LL ${clockFormat}`);

  function resolveDate(tags: ?Array<string>, claimTsList: ClaimTsList): ?Date {
    // Defaults should match selectDateForUri()
    const defaultTs = claimTsList.released || claimTsList.created;
    return defaultTs ? new Date(defaultTs * 1000) : undefined;
  }

  function isDatePassed(date: ?Date) {
    return date && date.getTime() < Date.now();
  }

  function getDateElem() {
    if (date) {
      if (disableFromNowFormat) {
        return moment(date).format(format === 'date-only' ? 'LL' : clockFormat);
      } else {
        const isScheduled = tags && (tags.includes(SCHEDULED_TAGS.SHOW) || tags.includes(SCHEDULED_TAGS.HIDE));
        const datePassed = isDatePassed(date);
        return formatDateStr(date, isScheduled && !datePassed ? 'Available' : '');
      }
    } else {
      return '...';
    }
  }

  return (
    <span className="date_time" title={title}>
      {getDateElem()}
    </span>
  );
}

export default DateTimeClaim;
