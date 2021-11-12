// @flow

import React from 'react';
import Card from 'component/common/card';
import ClaimPreview from 'component/claimPreview';
import { useHistory } from 'react-router';
import { formatLbryUrlForWeb } from 'util/url';
import watchLivestreamStatus from '$web/src/livestreaming/long-polling';
import { getActiveLivestream } from '$web/src/livestreaming';

type Props = {
  channelClaim: ChannelClaim,
};

export default function LivestreamLink(props: Props) {
  const { channelClaim } = props;
  const { push } = useHistory();
  const [livestreamClaim, setLivestreamClaim] = React.useState(false);
  const [isLivestreaming, setIsLivestreaming] = React.useState(false);
  const livestreamChannelId = (channelClaim && channelClaim.claim_id) || ''; // TODO: fail in a safer way, probably
  // TODO: pput this back when hubs claims_in_channel are fixed
  const isChannelEmpty = !channelClaim || !channelClaim.meta;
  // ||
  // !channelClaim.meta.claims_in_channel;

  React.useEffect(() => {
    // Don't search empty channels
    if (livestreamChannelId && !isChannelEmpty && isLivestreaming) {
      getActiveLivestream(livestreamChannelId)
        .then((res) => {
          if (res && res.items && res.items.length > 0) {
            const claim = res.items[0];
            // $FlowFixMe Too many Claim GenericClaim etc types.
            setLivestreamClaim(claim);
          }
        })
        .catch(() => {});
    }
  }, [livestreamChannelId, isChannelEmpty, isLivestreaming]);

  React.useEffect(() => {
    return watchLivestreamStatus(livestreamChannelId, (state) => setIsLivestreaming(state));
  }, [livestreamChannelId, setIsLivestreaming]);

  if (!livestreamClaim || !isLivestreaming) {
    return null;
  }

  // gonna pass the wrapper in so I don't have to rewrite the dmca/blocking logic in claimPreview.
  const element = (props: { children: any }) => (
    <Card
      className="livestream__channel-link claim-preview__live"
      title={__('Live stream in progress')}
      onClick={() => {
        push(formatLbryUrlForWeb(livestreamClaim.canonical_url));
      }}
    >
      {props.children}
    </Card>
  );

  return <ClaimPreview uri={livestreamClaim.canonical_url} wrapperElement={element} type="inline" />;
}
