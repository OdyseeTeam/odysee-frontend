// @flow

import React, { useState, useEffect } from 'react';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import moment from 'moment';
import 'scss/component/livestream-scheduled-info.scss';

type Props = {
  release: any,
};

export default function LivestreamScheduledInfo(props: Props) {
  const { release } = props;
  const [startDateFromNow, setStartDateFromNow] = useState(release.fromNow());
  const [inPast, setInPast] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setStartDateFromNow(release.fromNow());
      setInPast(release.isBefore(moment()));
    }, 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, [release]);

  const startDate = release.format('MMMM Do, h:mm a');

  return (
    <div className={'livestream-scheduled'}>
      <Icon icon={ICONS.LIVESTREAM_SOLID} size={32} />
      <p className={'livestream-scheduled__time'}>
        {!inPast && <span>Live in {startDateFromNow}</span>}
        {inPast && <span>{__('Starting Soon')}</span>}
        <br />
        <span className={'livestream-scheduled__date'}>{startDate}</span>
      </p>
    </div>
  );
}
