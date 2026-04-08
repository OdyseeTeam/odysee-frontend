import React from 'react';
import DateTime from 'component/dateTime';
import { LIVESTREAM_STARTED_RECENTLY_BUFFER } from 'constants/livestream';
import dayjs from 'util/dayjs';
import I18nMessage from 'component/i18nMessage';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectDayjsReleaseTimeForUri,
  selectChannelClaimIdForUri,
  selectClaimReleaseInFutureForUri,
} from 'redux/selectors/claims';
import {
  selectActiveLivestreamForChannel,
  selectClaimIsActiveChannelLivestreamForUri,
  selectLivestreamInfoAlreadyFetchedForCreatorId,
} from 'redux/selectors/livestream';
import { doFetchChannelIsLiveForId } from 'redux/actions/livestream';
type Props = {
  uri: string;
};

const LivestreamDateTime = (props: Props) => {
  const { uri } = props;
  const dispatch = useAppDispatch();
  const channelClaimId = useAppSelector((state) => selectChannelClaimIdForUri(state, uri));
  const releaseTime = useAppSelector((state) => selectDayjsReleaseTimeForUri(state, uri));
  const activeLivestream = useAppSelector((state) => selectActiveLivestreamForChannel(state, channelClaimId));
  const isCurrentClaimLive = useAppSelector((state) => selectClaimIsActiveChannelLivestreamForUri(state, uri));
  const releaseInFuture = useAppSelector((state) => selectClaimReleaseInFutureForUri(state, uri));
  const alreadyFetched = useAppSelector((state) =>
    selectLivestreamInfoAlreadyFetchedForCreatorId(state, channelClaimId)
  );
  React.useEffect(() => {
    if (!alreadyFetched && channelClaimId) {
      dispatch(doFetchChannelIsLiveForId(channelClaimId));
    }
  }, [alreadyFetched, channelClaimId, dispatch]);

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

  if (
    dayjs.unix(releaseTime as any).isBetween(dayjs().subtract(LIVESTREAM_STARTED_RECENTLY_BUFFER, 'minutes'), dayjs())
  ) {
    return __('Starting Soon');
  }

  return (
    <span>
      <I18nMessage
        tokens={{
          time_date: <DateTime timeAgo uri={uri} showFutureDate />,
        }}
      >
        {releaseInFuture ? 'Live %time_date%' : 'Released %time_date%'}
      </I18nMessage>
    </span>
  );
};

export default LivestreamDateTime;
