// @flow

import React from 'react';
import { SITE_HELP_EMAIL } from 'config';
import Button from 'component/button';
import { killStream } from 'util/livestream';
import 'scss/component/claim-preview-reset.scss';
// import { iconClasses } from '@mui/material';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';

type Props = {
  channelId: string,
  channelName: string,
  claimIsMine: boolean,
  doToast: ({ message: string, isError?: boolean }) => void,
  activeLivestreamForChannel: ?LivestreamActiveClaim,
};

const ClaimPreviewReset = (props: Props) => {
  const { channelId, channelName, claimIsMine, doToast, activeLivestreamForChannel } = props;
  if (!claimIsMine || !activeLivestreamForChannel) return null;

  const handleClick = async () => {
    try {
      await killStream(channelId, channelName);
      doToast({ message: __('Live stream successfully reset.'), isError: false });
    } catch {
      doToast({ message: __('There was an error resetting the live stream.'), isError: true });
    }
  };

  return (
    <p className={'claimPreviewReset'}>
      <span className={'claimPreviewReset__hint'}>
        <Icon icon={ICONS.INFO} />
        {__(
          "If you're having trouble starting a stream or if your stream shows that you're live but aren't, try a reset. If the problem persists, please reach out at %SITE_HELP_EMAIL%.",
          { SITE_HELP_EMAIL }
        )}
      </span>
      <Button
        button="primary"
        label={__('Reset stream')}
        className={'claimPreviewReset__button'}
        onClick={handleClick}
      />
    </p>
  );
};

export default ClaimPreviewReset;
