// @flow
import React from 'react';
import Button from 'component/button';
import Tooltip from 'component/common/tooltip';
import classnames from 'classnames';

type Props = {
  title: string,
  iconSize?: number,
  noStyle?: boolean,
  navigate?: string,
  requiresAuth?: boolean,
  requiresChannel?: boolean,
  className?: string,
};

function FileActionButton(props: Props) {
  const { title, iconSize, noStyle, className, ...buttonProps } = props;
  const { navigate, requiresAuth, requiresChannel } = buttonProps;

  if (navigate || requiresAuth || requiresChannel) {
    return (
      <Tooltip title={title} arrow={false} enterDelay={100}>
        <div className="button--file-action--tooltip-wrapper">
          <Button
            button={noStyle ? 'alt' : undefined}
            className={
              noStyle
                ? className || undefined
                : classnames('button--file-action', {
                    'button--file-action--tooltip': !className,
                    [className || '']: Boolean(className),
                  })
            }
            iconSize={iconSize || 16}
            {...buttonProps}
          />
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={title} arrow={false} enterDelay={100}>
      <Button
        button={noStyle ? 'alt' : undefined}
        className={
          noStyle
            ? className || undefined
            : classnames('button--file-action', { [className || '']: Boolean(className) })
        }
        iconSize={iconSize || 16}
        {...buttonProps}
      />
    </Tooltip>
  );
}

export default FileActionButton;
