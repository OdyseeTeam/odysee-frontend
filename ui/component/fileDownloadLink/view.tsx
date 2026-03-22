import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import React, { useState } from 'react';
import Button from 'component/button';
import { webDownloadClaim } from 'util/downloadClaim';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectClaimIsMine, selectClaimForUri, selectProtectedContentTagForUri } from 'redux/selectors/claims';
import { selectContentStates } from 'redux/selectors/content';
import {
  makeSelectFileInfoForUri,
  makeSelectDownloadingForUri,
  makeSelectLoadingForUri,
  selectStreamingUrlForUri,
} from 'redux/selectors/file_info';
import { doOpenModal } from 'redux/actions/app';
import { doClearPlayingUri, doDownloadUri } from 'redux/actions/content';
import { selectIsProtectedContentLockedFromUserForId } from 'redux/selectors/memberships';
type Props = {
  uri: string;
  focusable?: boolean;
  buttonType?: string | null | undefined;
  showLabel?: boolean | null | undefined;
  hideOpenButton?: boolean;
  hideDownloadStatus?: boolean;
};

function FileDownloadLink(props: Props) {
  const {
    uri,
    buttonType,
    focusable = true,
    showLabel = false,
    hideOpenButton = false,
    hideDownloadStatus = false,
  } = props;
  const dispatch = useAppDispatch();

  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const claimIsMine = useAppSelector((state) => selectClaimIsMine(state, claim));
  const downloading = useAppSelector((state) => makeSelectDownloadingForUri(uri)(state));
  const fileInfo = useAppSelector((state) => makeSelectFileInfoForUri(uri)(state));
  const loading = useAppSelector((state) => makeSelectLoadingForUri(uri)(state));
  const streamingUrl = useAppSelector((state) => selectStreamingUrlForUri(state, uri));
  const contentRestrictedFromUser = useAppSelector(
    (state) => claim && selectIsProtectedContentLockedFromUserForId(state, claim.claim_id)
  );
  const isProtectedContent = Boolean(useAppSelector((state) => selectProtectedContentTagForUri(state, uri)));
  const uriAccessKey = useAppSelector((state) => selectContentStates(state).uriAccessKeys[uri]);

  const download = (...args: Parameters<typeof doDownloadUri>) => dispatch(doDownloadUri(...args));
  const openModal = (...args: Parameters<typeof doOpenModal>) => dispatch(doOpenModal(...args));
  const pause = () => dispatch(doClearPlayingUri());
  const [didClickDownloadButton, setDidClickDownloadButton] = useState(false);
  const fileName = claim && claim.value && claim.value.source && claim.value.source.name;
  // @if TARGET='web'
  // initiate download when streamingUrl is available
  React.useEffect(() => {
    if (didClickDownloadButton && streamingUrl) {
      webDownloadClaim(streamingUrl, fileName, isProtectedContent, uriAccessKey);
      setDidClickDownloadButton(false);
    }
  }, [streamingUrl, didClickDownloadButton, fileName, isProtectedContent, uriAccessKey]);

  // @endif
  function handleDownload(e) {
    setDidClickDownloadButton(true);
    e.preventDefault();
    download(uri);
  }

  if (!claim) {
    return null;
  }

  // @if TARGET='app'
  if (downloading || loading) {
    if (hideDownloadStatus) {
      return null;
    }

    if (fileInfo && fileInfo.written_bytes > 0) {
      const progress = (fileInfo.written_bytes / fileInfo.total_bytes) * 100;
      return (
        <span className="download-text">
          {__('%percent%% downloaded', {
            percent: progress.toFixed(0),
          })}
        </span>
      );
    } else {
      return <span className="download-text">{__('Connecting...')}</span>;
    }
  }

  // @endif
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
          openModal(MODALS.CONFIRM_EXTERNAL_RESOURCE, {
            path: fileInfo.download_path,
            isMine: claimIsMine,
          });
        }}
        aria-hidden={!focusable}
        tabIndex={focusable ? 0 : -1}
      />
    );
  }

  const label = __('Download');

  return (
    <>
      {contentRestrictedFromUser && (
        <h2 className="protected-download-header">
          {__('This download is protected content, join a membership to gain access')}
        </h2>
      )}
      <Button
        button={buttonType}
        className={buttonType ? undefined : 'button--file-action'}
        title={label}
        icon={ICONS.DOWNLOAD}
        label={showLabel ? label : null}
        onClick={handleDownload}
        aria-hidden={!focusable}
        tabIndex={focusable ? 0 : -1}
        disabled={contentRestrictedFromUser}
      />
    </>
  );
}

export default FileDownloadLink;
