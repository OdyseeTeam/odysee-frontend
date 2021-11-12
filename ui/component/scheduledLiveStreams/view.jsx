// @flow

import React, { useEffect, useState } from 'react';
import ClaimList from 'component/claimList';
import Card from 'component/common/card';
import { getScheduledLivestreams } from '$web/src/livestreaming';

type Props = {
  channelClaim: ChannelClaim,
  ready: () => void,
};

const ScheduledLiveStreams = (props: Props) => {
  const { channelClaim, ready } = props;
  const [scheduledClaims, setScheduledClaims] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const claimSearch = await getScheduledLivestreams(channelClaim.claim_id);
        setScheduledClaims(claimSearch.items.length ? claimSearch.items.map((claim) => claim.permanent_url) : []);
      } finally {
        ready();
      }
    })();
  }, [channelClaim.claim_id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    scheduledClaims.length > 0 && (
      <Card title={__('Upcoming Livestreams')} className={'mb-m'}>
        <ClaimList tileLayout uris={scheduledClaims} showNoSourceClaims />
      </Card>
    )
  );
};

export default ScheduledLiveStreams;
