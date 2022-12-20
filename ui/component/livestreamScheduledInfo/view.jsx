// @flow

import React from 'react';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import moment from 'moment';
import 'scss/component/livestream-scheduled-info.scss';
import I18nMessage from 'component/i18nMessage';
import { getTimeAgoStr } from 'util/time';

const CALC_TIME_INTERVAL_MS = 1000;

type Props = {
  // -- redux --
  releaseTimeMs: number,
};

export default function LivestreamScheduledInfo(props: Props) {
  const { releaseTimeMs } = props;

  const [startDateFromNow, setStartDateFromNow] = React.useState();
  const [inPast, setInPast] = React.useState();

  const startDate = React.useMemo(() => moment(releaseTimeMs).format('MMMM Do, h:mm a'), [releaseTimeMs]);

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

  if (!startDateFromNow) return null;

  return (
    <div className="livestream-scheduled">
      <Icon icon={ICONS.LIVESTREAM_SOLID} size={32} />
      <p className="livestream-scheduled__time">
        <span>
          {!inPast ? (
            <>
              <I18nMessage tokens={{ time_date: startDateFromNow }}>Live %time_date%</I18nMessage>
              <br />
              <span className="livestream-scheduled__date">{startDate}</span>
            </>
          ) : (
            __('Starting Soon')
          )}
        </span>
      </p>
    </div>
  );
}
