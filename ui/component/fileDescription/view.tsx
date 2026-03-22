import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import React from 'react';
import classnames from 'classnames';
import { formatCredits } from 'util/format-credits';
import MarkdownPreview from 'component/common/markdown-preview';
import ClaimTags from 'component/claimTags';
import Button from 'component/button';
import LbcSymbol from 'component/common/lbc-symbol';
import FileDetails from 'component/fileDetails';
import FileValues from 'component/fileValues';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectClaimForUri,
  selectClaimIsMine,
  selectIsStreamPlaceholderForUri,
  selectIsShortForUri,
} from 'redux/selectors/claims';
import { makeSelectPendingAmountByUri } from 'redux/selectors/wallet';
import { doOpenModal } from 'redux/actions/app';
import { getClaimMetadata } from 'util/claim';
type Props = {
  uri: string;
  expandOverride: boolean;
};
export default function FileDescription(props: Props) {
  const { uri, expandOverride } = props;
  const dispatch = useAppDispatch();

  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const pendingAmount = useAppSelector((state) => makeSelectPendingAmountByUri(uri)(state));
  const metadata = getClaimMetadata(claim);
  const description = metadata && metadata.description;
  const amount = claim ? parseFloat(claim.amount) + parseFloat(pendingAmount || claim.meta?.support_amount) : 0;
  const hasSupport = claim && claim.meta && claim.meta.support_amount && Number(claim.meta.support_amount) > 0;
  const isLivestreamClaim = useAppSelector((state) => selectIsStreamPlaceholderForUri(state, uri));
  const isEmpty = !claim || !metadata;
  const claimIsMine = useAppSelector((state) => selectClaimIsMine(state, claim));
  const isShort = useAppSelector((state) => selectIsShortForUri(state, uri));

  const doOpenModal_ = (...args: Parameters<typeof doOpenModal>) => dispatch(doOpenModal(...args));
  const [expanded, setExpanded] = React.useState(isShort);
  const [showCreditDetails, setShowCreditDetails] = React.useState(false);
  const formattedAmount = formatCredits(amount, 2, true);
  const shouldRenderFullDescription = expanded || expandOverride || isLivestreamClaim;
  const previewDescription = React.useMemo(() => {
    if (!description) return description;
    if (shouldRenderFullDescription) return description;

    const MAX_COLLAPSED_DESCRIPTION_LENGTH = 4000;
    return description.length > MAX_COLLAPSED_DESCRIPTION_LENGTH
      ? `${description.slice(0, MAX_COLLAPSED_DESCRIPTION_LENGTH)}...`
      : description;
  }, [description, shouldRenderFullDescription]);

  if (isEmpty) {
    return <span className="empty">{__('Empty claim or metadata info.')}</span>;
  }

  return (
    <>
      <div
        className={classnames({
          'media__info-text--contracted media__info-text--fade': !expanded && !expandOverride && !isLivestreamClaim,
          'media__info-text--expanded': expanded || isLivestreamClaim,
        })}
      >
        <div className="mediaInfo__description">
          {previewDescription && (
            <MarkdownPreview
              className="markdown-preview--description"
              content={previewDescription}
              simpleLinks
              strip={!shouldRenderFullDescription}
            />
          )}
          <ClaimTags uri={uri} type="large" />
          {expanded && <FileDetails uri={uri} />}
        </div>
      </div>

      <div className="card__bottom-actions">
        {!expandOverride && (
          <>
            {!isLivestreamClaim && !isShort && (
              <Button button="link" label={expanded ? __('Less') : __('More')} onClick={() => setExpanded(!expanded)} />
            )}
            {isLivestreamClaim && <Button />}
          </>
        )}

        <div className="section__actions--no-margin">
          {claimIsMine && hasSupport && (
            <Button
              button="link"
              className="expandable__button"
              icon={ICONS.UNLOCK}
              aria-label={__('Unlock tips')}
              onClick={() =>
                doOpenModal_(MODALS.LIQUIDATE_SUPPORTS, {
                  uri,
                })
              }
            />
          )}

          <Button button="link" onClick={() => setShowCreditDetails(!showCreditDetails)}>
            <LbcSymbol postfix={showCreditDetails ? __('Hide') : formattedAmount} />
          </Button>
        </div>
      </div>

      {showCreditDetails && <FileValues uri={uri} />}
    </>
  );
}
