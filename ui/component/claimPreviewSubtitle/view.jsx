// @flow
import { ENABLE_NO_SOURCE_CLAIMS } from 'config';
import React from 'react';
import UriIndicator from 'component/uriIndicator';
import DateTime from 'component/dateTime';
import Button from 'component/button';
import FileViewCountInline from 'component/fileViewCountInline';
import { parseURI } from 'util/lbryURI';
import moment from 'moment';

type Props = {
  uri: string,
  claim: ?StreamClaim,
  pending?: boolean,
  type: string,
  beginPublish: (?string) => void,
  isLivestream: boolean,
  fetchSubCount: (string) => void,
  subCount: number,
};

// previews used in channel overview and homepage (and other places?)
function ClaimPreviewSubtitle(props: Props) {
  const { pending, uri, claim, type, beginPublish, isLivestream, fetchSubCount, subCount } = props;
  const isChannel = claim && claim.value_type === 'channel';
  const claimsInChannel = (claim && claim.meta.claims_in_channel) || 0;

  const claimId = (claim && claim.claim_id) || '0';
  const formattedSubCount = Number(subCount).toLocaleString();

  let isScheduledLivestream = false;
  let livestreamReleaseDate;

  if (claim && isLivestream) {
    const releaseMoment =
      typeof claim.value.release_time === 'number' ? moment(claim.value.release_time * 1000) : moment();
    isScheduledLivestream = releaseMoment.isAfter();
    livestreamReleaseDate = releaseMoment.format('MMM Do, h:mm A');
  }

  React.useEffect(() => {
    if (isChannel) {
      fetchSubCount(claimId);
    }
  }, [isChannel, fetchSubCount, claimId]);

  let name;
  try {
    ({ streamName: name } = parseURI(uri));
  } catch (e) {}

  return (
    <div className="media__subtitle">
      {claim ? (
        <React.Fragment>
          <UriIndicator uri={uri} link />{' '}
          {!pending && claim && (
            <>
              {isChannel && type !== 'inline' && (
                <>
                  <span className="claim-preview-metadata-sub-upload">
                    {subCount === 1 ? __('1 Follower') : __('%formattedSubCount% Followers', { formattedSubCount })}
                    &nbsp;&bull; {claimsInChannel} {claimsInChannel === 1 ? __('upload') : __('uploads')}
                  </span>
                </>
              )}

              {!isChannel &&
                (isLivestream && ENABLE_NO_SOURCE_CLAIMS ? (
                  <>
                    {__('Livestream')}
                    {isScheduledLivestream && <span> / {livestreamReleaseDate}</span>}
                  </>
                ) : (
                  <>
                    <FileViewCountInline uri={uri} isLivestream={isLivestream} />
                    <DateTime timeAgo uri={uri} />
                  </>
                ))}
            </>
          )}
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div>{__('Upload something and claim this spot!')}</div>
          <div className="card__actions">
            <Button onClick={() => beginPublish(name)} button="primary" label={__('Publish to %uri%', { uri })} />
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

export default ClaimPreviewSubtitle;
