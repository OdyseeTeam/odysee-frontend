import ChannelThumbnail from 'component/channelThumbnail';
import React from 'react';
import MembershipBadge from 'component/membershipBadge';
import twemoji from 'twemoji';
import { useAppSelector } from 'redux/hooks';
import { selectClaimForUri } from 'redux/selectors/claims';
import { formatLbryChannelName } from 'util/url';
import { getClaimTitle, getChannelIdFromClaim } from 'util/claim';
import { selectUserOdyseeMembership } from 'redux/selectors/memberships';
type Props = {
  emote?: any;
  uri?: string;
  emoji?: string;
};
export default function TextareaSuggestionsItem(props: Props) {
  const { emote, uri, ...autocompleteProps } = props;
  const claim = useAppSelector((state) => (uri ? selectClaimForUri(state, uri) : undefined));
  const odyseeMembership = useAppSelector((state) => selectUserOdyseeMembership(state, getChannelIdFromClaim(claim)));
  const claimLabel = claim ? formatLbryChannelName(claim.canonical_url) : undefined;
  const claimTitle = claim ? getClaimTitle(claim) : undefined;

  const Twemoji = ({ emoji }) => (
    <span
      dangerouslySetInnerHTML={{
        __html: twemoji.parse(emoji, {
          folder: 'svg',
          ext: '.svg',
        }),
      }}
    />
  );

  if (emote) {
    const { name: value, url, unicode } = emote;
    return (
      <div {...autocompleteProps}>
        {unicode ? (
          <div className="emote">
            <Twemoji emoji={unicode} />
          </div>
        ) : (
          <img className="emote" src={url} />
        )}

        <div className="textarea-suggestion__label">
          <span className="textarea-suggestion__title textarea-suggestion__value textarea-suggestion__value--emote">
            {value}
          </span>
        </div>
      </div>
    );
  }

  if (claimLabel) {
    const value = claimLabel;
    return (
      <div {...autocompleteProps}>
        <ChannelThumbnail xsmall uri={uri} />

        <div className="textarea-suggestion__label">
          <span className="textarea-suggestion__title">{claimTitle || value}</span>
          <span className="textarea-suggestion__value">
            {value}
            {odyseeMembership && <MembershipBadge membershipName={odyseeMembership} />}
          </span>
        </div>
      </div>
    );
  }

  return null;
}
