// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import CreditAmount from 'component/common/credit-amount';
import I18nMessage from 'component/i18nMessage';
import Icon from 'component/common/icon';
import SelectChannel from 'component/selectChannel';

type SelectorProps = {
  isReply: boolean,
  isLivestream: boolean,
};

export const FormChannelSelector = (selectorProps: SelectorProps) => {
  const { isReply, isLivestream } = selectorProps;

  return (
    <div className="comment-create__label-wrapper">
      <span className="comment-create__label">
        {(isReply ? __('Replying as') : isLivestream ? __('Chat as') : __('Comment as')) + ' '}
      </span>

      <SelectChannel tiny />
    </div>
  );
};

type HelpTextProps = {
  deletedComment: boolean,
  minAmount: number,
  minSuper: number,
  minTip: number,
  minUSDCAmount: number,
  minUSDCSuper: number,
  minUSDCTip: number,
};

export const HelpText = (helpTextProps: HelpTextProps) => {
  const { deletedComment, minAmount, minSuper, minTip, minUSDCAmount, minUSDCSuper, minUSDCTip } = helpTextProps;

  return (
    <>
      {deletedComment && <div className="error__text">{__('This comment has been deleted.')}</div>}

      {(!!minAmount || !!minUSDCAmount) && (
        <div className="help--notice comment-create__min-amount-notice">
          <I18nMessage
            tokens={{
              usdc: <CreditAmount noFormat isFiat amount={minUSDCAmount} />,
              minUSDCAmount,
              lbc: <CreditAmount noFormat amount={minAmount} />,
            }}
          >
            {(minTip || minUSDCTip ? 'Comment min: ' : minSuper || minUSDCSuper ? 'HyperChat min: ' : '') +
              (minTip || minSuper ? '%lbc%' : '') +
              (minAmount && minUSDCAmount ? ' or ' : '') +
              (minUSDCTip || minUSDCSuper ? '%usdc%' : '')}
          </I18nMessage>

          <Icon
            customTooltipText={
              minTip
                ? __('This channel requires a minimum tip for each comment.')
                : minSuper
                ? __('This channel requires a minimum amount for HyperChats to be visible.')
                : ''
            }
            className="icon--help"
            icon={ICONS.HELP}
            tooltip
            size={16}
          />
        </div>
      )}
    </>
  );
};
