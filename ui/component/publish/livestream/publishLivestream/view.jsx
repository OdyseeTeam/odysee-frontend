// @flow
import { SITE_NAME, WEB_PUBLISH_SIZE_LIMIT_GB, SIMPLE_SITE } from 'config';
import { BITRATE } from 'constants/publish';
import * as ICONS from 'constants/icons';
import React, { useState, useEffect } from 'react';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';
import Spinner from 'component/spinner';
import PublishName from '../../shared/publishName';
import CopyableText from 'component/copyableText';
import moment from 'moment';
import classnames from 'classnames';
import ReactPaginate from 'react-paginate';
import FileSelector from 'component/common/file-selector';
import Button from 'component/button';
import Icon from 'component/common/icon';

type Props = {
  uri: ?string,
  disabled: boolean,
  livestreamData: Array<LivestreamReplayItem>,
  isCheckingLivestreams: boolean,
  inEditMode: boolean,
  // --- redux ---
  title: ?string,
  filePath: string | WebFile,
  fileBitrate: number,
  fileSizeTooBig: boolean,
  isStillEditing: boolean,
  liveCreateType: LiveCreateType,
  liveEditType: LiveEditType,
  balance: number,
  publishing: boolean,
  duration: number,
  isVid: boolean,
  doUpdatePublishForm: (UpdatePublishState) => void,
  doUpdateFile: (file: WebFile, clearName: boolean) => void,
  doToast: ({ message: string, isError?: boolean }) => void,
};

