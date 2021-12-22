// @flow
import 'scss/component/_comment-badge.scss';

import Icon from 'component/common/icon';
import React from 'react';
import Tooltip from 'component/common/tooltip';

type Props = {
  icon: string,
  label: string,
  size?: number,
  placement?: string,
};

export default function CommentBadge(props: Props) {
  const { icon, label, size = 20, placement = 'top' } = props;

  return (
    <Tooltip title={label} placement={placement}>
      <span className="comment__badge">
        <Icon icon={icon} size={size} />
      </span>
    </Tooltip>
  );
}
