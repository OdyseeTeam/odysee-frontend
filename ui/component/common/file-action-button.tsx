import React from 'react';
import Button from 'component/button';
import classnames from 'classnames';
type Props = {
  title?: string;
  iconSize?: number;
  noStyle?: boolean;
  navigate?: string;
  requiresAuth?: boolean;
  requiresChannel?: boolean;
  className?: string;
  label?: React.ReactNode;
  icon?: string;
  onClick?: (arg0: any) => any;
  disabled?: boolean;
  description?: string;
  authSrc?: string;
  [key: string]: any;
};

function FileActionButton(props: Props) {
  const { title, iconSize, noStyle, className, ...buttonProps } = props;
  return (
    <Button
      button={noStyle ? 'alt' : undefined}
      title={title}
      className={
        noStyle
          ? className || undefined
          : classnames('button--file-action', {
              [className || '']: Boolean(className),
            })
      }
      iconSize={iconSize || 16}
      {...buttonProps}
    />
  );
}

export default FileActionButton;
