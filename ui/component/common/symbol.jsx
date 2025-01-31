// @flow
import * as ICONS from 'constants/icons';
import React from 'react';
import classnames from 'classnames';
import Icon from 'component/common/icon';

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
            'icon__symbol--after-text': amount,
            'icon__symbol--title': isTitle,
          })}
        />
        {chain && <Icon icon={ICONS[chain.toUpperCase()]} />}
      </div>
      <span>
        {amount != null && Number(amount).toFixed(precision)}
        {amount !== null && token && ` ${token.toUpperCase()}`}
      </span>
    </>
  );
};

export default Symbol;
