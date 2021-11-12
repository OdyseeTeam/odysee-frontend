// @flow

import React, { useState, useEffect } from 'react';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import moment from 'moment';
import 'scss/component/livestream-scheduled-info.scss';

type Props = {
  releaseTime: number,
};

export default function LivestreamScheduledInfo(props: Props) {
  const { releaseTime } = props;
  const releaseMoment = moment(releaseTime * 1000);
  const [startDateFromNow, setStartDateFromNow] = useState(releaseMoment.fromNow());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setStartDateFromNow(releaseMoment.fromNow());
    }, 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const startDate = releaseMoment.format('MMMM Do, h:mm a');

  return (
    <div className={'livestream-scheduled'}>
      <Icon icon={ICONS.LIVESTREAM_SOLID} size={32} />
      <p className={'livestream-scheduled__time'}>
        <span>Live in {startDateFromNow}</span>
        <br />
        <span className={'livestream-scheduled__date'}>{startDate}</span>
      </p>
    </div>
  );
}
