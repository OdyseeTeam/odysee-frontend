import type { ClaimTsList } from 'redux/selectors/claims';
import React from 'react';
import moment from 'moment';
import { formatDateStr } from './helper';
import { SCHEDULED_TAGS, VISIBILITY_TAGS } from 'constants/tags';
import { useAppSelector } from 'redux/hooks';
import { selectTagsRawForUri, selectTimestampsForUri } from 'redux/selectors/claims';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting } from 'redux/selectors/settings';
type Props = {
  uri: string | null | undefined;
  format?: 'date-only';
  disableFromNowFormat?: boolean;
};

function isDatePassed(date: Date | null | undefined) {
  return date && date.getTime() < Date.now();
}

function DateTimeClaim(props: Props) {
  const { uri, disableFromNowFormat, format } = props;
  const claimTsList = useAppSelector((state) => selectTimestampsForUri(state, uri));
  const clock24h = useAppSelector((state) => selectClientSetting(state, SETTINGS.CLOCK_24H));
  const tags = useAppSelector((state) => selectTagsRawForUri(state, uri));
  const date: Date | null | undefined = resolveDate(tags, claimTsList);
  const clockFormat = clock24h ? 'HH:mm' : 'hh:mm A';
  const title = moment(date).format(`LL ${clockFormat}`);

  function resolveDate(tags: Array<string> | null | undefined, claimTsList: ClaimTsList): Date | null | undefined {
    // Defaults should match selectDateForUri()
    const forceCreationTimestamp = tags && tags.includes(VISIBILITY_TAGS.UNLISTED);
    const defaultTs = !forceCreationTimestamp ? claimTsList.released || claimTsList.created : claimTsList.created;
    return defaultTs ? new Date(defaultTs * 1000) : undefined;
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

export default React.memo(DateTimeClaim);
