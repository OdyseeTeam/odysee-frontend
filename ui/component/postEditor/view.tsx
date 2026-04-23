import React, { useEffect } from 'react';
import { FormField } from 'component/common/form';
import debounce from 'util/debounce';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectIsStillEditing, selectPublishFormValue } from 'redux/selectors/publish';
import { selectStreamingUrlForUri } from 'redux/selectors/file_info';
import { doPlayUri } from 'redux/actions/content';

type Props = {
  uri: string | null | undefined;
  label: string | null | undefined;
  disabled: boolean | null | undefined;
  fileMimeType: string | null | undefined;
  setPrevFileText: (arg0: string) => void;
};

function PostEditor(props: Props) {
  const { uri, label, disabled, fileMimeType, setPrevFileText } = props;

  const dispatch = useAppDispatch();
  const filePath = useAppSelector((state) => selectPublishFormValue(state, 'filePath'));
  const fileText = useAppSelector((state) => selectPublishFormValue(state, 'fileText'));
  const streamingUrl = useAppSelector((state) => selectStreamingUrlForUri(state, uri));
  const isStillEditing = useAppSelector(selectIsStillEditing);

  const editing = isStillEditing && uri;
  const [ready, setReady] = React.useState(!editing);
  const [loading, setLoading] = React.useState(false);
  const [localText, setLocalText] = React.useState(fileText || '');

  // Keep local text in sync when Redux state changes externally (e.g. loading edited content)
  React.useEffect(() => {
    if (fileText !== undefined && fileText !== null && fileText !== localText) {
      setLocalText(fileText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileText]);

  const debouncedDispatch = React.useCallback(
    debounce((value) => {
      dispatch(
        doUpdatePublishForm({
          fileText: value,
        })
      );
    }, 750),
    [dispatch]
  );

  const localTextRef = React.useRef(localText);
  localTextRef.current = localText;
  React.useEffect(() => {
    return () => {
      dispatch(doUpdatePublishForm({ fileText: localTextRef.current }));
    };
  }, [dispatch]);

  const updateFileText = React.useCallback(
    (value: string) => {
      setLocalText(value);
      debouncedDispatch(value);
    },
    [debouncedDispatch]
  );
  useEffect(() => {
    if (editing && uri) {
      dispatch(doPlayUri(uri));
    }
  }, [uri, editing, dispatch]);
  // Ready to edit content
  useEffect(() => {
    if (!ready && !loading && fileText && streamingUrl) {
      setReady(true);
    }
  }, [ready, loading, fileText, streamingUrl]);
  useEffect(() => {
    if (fileText && loading) {
      setLoading(false);
    } else if (!fileText && loading) {
      setLoading(true);
    }
  }, [fileText, loading, setLoading]);
  useEffect(() => {
    function readFileStream(url) {
      return fetch(url).then((res) => res.text());
    }

    async function updateEditorText(url) {
      try {
        const text = await readFileStream(url);

        if (text) {
          // Store original content
          setPrevFileText(text);
          // Update text editor form
          dispatch(
            doUpdatePublishForm({
              fileText: text,
            })
          );
        }
      } catch (error) {
        console.error(error); // eslint-disable-line
      }
    }

    if (editing) {
      // Editing same file (previously published)
      // User can use a different file to replace the content
      if (!ready && !filePath && !fileText && streamingUrl && fileMimeType === 'text/markdown') {
        // setCurrentFileType(fileMimeType);
        updateEditorText(streamingUrl);
      }
    }
  }, [
    ready,
    editing,
    fileText,
    filePath,
    fileMimeType,
    streamingUrl,
    setPrevFileText,
    dispatch, // setCurrentFileType,
  ]);
  return (
    <FormField
      type={'markdown'}
      name="content_post"
      label={label}
      placeholder={__('My content for this post...')}
      value={ready ? localText : __('Loading...')}
      disabled={!ready || disabled}
      onChange={updateFileText}
    />
  );
}

export default PostEditor;
