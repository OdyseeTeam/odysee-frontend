import React from 'react';
import DateTime from 'component/dateTime';
import { LIVESTREAM_STARTED_RECENTLY_BUFFER } from 'constants/livestream';
import moment from 'moment';
import I18nMessage from 'component/i18nMessage';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectMomentReleaseTimeForUri,
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
  const releaseTime = useAppSelector((state) => selectMomentReleaseTimeForUri(state, uri));
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

  if (moment.unix(releaseTime).isBetween(moment().subtract(LIVESTREAM_STARTED_RECENTLY_BUFFER, 'minutes'), moment())) {
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
