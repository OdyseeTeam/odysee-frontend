// @flow
import { SITE_NAME, WEB_PUBLISH_SIZE_LIMIT_GB, SIMPLE_SITE } from 'config';
import type { Node } from 'react';
import * as ICONS from 'constants/icons';
import React, { useState, useEffect } from 'react';
import { regexInvalidURI } from 'util/lbryURI';
import PostEditor from 'component/postEditor';
import FileSelector from 'component/common/file-selector';
import Button from 'component/button';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';
import Spinner from 'component/spinner';
import I18nMessage from 'component/i18nMessage';
import usePersistedState from 'effects/use-persisted-state';
import * as PUBLISH_MODES from 'constants/publish_types';
import PublishName from 'component/publish/shared/publishName';
import CopyableText from 'component/copyableText';
import Empty from 'component/common/empty';
import moment from 'moment';
import classnames from 'classnames';
import ReactPaginate from 'react-paginate';
import { SOURCE_NONE, SOURCE_SELECT, SOURCE_UPLOAD } from 'constants/publish_sources';

type Props = {
  uri: ?string,
  mode: ?string,
  name: ?string,
  title: ?string,
  filePath: string | WebFile,
  fileMimeType: ?string,
  isStillEditing: boolean,
  balance: number,
  doUpdatePublishForm: ({}) => void,
  disabled: boolean,
  publishing: boolean,
  doToast: ({ message: string, isError?: boolean }) => void,
  inProgress: boolean,
  doClearPublish: () => void,
  ffmpegStatus: any,
  optimize: boolean,
  setPublishMode: (string) => void,
  setPrevFileText: (string) => void,
  header: Node,
  channelName: string,
  channelId: string,
  inEditMode: boolean,
};

function PublishPost(props: Props) {
  const {
    uri,
    mode,
    name,
    title,
    balance,
    filePath,
    fileMimeType,
    isStillEditing,
    doUpdatePublishForm: updatePublishForm,
    doToast,
    disabled,
    publishing,
    inProgress,
    doClearPublish,
    optimize,
    ffmpegStatus = {},
    isVid,
    setPrevFileText,
    header,
    channelId,
    channelName,
    inEditMode,
  } = props;

  const ffmpegAvail = ffmpegStatus.available;
  const [currentFile, setCurrentFile] = useState(null);
  const [currentFileType, setCurrentFileType] = useState(null);
  const [userOptimize, setUserOptimize] = usePersistedState('publish-file-user-optimize', false);

  // Reset filePath if publish mode changed
  useEffect(() => {
    if (currentFileType !== 'text/markdown' && !isStillEditing) {
      updatePublishForm({ filePath: '' });
    }
  }, [currentFileType, isStillEditing, updatePublishForm]);

  useEffect(() => {
    const isOptimizeAvail = currentFile && currentFile !== '' && isVid && ffmpegAvail;
    const finalOptimizeState = isOptimizeAvail && userOptimize;

    updatePublishForm({ optimize: finalOptimizeState });
  }, [currentFile, filePath, isVid, ffmpegAvail, userOptimize, updatePublishForm]);

  function handleTitleChange(event) {
    updatePublishForm({ title: event.target.value });
  }

  return (
    <Card
      className={classnames({
        'card--disabled': disabled || balance === 0,
      })}
      actions={
        <div className="card--file">
          <React.Fragment>
            <FormField
              type="text"
              name="content_title"
              label={__('Title')}
              placeholder={__('Descriptive titles work best')}
              disabled={disabled}
              value={title}
              onChange={handleTitleChange}
              className="fieldset-group"
            />
            <PublishName uri={uri} />
            <PostEditor
              label={__('Post --[noun, markdown post tab button]--')}
              uri={uri}
              disabled={disabled}
              fileMimeType={fileMimeType}
              setPrevFileText={setPrevFileText}
              setCurrentFileType={setCurrentFileType}
            />
          </React.Fragment>
        </div>
      }
    />
  );
}

export default PublishPost;
