// @flow
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import React, { useState } from 'react';
import Button from 'component/button';
import { webDownloadClaim } from 'util/downloadClaim';

type Props = {
  uri: string,
  claim: StreamClaim,
  claimIsMine: boolean,
  focusable: boolean,
  fileInfo: ?FileListItem,
  openModal: (id: string, { path: string }) => void,
  pause: () => void,
  download: (string) => void,
  costInfo: ?{ cost: string },
  buttonType: ?string,
  showLabel: ?boolean,
  hideOpenButton: boolean,
  streamingUrl: ?string,
};

function FileDownloadLink(props: Props) {
  const {
    fileInfo,
    openModal,
    pause,
    claimIsMine,
    download,
    uri,
    claim,
    buttonType,
    focusable = true,
    showLabel = false,
    hideOpenButton = false,
    streamingUrl,
  } = props;

  const [didClickDownloadButton, setDidClickDownloadButton] = useState(false);
  const fileName = claim && claim.value && claim.value.source && claim.value.source.name;

  React.useEffect(() => {
    if (didClickDownloadButton && streamingUrl) {
      webDownloadClaim(streamingUrl, fileName);
      setDidClickDownloadButton(false);
    }
  }, [streamingUrl, didClickDownloadButton, fileName]);

  function handleDownload(e) {
    setDidClickDownloadButton(true);
    e.preventDefault();
    download(uri);
  }

  if (!claim) {
    return null;
  }

  if (fileInfo && fileInfo.download_path && fileInfo.completed) {
    const openLabel = __('Open file');
    return hideOpenButton ? null : (
      <Button
        button={buttonType}
        className={buttonType ? undefined : 'button--file-action'}
        title={openLabel}
        label={showLabel ? openLabel : null}
        icon={ICONS.EXTERNAL}
        onClick={() => {
          pause();
          openModal(MODALS.CONFIRM_EXTERNAL_RESOURCE, { path: fileInfo.download_path, isMine: claimIsMine });
        }}
        aria-hidden={!focusable}
        tabIndex={focusable ? 0 : -1}
      />
    );
  }

  const label = __('Download');

  return (
    <Button
      button={buttonType}
      className={buttonType ? undefined : 'button--file-action'}
      title={label}
      icon={ICONS.DOWNLOAD}
      label={showLabel ? label : null}
      onClick={handleDownload}
      aria-hidden={!focusable}
      tabIndex={focusable ? 0 : -1}
    />
  );
}

export default FileDownloadLink;
