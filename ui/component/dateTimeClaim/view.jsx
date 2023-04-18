// @flow
import React from 'react';
import moment from 'moment';

import { formatDateStr } from './helper';

type Props = {
  uri: ?string,
  format?: 'date-only',
  disableFromNowFormat?: boolean,
  // --- Internal ---
  clock24h: ?boolean,
  date: ?Date,
};

function DateTimeClaim(props: Props) {
  const { clock24h, date, disableFromNowFormat, format } = props;

  const clockFormat = clock24h ? 'HH:mm' : 'hh:mm A';
  const title = moment(date).format(`LL ${clockFormat}`);

  function getDateElem() {
    if (date) {
      if (disableFromNowFormat) {
        return moment(date).format(format === 'date-only' ? 'LL' : clockFormat);
      } else {
        return formatDateStr(date);
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
