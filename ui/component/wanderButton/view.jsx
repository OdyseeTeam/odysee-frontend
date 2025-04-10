// @flow
import React from 'react';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import './style.scss';

type Props = {
  
};

export default function WanderButton(props: Props) {
  
  const handleButtonClick = () => {
    if(window.wanderApp){
      if(window.wanderApp.openReason === 'manually'){
        window.wanderApp.close();
      }
      else{
        window.wanderApp.open();
      }
    }
    
  }

  return (
    <div onClick={handleButtonClick} className="wanderButton">
      <Icon icon={ICONS.WANDER} />
    </div>
  )
}
