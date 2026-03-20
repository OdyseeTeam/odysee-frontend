import React from 'react';
import MUITooltip from '@mui/material/Tooltip';
type Props = {
  arrow?: boolean;
  children: React.ReactNode;
  disableInteractive?: boolean;
  enterDelay?: number;
  title?: string | React.ReactNode;
  className?: string;
  followCursor?: boolean;
  placement?: string;
  // https://mui.com/api/tooltip/
  state?: {
    open: boolean;
    onClose: any;
  };
};

function Tooltip(props: Props) {
  const {
    arrow = true,
    children,
    disableInteractive = true,
    enterDelay = 300,
    title,
    className,
    followCursor = false,
    placement = 'bottom',
    state,
  } = props;
  return (
    <MUITooltip
      arrow={arrow}
      disableInteractive={disableInteractive}
      enterDelay={enterDelay}
      enterNextDelay={enterDelay}
      title={title}
      followCursor={followCursor}
      placement={placement}
      classes={{
        tooltip: className,
      }}
      {...(state || {})}
    >
      {children}
    </MUITooltip>
  );
}

export default Tooltip;
