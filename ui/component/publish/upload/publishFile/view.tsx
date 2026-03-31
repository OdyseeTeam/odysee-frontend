import { SITE_NAME, WEB_PUBLISH_SIZE_LIMIT_GB, SIMPLE_SITE } from 'config';
import * as ICONS from 'constants/icons';
import { BITRATE } from 'constants/publish';
import React, { useEffect } from 'react';
import Lbry from 'lbry';
import { toHex } from 'util/hex';
import FileSelector from 'component/common/file-selector';
import Button from 'component/button';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';
import I18nMessage from 'component/i18nMessage';
import Spinner from 'component/spinner';
import PublishName from 'component/publish/shared/publishName';
import classnames from 'classnames';
import * as PAGES from 'constants/pages';
import { SOURCE_SELECT } from 'constants/publish_sources';
import { NEW_LIVESTREAM_REPLAY_API } from 'constants/livestream';
import Icon from 'component/common/icon';
import VideoOptimizer from 'component/videoOptimizer/view';
import VideoFormatNotice from 'component/videoFormatNotice/view';
import './style.scss';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectBalance } from 'redux/selectors/wallet';
import {
  selectIsStillEditing,
  selectPublishFormValue,
  selectMyClaimForUri,
  selectPrevFileSizeTooBig,
} from 'redux/selectors/publish';
import { doUpdateFile, doUpdatePublishForm, doUpdateTitle } from 'redux/actions/publish';
import { selectActiveChannelClaim } from 'redux/selectors/app';
type Props = {
  uri: string | null | undefined;
  mode: string | null | undefined;
  disabled: boolean;
  fileSource: string;
  inEditMode?: boolean;
  changeFileSource?: (state: any) => void;
  fileMimeType?: string;
  inProgress?: any;
  setPrevFileText?: (text: string) => void;
  setWaitForFile?: (wait: boolean) => void;
};

