import React, { useState, useEffect, useCallback } from 'react';
import { ipcRenderer } from 'electron';
import classnames from 'classnames';

function StatusBar() {
  const [hoverUrl, setHoverUrl] = useState('');
  const [show, setShow] = useState(false);

  const handleUrlChange = useCallback((_event: any, url: string) => {
    if (url === '') {
      setShow(false);
    } else {
      setShow(true);
      setHoverUrl(url);
    }
  }, []);

  useEffect(() => {
    ipcRenderer.on('update-target-url', handleUrlChange);
    return () => {
      ipcRenderer.removeListener('update-target-url', handleUrlChange);
    };
  }, [handleUrlChange]);

  return (
    <div
      className={classnames('status-bar', {
        visible: show,
      })}
    >
      {decodeURI(hoverUrl)}
    </div>
  );
}

export default StatusBar;
