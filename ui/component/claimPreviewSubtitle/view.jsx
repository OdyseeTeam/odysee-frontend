// @flow
import { ENABLE_NO_SOURCE_CLAIMS } from 'config';
import React from 'react';
import UriIndicator from 'component/uriIndicator';
import DateTime from 'component/dateTime';
import Button from 'component/button';
import FileViewCountInline from 'component/fileViewCountInline';
import { parseURI } from 'util/lbryURI';

type Props = {
  uri: string,
  claim: ?Claim,
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
  const claimsInChannel = (claim && claim.meta.claims_in_channel) || 0;

  const claimId = (claim && claim.claim_id) || '0';
  const formattedSubCount = Number(subCount).toLocaleString();
  React.useEffect(() => {
    fetchSubCount(claimId);
  }, [uri, fetchSubCount, claimId]);

  let isChannel;
  let name;
  try {
    ({ streamName: name, isChannel } = parseURI(uri));
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
                    {formattedSubCount} {subCount !== 1 ? __('Followers') : __('Follower')}
                    &nbsp;&bull; {claimsInChannel} {claimsInChannel === 1 ? __('upload') : __('uploads')}
                  </span>
                </>
              )}

              {!isChannel &&
                (isLivestream && ENABLE_NO_SOURCE_CLAIMS ? (
                  __('Livestream')
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
