// @flow
import React from 'react';
import classnames from 'classnames';

import * as RENDER_MODES from 'constants/file_render_modes';

import { useIsMobile } from 'effects/use-screensize';
import useGetPoster from 'effects/use-get-poster';

type Props = {
  children: any,
  onClick?: () => void,
  // -- redux --
  claimThumbnail?: string,
  obscurePreview: boolean,
  renderMode: string,
  videoTheaterMode: boolean,
};

const ClaimCoverRender = (props: Props) => {
  const {
    children,
    onClick,
    // -- redux --
    claimThumbnail,
    obscurePreview,
    renderMode,
    videoTheaterMode,
  } = props;

  const isMobile = useIsMobile();
  const theaterMode = RENDER_MODES.FLOATING_MODES.includes(renderMode) && videoTheaterMode;
  const thumbnail = useGetPoster(claimThumbnail);

  return (
    <div
      onClick={onClick}
      style={thumbnail && !obscurePreview ? { backgroundImage: `url("${thumbnail}")` } : {}}
      className={classnames('content__cover', {
        'content__cover--disabled': !onClick,
        'content__cover--theater-mode': theaterMode && !isMobile,
        'card__media--nsfw': obscurePreview,
      })}
    >
      {children}
    </div>
  );
};

export default ClaimCoverRender;
