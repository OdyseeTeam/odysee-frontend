// @flow
import React from 'react';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import './style.scss';

type Props = {
  
};

export default function WanderButton(props: Props) {
  
  return (
    <div onClick={() => window.test()} className="wanderButton">
      <Icon icon={ICONS.WANDER} />
    </div>
  )
}
