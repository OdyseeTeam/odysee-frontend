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
  minUSDAmount: number,
  minUSDSuper: number,
  minUSDTip: number,
};

export const HelpText = (helpTextProps: HelpTextProps) => {
  const { deletedComment, minAmount, minTip, minSuper, minUSDAmount, minUSDSuper, minUSDTip } = helpTextProps;

  return (
    <>
      {deletedComment && <div className="error__text">{__('This comment has been deleted.')}</div>}

      {(!!minAmount || !!minUSDAmount) && (        
        <div className="help--notice comment-create__min-amount-notice">
          <span>{(!!minTip || !!minUSDTip) ? __('Comment minimum: ') : __('HyperChat minimum: ')}</span>
          {(!!minTip || !!minSuper || !!minUSDTip || !!minUSDSuper) && (
            <>
              <I18nMessage
                tokens={{
                  usd: <CreditAmount noFormat isFiat amount={minUSDAmount ? minUSDAmount : '0.01'} />,
                }}
              >
                {`%usd%`}
              </I18nMessage>
            </>
          )}

          <Icon
            customTooltipText={
              minTip || minUSDTip
                ? __('This channel requires a minimum tip for each comment.')
                : minSuper || minUSDSuper
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
