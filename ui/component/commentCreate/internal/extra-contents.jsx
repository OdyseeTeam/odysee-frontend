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
  const { deletedComment, minUSDAmount, minUSDSuper, minUSDTip } = helpTextProps;

  return (
    <>
      {deletedComment && <div className="error__text">{__('This comment has been deleted.')}</div>}

      {!!minUSDAmount && (
        <div className="help--notice comment-create__min-amount-notice">
          <span>{!!minUSDTip ? __('Comment minimums: ') : __('HyperChat minimums: ')}</span>
          {(!!minUSDTip || !!minUSDSuper) && (
            <>
              <I18nMessage
                tokens={{
                  usd: <CreditAmount noFormat isFiat amount={minUSDAmount} />,
                }}
              >
                {`%usd%`}
              </I18nMessage>
            </>
          )}
          {/* TODO fix above spacing around ' or ' disappearing due to spans etc */}

          <Icon
            customTooltipText={
              minUSDTip
                ? __('This channel requires a minimum tip for each comment.')
                : minUSDSuper
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
