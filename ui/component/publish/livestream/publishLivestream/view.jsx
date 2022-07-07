// @flow
import React, { useState, useEffect } from 'react';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';
import Spinner from 'component/spinner';
import * as PUBLISH_MODES from 'constants/publish_types';
import PublishName from '../../shared/publishName';
import CopyableText from 'component/copyableText';
import Empty from 'component/common/empty';
import moment from 'moment';
import classnames from 'classnames';
import ReactPaginate from 'react-paginate';
import { SOURCE_NONE, SOURCE_SELECT, SOURCE_UPLOAD } from 'constants/publish_sources';
import './style.scss';

type Props = {
  uri: ?string,
  mode: ?string,
  // name: ?string,
  title: ?string,
  filePath: string | WebFile,
  isStillEditing: boolean,
  balance: number,
  doUpdatePublishForm: ({}) => void,
  disabled: boolean,
  publishing: boolean,
  // doToast: ({ message: string, isError?: boolean }) => void,
  inProgress: boolean,
  optimize: boolean,
  livestreamData: LivestreamReplayData,
  checkLivestreams: (string, string) => void,
  channelName: string,
  channelId: string,
  isCheckingLivestreams: boolean,
  setWaitForFile: (boolean) => void,
  fileSource: string,
  changeFileSource: (string) => void,
  inEditMode: boolean,
};

function PublishLivestream(props: Props) {
  const {
    uri,
    mode,
    // name,
    title,
    balance,
    filePath,
    isStillEditing,
    doUpdatePublishForm: updatePublishForm,
    // doToast,
    disabled,
    livestreamData,
    isCheckingLivestreams,
    fileSource,
    changeFileSource,
    inEditMode,
  } = props;

  const livestreamDataStr = JSON.stringify(livestreamData);
  const hasLivestreamData = livestreamData && Boolean(livestreamData.length);

  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const PAGE_SIZE = 4;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages =
    hasLivestreamData && livestreamData.length > PAGE_SIZE ? Math.ceil(livestreamData.length / PAGE_SIZE) : 1;

  const replayTitleLabel = !inEditMode ? __('Select Replay') : __('Change Replay');
  const [changeReplay, setChangeReplay] = useState(false);

  // Reset filePath if publish mode changed
  useEffect(() => {
    updatePublishForm({ filePath: '' });
  }, [mode, isStillEditing, updatePublishForm]);

  // Reset title when form gets cleared
  useEffect(() => {
    updatePublishForm({ title: title });
  }, [filePath]);

  // Initialize default file source state for each mode.
  useEffect(() => {
    switch (mode) {
      case PUBLISH_MODES.LIVESTREAM:
        if (inEditMode) {
          changeFileSource(SOURCE_SELECT);
        } else {
          changeFileSource(SOURCE_NONE);
        }
        break;
      case PUBLISH_MODES.FILE:
        changeFileSource(SOURCE_UPLOAD);
        break;
    }
  }, [mode, hasLivestreamData]); // eslint-disable-line react-hooks/exhaustive-deps

  const normalizeUrlForProtocol = (url) => {
    if (url.startsWith('https://')) {
      return url;
    } else {
      if (url.startsWith('http://')) {
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

  /*
  function parseName(newName) {
    let INVALID_URI_CHARS = new RegExp(regexInvalidURI, 'gu');
    return newName.replace(INVALID_URI_CHARS, '-');
  }
  */

  /*
  function autofillTitle(file) {
    const newTitle = (file && file.name && file.name.substr(0, file.name.lastIndexOf('.'))) || name || '';
    if (!title) updatePublishForm({ title: newTitle });
  }
  */

  return (
    <Card
      className={classnames({
        'card--disabled': disabled || balance === 0,
      })}
      actions={
        <>
          <div className="card--file">
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
                {(fileSource === SOURCE_SELECT || inEditMode) && hasLivestreamData && !isCheckingLivestreams && (
                  <>
                    <label>
                      {inEditMode && (
                        <FormField
                          name="show-replays"
                          type="checkbox"
                          checked={changeReplay}
                          onChange={() => setChangeReplay(!changeReplay)}
                        />
                      )}
                      {replayTitleLabel}
                    </label>
                    <div
                      className={classnames('replay-picker--container', {
                        disabled: inEditMode && !changeReplay,
                      })}
                    >
                      <fieldset-section>
                        <div className="table__wrapper">
                          <table className="table table--livestream-data">
                            <tbody>
                              {livestreamData
                                .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                                .map((item, i) => (
                                  <>
                                    <tr className="livestream__data-row-spacer" />
                                    <tr
                                      onClick={() => setSelectedFileIndex((currentPage - 1) * PAGE_SIZE + i)}
                                      key={item.id}
                                      className={classnames('livestream__data-row', {
                                        'livestream__data-row--selected':
                                          selectedFileIndex === (currentPage - 1) * PAGE_SIZE + i,
                                      })}
                                    >
                                      <td>
                                        <FormField
                                          type="radio"
                                          checked={selectedFileIndex === (currentPage - 1) * PAGE_SIZE + i}
                                          label={null}
                                          onClick={() => setSelectedFileIndex((currentPage - 1) * PAGE_SIZE + i)}
                                          className="livestream__data-row-radio"
                                        />
                                      </td>
                                      <td>
                                        <div className="livestream_thumb_container">
                                          {item.data.thumbnails.slice(0, 3).map((thumb) => (
                                            <img key={thumb} className="livestream___thumb" src={thumb} />
                                          ))}
                                        </div>
                                      </td>
                                      <td>
                                        {item.data.fileDuration && isNaN(item.data.fileDuration)
                                          ? item.data.fileDuration
                                          : `${Math.floor(item.data.fileDuration / 60)} ${
                                              Math.floor(item.data.fileDuration / 60) > 1 ? __('minutes') : __('minute')
                                            }`}
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
                                  </>
                                ))}
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
                {(fileSource === SOURCE_SELECT || inEditMode) && !hasLivestreamData && !isCheckingLivestreams && (
                  <div className="main--empty empty">
                    <Empty text={__('No replays found.')} />
                  </div>
                )}
                {(fileSource === SOURCE_SELECT || inEditMode) && isCheckingLivestreams && (
                  <div className="main--empty empty">
                    <Spinner small />
                  </div>
                )}
              </>
              {/* @endif */}
            </React.Fragment>
          </div>
        </>
      }
    />
  );
}

export default PublishLivestream;
