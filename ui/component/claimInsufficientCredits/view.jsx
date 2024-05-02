// @flow
import * as React from 'react';
import Button from 'component/button';
import I18nMessage from 'component/i18nMessage';
import LbcSymbol from 'component/common/lbc-symbol';

type Props = {
  uri: string,
  fileInfo: FileListItem,
  isInsufficientCredits: boolean,
  claimWasPurchased: boolean,
};

function ClaimInsufficientCredits(props: Props) {
  const { isInsufficientCredits, fileInfo, claimWasPurchased } = props;

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
