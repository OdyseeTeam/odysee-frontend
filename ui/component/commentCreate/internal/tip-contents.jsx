// @flow
import Button from 'component/button';
import React from 'react';
import ChannelThumbnail from 'component/channelThumbnail';
import UriIndicator from 'component/uriIndicator';
import CreditAmount from 'component/common/credit-amount';

const TAB_LBC = 'TabLBC';
// const TAB_USDC = 'TabUSDC';
const TAB_FIAT = 'TabFiat';

type Props = {
  activeChannelUrl: string,
  tipAmount: number,
  activeTab: string,
  message: string,
  isReviewingStickerComment?: boolean,
  stickerPreviewComponent?: any,
};

export const TipReviewBox = (props: Props) => {
  const { activeChannelUrl, tipAmount, activeTab, message, isReviewingStickerComment, stickerPreviewComponent } = props;

  return (
    <div className="comment-create__support-comment-preview">
      <CreditAmount
        amount={tipAmount}
        className="comment-create__support-comment-preview__amount"
        isFiat={activeTab === TAB_FIAT}
        size={activeTab === TAB_LBC ? 18 : 2}
      />

      {isReviewingStickerComment ? (
        stickerPreviewComponent
      ) : (
        <>
          <ChannelThumbnail xsmall uri={activeChannelUrl} />

          <div>
            <UriIndicator uri={activeChannelUrl} link showAtSign />
            <div>{message}</div>
          </div>
        </>
      )}
    </div>
  );
};

type TipButtonProps = {
  name: string,
  tab: string,
  activeTab: string,
  tipSelectorOpen: boolean,
  onClick: (tab: string) => void,
};

export const TipActionButton = (tipButtonProps: TipButtonProps) => {
  const { name, tab, activeTab, tipSelectorOpen, onClick, ...buttonProps } = tipButtonProps;

  return (
    (!tipSelectorOpen || activeTab !== tab) && (
      <Button {...buttonProps} title={name} label={tipSelectorOpen ? name : undefined} onClick={() => onClick(tab)} />
    )
  );
};
