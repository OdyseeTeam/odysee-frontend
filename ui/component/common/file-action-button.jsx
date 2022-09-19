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
  disabled?: boolean,
  // -- redux --
  emailVerified?: boolean,
  hasChannels?: boolean,
};

function FileActionButton(props: Props) {
  const { title, iconSize, noStyle, className, emailVerified, hasChannels, ...buttonProps } = props;
  const { navigate, requiresAuth, requiresChannel, disabled } = buttonProps;

  if (navigate || requiresAuth || requiresChannel) {
    return (
      <Wrapper title={title} disabled={disabled}>
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
      </Wrapper>
    );
  }

  return (
    <Wrapper title={title} disabled={disabled}>
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
    </Wrapper>
  );
}

const Wrapper = ({ title, disabled, children }: { title: string, disabled?: boolean, children: any }) =>
  disabled ? (
    children
  ) : (
    <Tooltip title={title} arrow={false} enterDelay={100}>
      {children}
    </Tooltip>
  );

export default FileActionButton;
