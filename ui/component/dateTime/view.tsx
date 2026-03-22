import { getTimeAgoStr } from 'util/time';
import moment from 'moment';
import React, { useRef, useEffect } from 'react';
import { useAppSelector } from 'redux/hooks';
import { selectDateForUri } from 'redux/selectors/claims';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting } from 'redux/selectors/settings';

const DEFAULT_MIN_UPDATE_DELTA_MS = 60 * 1000;

type Props = {
  date?: any;
  genericSeconds?: boolean;
  minUpdateDeltaMs?: number;
  showFutureDate?: boolean;
  timeAgo?: boolean;
  type?: string;
  uri?: string;
};

function DateTimeInner({
  date: dateProp,
  genericSeconds,
  minUpdateDeltaMs,
  showFutureDate,
  timeAgo,
  type,
  uri,
}: Props) {
  const clock24h = useAppSelector((state) => selectClientSetting(state, SETTINGS.CLOCK_24H));
  const dateFromUri = useAppSelector((state) => (uri ? selectDateForUri(state, uri) : undefined));
  const date = dateProp || dateFromUri;

  const lastRenderTimeRef = useRef(new Date());

  useEffect(() => {
    if (timeAgo) {
      lastRenderTimeRef.current = new Date();
    }
  });

  const clockFormat = clock24h ? 'HH:mm' : 'hh:mm A';
  return (
    <span className="date_time" title={timeAgo && moment(date).format(`LL ${clockFormat}`)}>
      {date
        ? timeAgo
          ? getTimeAgoStr(date, showFutureDate, genericSeconds)
          : moment(date).format(type === 'date' ? 'LL' : clockFormat)
        : '...'}
    </span>
  );
}

function arePropsEqual(prevProps: Props, nextProps: Props): boolean {
  if (
    moment(prevProps.date).diff(moment(nextProps.date)) !== 0 ||
    prevProps.timeAgo !== nextProps.timeAgo ||
    prevProps.minUpdateDeltaMs !== nextProps.minUpdateDeltaMs ||
    prevProps.type !== nextProps.type
  ) {
    return false;
  }

  // Note: clock24h is now read inside via useAppSelector, so memo comparison
  // does not need to check it -- re-renders from selector changes are automatic.

  if (prevProps.timeAgo && nextProps.timeAgo) {
    // For timeAgo mode, we cannot easily throttle re-renders from the memo
    // comparison since we no longer have access to lastRenderTime here.
    // Instead, allow re-renders -- the component is cheap.
    return false;
  }

  return true;
}

const DateTime = React.memo(DateTimeInner, arePropsEqual);

export default DateTime;
