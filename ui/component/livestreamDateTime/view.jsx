// @flow
import React from 'react';
import DateTime from 'component/dateTime';
import { LIVESTREAM_STARTED_RECENTLY_BUFFER } from 'constants/livestream';
import moment from 'moment';
import I18nMessage from 'component/i18nMessage';

type Props = {
  uri: string,
  // -- redux --
  releaseTime: any,
  activeLivestream: any,
  isCurrentClaimLive: ?boolean,
};

const LivestreamDateTime = (props: Props) => {
  const { uri, releaseTime, activeLivestream, isCurrentClaimLive } = props;

  if (activeLivestream && isCurrentClaimLive) {
    return (
      <span>
        <I18nMessage
          tokens={{
            time_date: (
              <DateTime
                timeAgo
                date={activeLivestream.startedStreaming && activeLivestream.startedStreaming.toDate()}
              />
            ),
          }}
        >
          Started %time_date%
        </I18nMessage>
      </span>
    );
  }

  if (moment.unix(releaseTime).isBetween(moment().subtract(LIVESTREAM_STARTED_RECENTLY_BUFFER, 'minutes'), moment())) {
    return __('Starting Soon');
  }

  return (
    <span>
      <I18nMessage tokens={{ time_date: <DateTime timeAgo uri={uri} showFutureDate /> }}>Released %time_date%</I18nMessage>
    </span>
  );
};

export default LivestreamDateTime;
