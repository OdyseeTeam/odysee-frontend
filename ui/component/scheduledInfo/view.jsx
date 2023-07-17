// @flow

import React from 'react';
import moment from 'moment';

import './style.scss';
import Icon from 'component/common/icon';
import I18nMessage from 'component/i18nMessage';
import * as ICONS from 'constants/icons';
import { getTimeAgoStr } from 'util/time';

const CALC_TIME_INTERVAL_MS = 1000;

type Props = {
  uri: ?string,
  // -- internal --
  isLivestream: boolean,
  releaseTimeMs: number,
};

function ScheduledInfo(props: Props) {
  const { isLivestream, releaseTimeMs } = props;

  const [startDateFromNow, setStartDateFromNow] = React.useState();
  const [inPast, setInPast] = React.useState();

  const startDate = React.useMemo(() => moment(releaseTimeMs).format('LLL'), [releaseTimeMs]);

  const icon = isLivestream ? ICONS.LIVESTREAM_SOLID : ICONS.TIME;
  const text = isLivestream ? 'Live %time_date%' : 'Available %time_date%';

  React.useEffect(() => {
    const calcTime = () => {
      const zeroDurationStr = '---';
      const timeAgoStr = getTimeAgoStr(releaseTimeMs, true, true, zeroDurationStr);
      const isZeroDuration = timeAgoStr === zeroDurationStr;

      if (isZeroDuration) {
        setInPast(true);
      } else {
        setStartDateFromNow(timeAgoStr);
        setInPast(releaseTimeMs < Date.now());
      }
    };

    calcTime();

    const intervalId = setInterval(calcTime, CALC_TIME_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [releaseTimeMs]);

  // **************************************************************************
  // **************************************************************************

  if (!startDateFromNow) {
    return null;
  }

  return (
    <div className="scheduled-info">
      <Icon icon={icon} size={32} />
      {inPast && <div className="scheduled-info__text">{__('Starting Soon')}</div>}
      {!inPast && (
        <div className="scheduled-info__text">
          <I18nMessage tokens={{ time_date: startDateFromNow }}>{text}</I18nMessage>
          <div className="scheduled-info__date">{startDate}</div>
        </div>
      )}
    </div>
  );
}

export default ScheduledInfo;
