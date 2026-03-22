import * as React from 'react';
import Button from 'component/button';
import I18nMessage from 'component/i18nMessage';
import LbcSymbol from 'component/common/lbc-symbol';
import { useAppSelector } from 'redux/hooks';
import { selectInsufficientCreditsForUri } from 'redux/selectors/content';
import { selectClaimWasPurchasedForUri } from 'redux/selectors/claims';

type Props = {
  uri: string;
  fileInfo: FileListItem;
};

function ClaimInsufficientCredits(props: Props) {
  const { uri, fileInfo } = props;
  const isInsufficientCredits = useAppSelector((state) => selectInsufficientCreditsForUri(state, uri));
  const claimWasPurchased = useAppSelector((state) => selectClaimWasPurchasedForUri(state, uri));

  if (fileInfo || !isInsufficientCredits || claimWasPurchased) {
    return null;
  }

  return (
    <div className="media__insufficient-credits help--warning">
      <I18nMessage
        tokens={{
          reward_link: <Button button="link" navigate="/$/rewards" label={__('Receive Credits')} />,
          lbc: <LbcSymbol />,
        }}
      >
        The publisher has chosen to request %lbc% to view this content. Your balance is currently too low to view it.
        Check out %reward_link% to receive Credits.
      </I18nMessage>
    </div>
  );
}

export default ClaimInsufficientCredits;
