// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Counter from 'component/counter';
import classnames from 'classnames';

type Props = {
  withText?: boolean,
  isTitle?: boolean,
  size?: number,
  amount?: string | number,
  token?: string,
  chain?: string,
  precision?: number,
};

const Symbol = (props: Props) => {
  const { token, chain, amount = null, precision = 8, size, isTitle = false } = props;
  const displayAmount = Number(amount).toFixed(precision);
  const displayLabel = token !== 'wallet' && token !== null ? ` ${token?.toUpperCase()}` : token === 'wallet' ? ' USD' : null;

  return (
    <>
      <div
        className={classnames('icon__symbol-wrapper', {
          'icon__symbol-wrapper--chain': chain,
        })}
      >
        <Icon
          icon={token ? ICONS[token.toUpperCase()] : ICONS.LBC}
          size={isTitle ? 22 : size}
          className={classnames('icon__symbol', {
            // 'icon__symbol--after-text': amount,
            'icon__symbol--title': isTitle,
          })}
        />
        {chain && <Icon icon={ICONS[chain.toUpperCase()]} />}
      </div>
      <span>        
        {amount !== null && <Counter value={displayAmount} precision={precision} />}        
        {displayLabel}
      </span>
    </>
  );
};

export default Symbol;