function PublishFile(props: Props) {
  const { uri, disabled, fileSource } = props;
  const dispatch = useAppDispatch();
  const name = useAppSelector((state) => selectPublishFormValue(state, 'name'));
  const title = useAppSelector((state) => selectPublishFormValue(state, 'title'));
  const filePath = useAppSelector((state) => selectPublishFormValue(state, 'filePath'));
  const fileBitrate = useAppSelector((state) => state.publish.fileBitrate);
  const fileSizeTooBig = useAppSelector((state) => state.publish.fileSizeTooBig);
  const fileNeedsTransmux = useAppSelector((state) => state.publish.fileNeedsTransmux);
  const fileFormat = useAppSelector((state) => state.publish.fileFormat);
  const fileVideoCodec = useAppSelector((state) => state.publish.fileVideoCodec);
  const fileAudioCodec = useAppSelector((state) => state.publish.fileAudioCodec);
  const fileWidth = useAppSelector((state) => state.publish.fileWidth);
  const fileHeight = useAppSelector((state) => state.publish.fileHeight);
  const fileFps = useAppSelector((state) => state.publish.fileFps);
  const isStillEditing = useAppSelector(selectIsStillEditing);
  const balance = useAppSelector(selectBalance);
  const duration = useAppSelector((state) => selectPublishFormValue(state, 'fileDur'));
  const isVid = useAppSelector((state) => selectPublishFormValue(state, 'fileVid'));
  const myClaimForUri = useAppSelector((state) => selectMyClaimForUri(state, true));
  const prevFileSizeTooBig = useAppSelector(selectPrevFileSizeTooBig);
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  const TV_PUBLISH_SIZE_LIMIT_GB_STR = String(WEB_PUBLISH_SIZE_LIMIT_GB);

  const UPLOAD_SIZE_MESSAGE = __('%SITE_NAME% uploads are limited to %limit% GB.', {
    SITE_NAME,
    limit: TV_PUBLISH_SIZE_LIMIT_GB_STR,
  });

  const [urlChangedManually, setUrlChangedManually] = React.useState(false);
  const [optimizerDismissed, setOptimizerDismissed] = React.useState(false);
  const showOptimizer = isVid && fileBitrate > BITRATE.RECOMMENDED && filePath instanceof File && !optimizerDismissed;
  const [livestreamData, setLivestreamData] = React.useState<LivestreamReplayItem[]>([]);
  const hasLivestreamData = livestreamData && Boolean(livestreamData.length);
  const currentPath = typeof filePath === 'string' ? filePath : filePath?.name;
  const claimChannelId =
    (myClaimForUri && myClaimForUri.signing_channel && myClaimForUri.signing_channel.claim_id) ||
    (activeChannelClaim && activeChannelClaim.claim_id);
  const activeChannelName = activeChannelClaim && activeChannelClaim.name;

  /*
  const normalizeUrlForProtocol = (url) => {
    if (url.startsWith('https://')) {
      return url;
    } else {
      if (url.startsWith('http://')) {
        return url;
      } else if (url) {
        return `https://${url}`;
      }
    }
  };
  */
  // move this to lbryinc OR to a file under ui, and/or provide a standardized livestreaming config.
  async function fetchLivestreams(channelId, channelName) {
    // setCheckingLivestreams(true);
    let signedMessage;

    await Lbry.channel_sign({
      channel_id: channelId,
      hexdata: toHex(channelName || ''),
    }).then((data) => {
      signedMessage = data;
    });

    if (signedMessage) {
      const encodedChannelName = encodeURIComponent(channelName || '');
      const newEndpointUrl =
        `${NEW_LIVESTREAM_REPLAY_API}?channel_claim_id=${String(channelId)}` +
        `&signature=${signedMessage.signature}&signature_ts=${
          signedMessage.signing_ts
        }&channel_name=${encodedChannelName || ''}`;
      const responseFromNewApi = await fetch(newEndpointUrl);
      const data: Array<{
        Status: string;
        URL: string;
        Duration: number;
        PercentComplete: number;
        ThumbnailURLs: string[] | null;
        Created: string;
      }> = (await responseFromNewApi.json()).data;
      const newData: Array<LivestreamReplayItem> = [];

      if (data && data.length > 0) {
        for (const dataItem of data) {
          const statusNorm = typeof dataItem.Status === 'string' ? dataItem.Status.toLowerCase() : '';
          if (statusNorm === 'inprogress' || statusNorm === 'ready') {
            const objectToPush = {
              data: {
                fileLocation: dataItem.URL,
                fileDuration:
                  statusNorm === 'inprogress'
                    ? __('Processing...(') + (dataItem.PercentComplete ?? '') + '%)'
                    : String((dataItem.Duration ?? 0) / 1000000000),
                percentComplete: dataItem.PercentComplete,
                thumbnails: dataItem.ThumbnailURLs !== null ? dataItem.ThumbnailURLs : [],
                uploadedAt: dataItem.Created,
              },
            };
            newData.push(objectToPush as unknown as LivestreamReplayItem);
          }
        }
      }

      setLivestreamData(newData); // setCheckingLivestreams(false);
    }
  }

  useEffect(() => {
    if (activeChannelClaim && activeChannelClaim.claim_id && activeChannelName) {
      fetchLivestreams(activeChannelClaim.claim_id, activeChannelName);
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [claimChannelId, activeChannelName]);

  function linkReplays() {
    return (
      <p className="help">
        <Icon icon={ICONS.HELP} />
        <I18nMessage
          tokens={{
            livestream_replay_instead: (
              <Button
                button="link"
                label={__('Livestream Replay instead')}
                navigate={`/$/${PAGES.LIVESTREAM}?s=Replay`}
              />
            ),
          }}
        >
          Would you like to publish a %livestream_replay_instead%?
        </I18nMessage>
      </p>
    );
  }

  function getUploadMessage() {
    if (fileSizeTooBig && !(isStillEditing && prevFileSizeTooBig)) {
      return (
        <p className="help--warning">
          {UPLOAD_SIZE_MESSAGE}{' '}
          <Button button="link" label={__('Upload Guide')} href="https://help.odysee.tv/category-uploading/" />
        </p>
      );
    }

    if (fileBitrate > BITRATE.RECOMMENDED) {
      return (
        <p className="help--warning">
          <Icon icon={ICONS.INFO} />
          {fileBitrate > BITRATE.MAX
            ? __(
                'Your video has a bitrate over ~16 Mbps and cannot be processed at this time. We suggest transcoding to provide viewers the best experience.'
              )
            : __(
                'Your video has a bitrate over 8 Mbps. We suggest transcoding to provide viewers the best experience.'
              )}{' '}
          <Button button="link" label={__('Upload Guide')} href="https://help.odysee.tv/category-uploading/" />
        </p>
      );
    }

    // Only show "couldn't detect" after metadata extraction has had a chance to run
    // (fileVideoCodec is empty string initially, populated by MediaBunny async)
    if (isVid && !duration && fileVideoCodec !== '') {
      return (
        <p className="help--warning">
          <Icon icon={ICONS.INFO} />
          {__(
            "Couldn't detect the video encoding. This video will not be playable in most browsers. We recommend to use H264/AAC encoding with MP4 container."
          )}{' '}
          <Button button="link" label={__('Upload Guide')} href="https://help.odysee.tv/category-uploading/" />
        </p>
      );
    }

    if (!!isStillEditing && name) {
      return (
        <p className="help">
          <Icon icon={ICONS.INFO} />
          {__("If you don't choose a file, the file from your existing claim %name% will be used", {
            name: name,
          })}
        </p>
      );
    }

    if (!isStillEditing) {
      return (
        <p
          className="help"
          style={{
            marginBottom: 0,
            fontSize: 'var(--font-xsmall)',
            color: 'var(--color-text-subtitle)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
          }}
        >
          <Icon icon={ICONS.INFO} size={12} />
          <span>
            {__(
              'For video content, use MP4s in H264/AAC format and a friendly bitrate (under 8 Mbps) for more reliable streaming. %SITE_NAME% uploads are restricted to %limit% GB.',
              { SITE_NAME, limit: TV_PUBLISH_SIZE_LIMIT_GB_STR }
            )}{' '}
            <Button button="link" label={__('Upload Guide')} href="https://help.odysee.tv/category-uploading/" />
          </span>
        </p>
      );
    }
  }

  function handleTitleChange(event) {
    dispatch(doUpdateTitle(event.target.value, urlChangedManually));
  }

  function handleFileChange(file: WebFile, clearName = true) {
    const inputRef = titleInput.current as any;
    if (inputRef && inputRef.input) {
      inputRef.input.current.focus();
    }
    setOptimizerDismissed(false);
    dispatch(doUpdateFile(file, clearName));
  }

  function handleOptimizedFile(optimizedFile: File) {
    dispatch(doUpdateFile(optimizedFile, false));
    setOptimizerDismissed(true); // Don't re-show optimizer for the optimized file
  }

  const titleInput = React.createRef();
  return (
    <Card
      className={classnames({
        'card--disabled': disabled || balance === 0,
      })}
      actions={
        <>
          <React.Fragment>
            <>
              <FileSelector
                disabled={disabled}
                currentPath={currentPath}
                onFileChosen={handleFileChange}
                placeholder={
                  SIMPLE_SITE ? __('Select video, audio or image file to upload') : __('Select a file to upload')
                }
                autoFocus
              />
              {/* Inline codec/format info strip */}
              {isVid && filePath && (fileVideoCodec || fileAudioCodec || fileHeight > 0) && (
                <div className="publish-file-info">
                  {fileFormat && <span className="publish-file-info__pill">{fileFormat.toUpperCase()}</span>}
                  {fileVideoCodec && (
                    <span className="publish-file-info__pill">
                      {fileVideoCodec.toUpperCase().replace('AVC', 'H.264').replace('HEVC', 'H.265')}
                    </span>
                  )}
                  {fileAudioCodec && <span className="publish-file-info__pill">{fileAudioCodec.toUpperCase()}</span>}
                  {(fileVideoCodec || fileAudioCodec) && (fileHeight > 0 || fileFps > 0) && (
                    <span className="publish-file-info__dot" />
                  )}
                  {fileHeight > 0 && (
                    <span className="publish-file-info__pill">
                      {fileWidth}&times;{fileHeight}
                    </span>
                  )}
                  {fileFps > 0 && <span className="publish-file-info__pill">{Math.round(fileFps)} fps</span>}
                  {(fileHeight > 0 || fileFps > 0) && (fileBitrate > 0 || duration > 0) && (
                    <span className="publish-file-info__dot" />
                  )}
                  {fileBitrate > 0 && (
                    <span
                      className={classnames('publish-file-info__pill', {
                        'publish-file-info__pill--warn': fileBitrate > BITRATE.RECOMMENDED,
                        'publish-file-info__pill--good': fileBitrate > 0 && fileBitrate <= BITRATE.RECOMMENDED,
                      })}
                    >
                      {fileBitrate >= 1e6
                        ? `${(fileBitrate / 1e6).toFixed(1)} Mbps`
                        : `${Math.round(fileBitrate / 1e3)} kbps`}
                    </span>
                  )}
                  {duration > 0 && (
                    <span className="publish-file-info__pill">
                      {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
                    </span>
                  )}
                </div>
              )}
              {getUploadMessage()}
              {showOptimizer && (
                <VideoOptimizer
                  file={filePath}
                  fileBitrate={fileBitrate}
                  variant={fileSizeTooBig ? 'mandatory' : 'recommended'}
                  onOptimized={handleOptimizedFile}
                  onSkip={() => setOptimizerDismissed(true)}
                />
              )}
              {fileNeedsTransmux && filePath instanceof File && fileFormat && (
                <VideoFormatNotice
                  file={filePath}
                  format={fileFormat}
                  videoCodec={fileVideoCodec || ''}
                  audioCodec={fileAudioCodec || ''}
                  variant="recommended"
                />
              )}
              {hasLivestreamData && linkReplays()}

              {fileSource === SOURCE_SELECT && (
                <div className="main--empty empty">
                  <Spinner type="small" />
                </div>
              )}
            </>
            <div className="form-spacer">
              <FormField
                type="text"
                name="content_title"
                label={__('Title')}
                placeholder={__('Descriptive titles work best')}
                disabled={disabled}
                value={title}
                onChange={handleTitleChange}
                className="fieldset-group"
                max={200}
                ref={titleInput}
              />
            </div>
            <PublishName uri={uri} onChange={() => setUrlChangedManually(true)} />
          </React.Fragment>
        </>
      }
    />
  );
}

export default PublishFile;
