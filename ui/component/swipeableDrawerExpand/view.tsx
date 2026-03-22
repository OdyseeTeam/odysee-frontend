import 'scss/component/_swipeable-drawer.scss';
// @ts-expect-error
import { Global } from '@emotion/react';
import classnames from 'classnames';
import * as ICONS from 'constants/icons';
import * as React from 'react';
import Button from 'component/button';
import { useAppDispatch } from 'redux/hooks';
import { doToggleAppDrawer as doToggleAppDrawerAction } from 'redux/actions/app';
type Props = {
  label: any;
  icon: string;
  type: string;
  fixed?: boolean;
};

function DrawerExpandButton(props: Props) {
  const { fixed, icon, type, ...buttonProps } = props;
  const dispatch = useAppDispatch();
  const doToggleAppDrawer = (drawerType: string) => dispatch(doToggleAppDrawerAction(drawerType));
  return (
    <Wrapper fixed={fixed}>
      <Global
        styles={{
          '.main-wrapper__inner--filepage': {
            paddingBottom: fixed ? 'var(--header-height-mobile) !important' : undefined,
          },
        }}
      />

      <Button
        className={classnames('swipeable-drawer__expand-button', {
          fixed,
        })}
        button="primary"
        icon={icon || (fixed ? ICONS.UP : undefined)}
        iconSize={fixed && icon ? 30 : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          doToggleAppDrawer(type);
        }}
        {...buttonProps}
      />
    </Wrapper>
  );
}

type WrapperProps = {
  fixed?: boolean;
  children: any;
};

const Wrapper = (props: WrapperProps) => {
  const { children } = props;
  return children;
};

export default DrawerExpandButton;
