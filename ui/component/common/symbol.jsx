// @flow
import type { Node } from 'react';
import * as ICONS from 'constants/icons';
import React from 'react';
import classnames from 'classnames';
import Icon from 'component/common/icon';

type Props = {
  withText?: boolean,
  isTitle?: boolean,
  size?: number,
  amount?: string | number | Node,
};

const Symbol = (props: Props) => {
  const { token, chain, amount, size, isTitle = false } = props;
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
        {amount}
        {amount && ` ${token.toUpperCase()}`}
      </span>
    </>
  );
};

export default Symbol;