function PublishLivestream(props: Props) {
  const {
    uri,
    title,
    balance,
    filePath,
    fileBitrate,
    fileSizeTooBig,
    liveCreateType,
    liveEditType,
    isStillEditing,
    doUpdatePublishForm: updatePublishForm,
    doUpdateFile,
    duration,
    isVid,
    disabled,
    livestreamData,
    isCheckingLivestreams,
    inEditMode,
  } = props;

  const livestreamDataStr = JSON.stringify(livestreamData);
  const hasLivestreamData = livestreamData && Boolean(livestreamData.length);

  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const PAGE_SIZE = 4;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages =
    hasLivestreamData && livestreamData.length > PAGE_SIZE ? Math.ceil(livestreamData.length / PAGE_SIZE) : 1;

  const replayTitleLabel = !inEditMode ? __('Select Replay') : __('Use Replay');

  const TV_PUBLISH_SIZE_LIMIT_GB_STR = String(WEB_PUBLISH_SIZE_LIMIT_GB);

  const UPLOAD_SIZE_MESSAGE = __('%SITE_NAME% uploads are limited to %limit% GB.', {
    SITE_NAME,
    limit: TV_PUBLISH_SIZE_LIMIT_GB_STR,
  });

  const showReplaySelector = liveCreateType === 'choose_replay' || liveCreateType === 'edit_placeholder';
  // assert(inEditMode ? liveCreateType === 'edit_placeholder' : true, liveCreateType);

  const normalizeUrlForProtocol = (url) => {
    if (url && url.startsWith('https://')) {
      return url;
    } else {
      if (url && url.startsWith('http://')) {
        return url;
      } else if (url) {
        return `https://${url}`;
      } else return __('Click Check for Replays to update...');
    }
  };

  // update remoteUrl when replay selected
  useEffect(() => {
    const livestreamData = JSON.parse(livestreamDataStr);
    if (selectedFileIndex !== null && livestreamData && livestreamData.length) {
      updatePublishForm({
        remoteFileUrl: normalizeUrlForProtocol(livestreamData[selectedFileIndex].data.fileLocation),
      });
    }
  }, [selectedFileIndex, updatePublishForm, livestreamDataStr]);

  function handlePaginateReplays(page) {
    setCurrentPage(page);
  }

  function handleTitleChange(event) {
    updatePublishForm({ title: event.target.value });
  }

  function handleFileChange(file: WebFile, clearName = true) {
    doUpdateFile(file, clearName);
  }

  function getUploadMessage() {
    // @if TARGET='web'
    if (fileSizeTooBig) {
      return (
        <p className="help--error">
          <Icon icon={ICONS.INFO} />
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

    // @if TARGET='web'
    if (!isStillEditing) {
      return (
        <p className="help">
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

  React.useEffect(() => {
    if (liveEditType !== 'use_replay') {
      setSelectedFileIndex(null);
    }
  }, [liveEditType, updatePublishForm]);

  return (
    <Card
      className={classnames({
        'card--disabled': disabled || balance === 0,
      })}
      actions={
        <div className="publish-row--no-margin">
          <React.Fragment>
            {/* Decide whether to show file upload or replay selector */}
            {/* @if TARGET='web' */}
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
              autoFocus
              autoComplete="off"
            />
            <PublishName uri={uri} />
            <>
              {inEditMode && (
                <fieldset-group>
                  <fieldset-section>
                    <label style={{ marginBottom: 'var(--spacing-s)' }}>
                      {inEditMode && (
                        <FormField
                          name="reuse-replay"
                          label={__('Update only')}
                          key="reuse-replay"
                          type="radio"
                          checked={liveEditType === 'update_only'}
                          onClick={() => updatePublishForm({ liveEditType: 'update_only' })}
                        />
                      )}
                    </label>
                  </fieldset-section>
                </fieldset-group>
              )}
              {showReplaySelector && hasLivestreamData && !isCheckingLivestreams && (
                <>
                  <label style={{ marginTop: 0 }}>
                    {inEditMode && (
                      <FormField
                        name="show-replays"
                        label={replayTitleLabel}
                        key="show-replays"
                        type="radio"
                        checked={liveEditType === 'use_replay'}
                        onClick={() => updatePublishForm({ liveEditType: 'use_replay' })}
                      />
                    )}
                  </label>
                  <div
                    className={classnames('replay-picker__container', {
                      disabled: inEditMode && liveEditType !== 'use_replay',
                    })}
                  >
                    <fieldset-section>
                      <div className="table__wrapper">
                        <table className="table table--livestream-data">
                          <tbody>
                            {livestreamData
                              .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                              .map((item, i) => {
                                const useStr = item.data.fileDuration && isNaN(item.data.fileDuration);
                                // $FlowIgnore (confirmed a number)
                                const durationMinutes = !useStr ? Math.floor(item.data.fileDuration / 60) : null;
                                const durationElem = useStr
                                  ? item.data.fileDuration
                                  : durationMinutes === 1
                                  ? __('%duration% minute', { duration: durationMinutes })
                                  : __('%duration% minutes', { duration: durationMinutes });

                                return (
                                  <React.Fragment key={item.data.fileLocation}>
                                    <tr className="livestream-data__row-spacer" />
                                    <tr
                                      onClick={() => setSelectedFileIndex((currentPage - 1) * PAGE_SIZE + i)}
                                      className={classnames('livestream-data__row', {
                                        'livestream-data__row--selected':
                                          selectedFileIndex === (currentPage - 1) * PAGE_SIZE + i,
                                      })}
                                    >
                                      <td>
                                        <FormField
                                          type="radio"
                                          checked={selectedFileIndex === (currentPage - 1) * PAGE_SIZE + i}
                                          label={null}
                                          onChange={() => {}}
                                          onClick={() => setSelectedFileIndex((currentPage - 1) * PAGE_SIZE + i)}
                                          className="livestream-data__row-radio"
                                        />
                                      </td>
                                      <td>
                                        <div className="livestream-data__thumb-container">
                                          {item.data.thumbnails.slice(0, 3).map((thumb) => (
                                            <img key={thumb} className="livestream___thumb" src={thumb} />
                                          ))}
                                        </div>
                                      </td>
                                      <td>
                                        {durationElem}
                                        <div className="table__item-label">
                                          {`${moment(item.data.uploadedAt).from(moment())}`}
                                        </div>
                                      </td>
                                      <td>
                                        <CopyableText
                                          primaryButton
                                          copyable={normalizeUrlForProtocol(item.data.fileLocation)}
                                          snackMessage={__('Url copied.')}
                                        />
                                      </td>
                                    </tr>
                                  </React.Fragment>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </fieldset-section>
                    {totalPages > 1 && (
                      <fieldset-group class="fieldset-group--smushed fieldgroup--paginate">
                        <fieldset-section>
                          <ReactPaginate
                            pageCount={totalPages}
                            pageRangeDisplayed={2}
                            previousLabel="‹"
                            nextLabel="›"
                            activeClassName="pagination__item--selected"
                            pageClassName="pagination__item"
                            previousClassName="pagination__item pagination__item--previous"
                            nextClassName="pagination__item pagination__item--next"
                            breakClassName="pagination__item pagination__item--break"
                            marginPagesDisplayed={2}
                            onPageChange={(e) => handlePaginateReplays(e.selected + 1)}
                            forcePage={currentPage - 1}
                            initialPage={currentPage - 1}
                            containerClassName="pagination"
                          />
                        </fieldset-section>
                      </fieldset-group>
                    )}
                  </div>
                </>
              )}
              {showReplaySelector && !hasLivestreamData && !isCheckingLivestreams && (
                <>
                  <label className="disabled" style={{ marginTop: 0 }}>
                    {inEditMode && (
                      <FormField
                        name="show-replays"
                        label={replayTitleLabel}
                        key="show-replays"
                        type="radio"
                        checked={liveEditType === 'use_replay'}
                        onClick={() => updatePublishForm({ liveEditType: 'use_replay' })}
                      />
                    )}
                  </label>
                  <div className="empty disabled" style={{ marginLeft: 'var(--spacing-m)' }}>
                    {__('No replays found.')}
                  </div>
                </>
              )}
              {showReplaySelector && isCheckingLivestreams && (
                <>
                  <label className="disabled" style={{ marginTop: 0 }}>
                    {inEditMode && (
                      <FormField
                        name="replay-source"
                        label={replayTitleLabel}
                        value="choose"
                        key="show-replays-spin"
                        type="radio"
                        checked={liveEditType === 'use_replay'}
                        onClick={() => updatePublishForm({ liveEditType: 'use_replay' })}
                      />
                    )}
                  </label>
                  <div className="main empty--centered-tight">
                    <Spinner small />
                  </div>
                </>
              )}

              {inEditMode && (
                <div className="file-upload">
                  <label style={{ marginTop: 0 }}>
                    <FormField
                      name="replay-source"
                      label={__('Upload Replay')}
                      type="radio"
                      checked={liveEditType === 'upload_replay'}
                      onClick={() => updatePublishForm({ liveEditType: 'upload_replay' })}
                    />
                  </label>
                  <FileSelector
                    disabled={liveEditType !== 'upload_replay'}
                    currentPath={typeof filePath === 'string' ? filePath : filePath?.name}
                    onFileChosen={handleFileChange}
                    accept={SIMPLE_SITE ? 'video/mp4,video/x-m4v,video/*' : undefined}
                    placeholder={__('Select video replay file to upload')}
                  />
                  {getUploadMessage()}
                </div>
              )}
            </>
            {/* @endif */}
          </React.Fragment>
        </div>
      }
    />
  );
}

export default PublishLivestream;
