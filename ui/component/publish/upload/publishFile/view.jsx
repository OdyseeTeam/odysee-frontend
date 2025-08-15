// @flow
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

type Props = {
  uri: ?string,
  mode: ?string,
  disabled: boolean,
  // --- redux ---
  name: ?string,
  title: ?string,
  filePath: string | WebFile,
  fileBitrate: number,
  fileSizeTooBig: boolean,
  isStillEditing: boolean,
  balance: number,
  duration: number,
  isVid: boolean,
  fileSource: string,
  myClaimForUri: ?StreamClaim,
  activeChannelClaim: ?ChannelClaim,
  doUpdateTitle: (string) => void,
  doUpdateFile: (file: WebFile, clearName: boolean) => void,
};

function PublishFile(props: Props) {
  const {
    uri,
    name,
    title,
    balance,
    filePath,
    fileBitrate,
    fileSizeTooBig,
    isStillEditing,
    doUpdateTitle,
    doUpdateFile,
    disabled,
    duration,
    isVid,
    fileSource,
    myClaimForUri,
    activeChannelClaim,
  } = props;

  const TV_PUBLISH_SIZE_LIMIT_GB_STR = String(WEB_PUBLISH_SIZE_LIMIT_GB);
  const UPLOAD_SIZE_MESSAGE = __('%SITE_NAME% uploads are limited to %limit% GB.', {
    SITE_NAME,
    limit: TV_PUBLISH_SIZE_LIMIT_GB_STR,
  });

  const [livestreamData, setLivestreamData] = React.useState([]);
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
    try {
      await Lbry.channel_sign({
        channel_id: channelId,
        hexdata: toHex(channelName || ''),
      }).then((data) => {
        signedMessage = data;
      });
    } catch (e) {
      throw e;
    }
    if (signedMessage) {
      const encodedChannelName = encodeURIComponent(channelName || '');
      const newEndpointUrl =
        `${NEW_LIVESTREAM_REPLAY_API}?channel_claim_id=${String(channelId)}` +
        `&signature=${signedMessage.signature}&signature_ts=${signedMessage.signing_ts}&channel_name=${
          encodedChannelName || ''
        }`;

      const responseFromNewApi = await fetch(newEndpointUrl);

      const data: Array<ReplayListResponse> = (await responseFromNewApi.json()).data;
      const newData: Array<LivestreamReplayItem> = [];

      if (data && data.length > 0) {
        for (const dataItem of data) {
          if (dataItem.Status.toLowerCase() === 'inprogress' || dataItem.Status.toLowerCase() === 'ready') {
            const objectToPush = {
              data: {
                fileLocation: dataItem.URL,
                fileDuration:
                  dataItem.Status.toLowerCase() === 'inprogress'
                    ? __('Processing...(') + dataItem.PercentComplete + '%)'
                    : (dataItem.Duration / 1000000000).toString(),
                percentComplete: dataItem.PercentComplete,
                thumbnails: dataItem.ThumbnailURLs !== null ? dataItem.ThumbnailURLs : [],
                uploadedAt: dataItem.Created,
              },
            };
            newData.push(objectToPush);
          }
        }
      }

      setLivestreamData(newData);
      // setCheckingLivestreams(false);
    }
  }

  useEffect(() => {
    if (activeChannelClaim && activeChannelClaim.claim_id && activeChannelName) {
      fetchLivestreams(activeChannelClaim.claim_id, activeChannelName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [claimChannelId, activeChannelName]);

  useEffect(() => {
    if (activeChannelClaim && activeChannelClaim.claim_id && activeChannelName) {
      fetchLivestreams(activeChannelClaim.claim_id, activeChannelName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // @if TARGET='web'
    if (fileSizeTooBig) {
      return (
        <p className="help--error">
          {UPLOAD_SIZE_MESSAGE}{' '}
          <Button button="link" label={__('Upload Guide')} href="https://help.odysee.tv/category-uploading/" />
        </p>
      );
    }
    // @endif

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

    if (isVid && !duration) {
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
          {__("If you don't choose a file, the file from your existing claim %name% will be used", { name: name })}
        </p>
      );
    }
    // @if TARGET='web'
    if (!isStillEditing) {
      return (
        <p className="help" style={{ marginBottom: 0 }}>
          <Icon icon={ICONS.INFO} />
          {__(
            'For video content, use MP4s in H264/AAC format and a friendly bitrate (under 8 Mbps) for more reliable streaming. %SITE_NAME% uploads are restricted to %limit% GB.',
            { SITE_NAME, limit: TV_PUBLISH_SIZE_LIMIT_GB_STR }
          )}{' '}
          <Button button="link" label={__('Upload Guide')} href="https://help.odysee.tv/category-uploading/" />
        </p>
      );
    }
    // @endif
  }

  function handleTitleChange(event) {
    doUpdateTitle(event.target.value);
  }

  function handleFileChange(file: WebFile, clearName = true) {
    if (titleInput.current && titleInput.current.input) {
      titleInput.current.input.current.focus();
    }

    doUpdateFile(file, clearName);
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
              {getUploadMessage()}
              {hasLivestreamData && linkReplays()}

              {fileSource === SOURCE_SELECT && (
                <div className="main--empty empty">
                  <Spinner small />
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
                max="200"
                ref={titleInput}
              />
            </div>
            <PublishName uri={uri} />
          </React.Fragment>
        </>
      }
    />
  );
}

export default PublishFile;
