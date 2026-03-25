import * as ICONS from 'constants/icons';
import React from 'react';
import classnames from 'classnames';
import { icons } from './icon-custom';
// It would be nice to standardize this somehow
// These are copied from `scss/vars`, can they both come from the same source?
const RED_COLOR = '#e2495e';
const GREEN_COLOR = '#44b098';
const BLUE_COLOR = '#49b2e2';
type Props = {
  icon: string;
  tooltip?: boolean;
  customTooltipText?: string;
  iconColor?: string;
  size?: number;
  className?: string;
  sectionIcon?: boolean;
  [key: string]: any;
};

function getTooltip(icon: string) {
  switch (icon) {
    case ICONS.REWARDS:
      return __('Featured content. Receive credits for watching.');
    case ICONS.DOWNLOAD:
      return __('This file is in your library.');
    case ICONS.SUBSCRIBE:
      return __('You are subscribed to this channel.');
    case ICONS.SETTINGS:
      return __('Your settings.');
    default:
      return null;
  }
}

function getIconColor(color: string) {
  switch (color) {
    case 'red':
      return RED_COLOR;
    case 'green':
      return GREEN_COLOR;
    case 'blue':
      return BLUE_COLOR;
    default:
      return color;
  }
}

function IconComponent({ icon, tooltip, customTooltipText, iconColor, size, className, sectionIcon = false, ...rest }: Props) {
  const Icon = icons[icon];

  if (!Icon) {
    return null;
  }

  const color = iconColor ? getIconColor(iconColor) : undefined;
  const tooltipText = tooltip ? customTooltipText || getTooltip(icon) : undefined;

  const component = (
    <Icon
      title={tooltipText}
      size={size || (sectionIcon ? 20 : 16)}
      className={classnames(`icon icon--${icon}`, className, {
        'color-override': iconColor,
      })}
      color={color}
      aria-hidden
      {...rest}
    />
  );
  return sectionIcon ? <span className={`icon__wrapper icon__wrapper--${icon}`}>{component}</span> : component;
}

export default IconComponent;
