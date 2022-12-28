// @flow
import React from 'react';
import classnames from 'classnames';

import * as RENDER_MODES from 'constants/file_render_modes';

import { useIsMobile } from 'effects/use-screensize';
import { EmbedContext } from 'contexts/embed';

import useGetPoster from 'effects/use-get-poster';
import Button from 'component/button';

type Props = {
  children: any,
  passedRef: any,
  href?: string,
  transparent?: boolean,
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
    passedRef,
    href,
    transparent,
    onClick,
    // -- redux --
    claimThumbnail,
    obscurePreview,
    renderMode,
    videoTheaterMode,
  } = props;  

  const isEmbed = React.useContext(EmbedContext);

  const isMobile = useIsMobile();
  const theaterMode = RENDER_MODES.FLOATING_MODES.includes(renderMode) && videoTheaterMode;
  const thumbnail = useGetPoster(claimThumbnail);

  const isNavigateLink = href;
  const Wrapper = isNavigateLink ? Button : 'div';

  return (
    <Wrapper
      ref={passedRef}
      href={href}
      onClick={onClick}
      style={thumbnail && !obscurePreview ? { backgroundImage: `url("${thumbnail}")` } : {}}
      className={classnames('content__cover', {
        'content__cover--embed': isEmbed,
        'content__cover--black-background': !transparent,
        'content__cover--disabled': !onClick && !href,
        'content__cover--theater-mode': theaterMode && !isMobile,
        'content__cover--link': isNavigateLink,
        'card__media--nsfw': obscurePreview,
      })}
    >
      {children}
    </Wrapper>
  );
};

export default ClaimCoverRender;
