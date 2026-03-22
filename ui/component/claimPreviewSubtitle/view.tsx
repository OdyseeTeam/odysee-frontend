import React from 'react';
import UriIndicator from 'component/uriIndicator';
import DateTimeClaim from 'component/dateTimeClaim';
import LivestreamDateTime from 'component/livestreamDateTime';
import Button from 'component/button';
import FileViewCountInline from 'component/fileViewCountInline';
import { getChannelSubCountStr, getChannelViewCountStr } from 'util/formatMediaDuration';
import { toCompactNotation } from 'util/string';
import { parseURI } from 'util/lbryURI';
import { EmbedContext } from 'contexts/embed';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectClaimForUri, makeSelectClaimIsPending } from 'redux/selectors/claims';
import { selectLanguage } from 'redux/selectors/settings';
import { doBeginPublish } from 'redux/actions/publish';
import { doFetchSubCount, selectSubCountForUri } from 'lbryinc';
import { isStreamPlaceholderClaim } from 'util/claim';
const SPACED_BULLET = '\u00A0\u2022\u00A0';
type Props = {
  uri: string;
  type?: string;
  showAtSign?: boolean;
};

// previews used in channel overview and homepage (and other places?)
function ClaimPreviewSubtitle(props: Props) {
  const { uri, type, showAtSign } = props;
  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const pending = useAppSelector((state) => makeSelectClaimIsPending(uri)(state));
  const isLivestream = isStreamPlaceholderClaim(claim);
  const isChannel = claim && claim.value_type === 'channel';
  const subCount = useAppSelector((state) =>
    isChannel ? selectSubCountForUri(state, claim.repost_url ? claim.canonical_url : uri) : null
  );
  const lang = useAppSelector((state) => selectLanguage(state));
  const fetchSubCount = React.useCallback((id: string) => dispatch(doFetchSubCount(id)), [dispatch]);
  const isEmbed = React.useContext(EmbedContext);
  const claimsInChannel = (claim && claim.meta.claims_in_channel) || 0;
  const claimId = (claim && claim.claim_id) || '0';
  const formattedSubCount = subCount ? toCompactNotation(subCount, lang, 10000) : null;
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
          <UriIndicator uri={uri} showAtSign={showAtSign} link external={isEmbed} />
          {!pending && claim && (
            <>
              {isChannel && type !== 'inline' && (
                <>
                  <span className="claim-preview-metadata-sub-upload">
                    {getChannelViewCountStr(claimsInChannel)}
                    {Number.isInteger(subCount) ? SPACED_BULLET : ''}
                    {getChannelSubCountStr(subCount, formattedSubCount)}
                  </span>
                </>
              )}

              {!isChannel &&
                (isLivestream ? (
                  <LivestreamDateTime uri={uri} />
                ) : (
                  <span className="claim-extra-info">
                    <FileViewCountInline uri={uri} />
                    <DateTimeClaim uri={uri} />
                  </span>
                ))}
            </>
          )}
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div>{__('Upload something and claim this spot!')}</div>
          <div className="card__actions">
            <Button
              onClick={() => dispatch(doBeginPublish('file', name))}
              button="primary"
              label={__('Publish to %uri%', {
                uri,
              })}
            />
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

export default React.memo(ClaimPreviewSubtitle);
