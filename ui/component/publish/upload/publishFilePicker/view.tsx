import { SITE_NAME, WEB_PUBLISH_SIZE_LIMIT_GB } from 'config';
import * as ICONS from 'constants/icons';
import { BITRATE } from 'constants/publish';
import React from 'react';
import Button from 'component/button';
import Icon from 'component/common/icon';
import classnames from 'classnames';
import VideoOptimizer from 'component/videoOptimizer/view';
import VideoFormatNotice from 'component/videoFormatNotice/view';
import PublishStatusCard from 'component/publish/shared/publishStatusCard';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectIsStillEditing, selectPublishFormValue, selectPrevFileSizeTooBig } from 'redux/selectors/publish';
import { doUpdateFile } from 'redux/actions/publish';
import './style.scss';
import '../publishFile/style.scss';

type Props = {
  disabled?: boolean;
};

export default function PublishFilePicker(props: Props) {
  const { disabled } = props;
  const dispatch = useAppDispatch();
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
  const duration = useAppSelector((state) => selectPublishFormValue(state, 'fileDur'));
  const isVid = useAppSelector((state) => selectPublishFormValue(state, 'fileVid'));
  const name = useAppSelector((state) => selectPublishFormValue(state, 'name'));
  const prevFileSizeTooBig = useAppSelector(selectPrevFileSizeTooBig);

  const TV_PUBLISH_SIZE_LIMIT_GB_STR = String(WEB_PUBLISH_SIZE_LIMIT_GB);
  const currentPath = typeof filePath === 'string' ? filePath : filePath?.name;
  const hasFile = !!filePath;
  const [optimizerDismissed, setOptimizerDismissed] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [fileSizeReduceMode, setFileSizeReduceMode] = React.useState<'' | 'resolution' | 'quality' | 'balanced'>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isMkv = fileFormat && fileFormat.toLowerCase() === 'mkv';
  const isBadCodec = isVid && !duration && fileVideoCodec !== '';
  const isBitrateTooHigh = fileBitrate > BITRATE.MAX;
  const isBitrateWarn = fileBitrate > BITRATE.RECOMMENDED && !isBitrateTooHigh;
  const isFileTooLarge = fileSizeTooBig && !(isStillEditing && prevFileSizeTooBig);
  const showOptimizer =
    isVid && (fileBitrate > BITRATE.RECOMMENDED || isFileTooLarge) && filePath instanceof File && !optimizerDismissed;

  const hasCriticalIssue = Boolean(isFileTooLarge || isBitrateTooHigh || isBadCodec);
  const hasIssues = hasCriticalIssue || isBitrateWarn || fileNeedsTransmux || isMkv;

  const formatOk = fileFormat && !isMkv;
  const codecOk = fileVideoCodec && !isBadCodec;
  const bitrateOk = fileBitrate > 0 && fileBitrate <= BITRATE.RECOMMENDED;

  function handleFileChange(file: File) {
    setOptimizerDismissed(false);
    dispatch(doUpdateFile(file as WebFile, true));
  }

  function handleOptimizedFile(optimizedFile: File) {
    dispatch(doUpdateFile(optimizedFile as WebFile, false));
    setOptimizerDismissed(true);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  return (
    <div className="publish-file-picker">
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleInputChange}
        accept="video/*,audio/*,image/*"
      />

      {!hasFile ? (
        <div
          className={classnames('publish-file-picker__dropzone', {
            'publish-file-picker__dropzone--dragging': isDragging,
            'publish-file-picker__dropzone--disabled': disabled,
          })}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Icon icon={ICONS.PUBLISH} size={48} />
          <p className="publish-file-picker__dropzone-title">{__('Drag and drop a file to upload')}</p>
          <p className="publish-file-picker__dropzone-subtitle">
            {__('Or click to browse. Videos, audio, and images accepted.')}
          </p>
          <Button
            button="primary"
            label={__('Select File')}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          />
          <p className="publish-file-picker__dropzone-limit">
            {__('Max file size: %limit% GB', { limit: TV_PUBLISH_SIZE_LIMIT_GB_STR })}
          </p>
        </div>
      ) : (
        <div className="publish-file-picker__selected">
          <h3 className="publish-file-picker__title">{__('Selected File')}</h3>
          <div className="publish-file-picker__selected-info">
            <div className="publish-file-picker__selected-details">
              <span className="publish-file-picker__selected-name">{currentPath}</span>
            </div>
            <Button
              button="primary"
              icon={ICONS.REFRESH}
              label={__('Change')}
              onClick={() => fileInputRef.current?.click()}
            />
          </div>

          {isBitrateTooHigh && !isFileTooLarge && (
            <PublishStatusCard
              variant="error"
              icon={<Icon icon={ICONS.ALERT} size={20} />}
              title={__('Bitrate Too High')}
              description={
                <>
                  {__('Your video has a bitrate over ~16 Mbps and cannot be processed at this time.')}{' '}
                  <Button button="link" label={__('Upload Guide')} href="https://help.odysee.tv/category-uploading/" />
                </>
              }
            />
          )}

          {isBadCodec && (
            <PublishStatusCard
              variant="error"
              icon={<Icon icon={ICONS.ALERT} size={20} />}
              title={__('Incompatible Encoding')}
              description={
                <>
                  {__("Couldn't detect the video encoding. This video will not be playable in most browsers.")}{' '}
                  <Button button="link" label={__('Upload Guide')} href="https://help.odysee.tv/category-uploading/" />
                </>
              }
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

          {showOptimizer && (
            <VideoOptimizer
              file={filePath}
              fileBitrate={fileBitrate}
              fileSizeTooBig={isFileTooLarge}
              variant={isFileTooLarge ? 'mandatory' : 'recommended'}
              onOptimized={handleOptimizedFile}
              onSkip={() => setOptimizerDismissed(true)}
            />
          )}

          {isVid && filePath && !hasIssues && (
            <PublishStatusCard
              variant="recommended"
              icon={<Icon icon={ICONS.COMPLETE} size={20} />}
              title={__('Ready to Upload')}
              description={__('Your file is compatible and ready to be published.')}
            />
          )}
        </div>
      )}
    </div>
  );
}
