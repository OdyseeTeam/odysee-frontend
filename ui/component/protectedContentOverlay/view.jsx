// @flow
import * as ICONS from 'constants/icons';
import * as React from 'react';
import classnames from 'classnames';
import Icon from 'component/common/icon';
import Button from 'component/button';

type Props = {
  small: boolean,
};

export default function ProtectedContentOverlay(props: Props) {
  const {
    small = false,
  } = props;

  return (
    <>
      <div className="protected-content-overlay">
        <div style={{ textAlign: 'center', marginTop: '19px' }}>
          {/*<Icon icon={ICONS.LOCK} className="protected-content-lock" />*/}
          <Icon icon={ICONS.LOCK} className="protected-content-lock" />
        </div>
        <h1>Only channel members can view this content</h1>
        <Button
          className="protected-content-overlay__button"
          button="primary"
          icon={ICONS.UPGRADE}
          label={__('See Membership Options')}
          title={__('Become A Member')}
          // onClick={() => doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri })}
          // style={{ filter: !creatorHasMemberships ? 'brightness(50%)' : undefined }}
        />
      </div>

      {/*<div style={{ top: '8%' }} className="protected-content-overlay__button">*/}
      {/*  <Button*/}
      {/*    button="primary"*/}
      {/*    icon={ICONS.UPGRADE}*/}
      {/*    label={__('See Membership Options')}*/}
      {/*    title={__('Become A Member')}*/}
      {/*    // onClick={() => doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri })}*/}
      {/*    // style={{ filter: !creatorHasMemberships ? 'brightness(50%)' : undefined }}*/}
      {/*  />*/}
      {/*</div>*/}
    </>
  );
}
