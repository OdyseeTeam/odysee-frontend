import * as ICONS from 'constants/icons';
import React, { useCallback } from 'react';
import Button from 'component/button';
import Spinner from 'component/spinner';
type Props = {
  data: any;
  label: string;
  tooltip?: string;
  defaultFileName?: string;
  filters?: Array<string>;
  onFetch?: () => void;
  progressMsg?: string;
  disabled?: boolean;
};

function FileExporter({ data, label, tooltip, defaultFileName, onFetch, progressMsg, disabled }: Props) {
  const handleDownload = useCallback(() => {
    const element = document.createElement('a');
    const file = new Blob([data], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = defaultFileName || 'file.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, [data, defaultFileName]);

  if (onFetch) {
    return (
      <>
        {!progressMsg && (
          <div className="button-group">
            <Button
              button="alt"
              disabled={disabled}
              icon={ICONS.FETCH}
              label={label}
              aria-label={tooltip}
              onClick={() => onFetch()}
            />
            {data && (
              <Button
                button="alt"
                disabled={disabled}
                icon={ICONS.DOWNLOAD}
                aria-label={__('Download fetched file')}
                onClick={handleDownload}
              />
            )}
          </div>
        )}
        {progressMsg && (
          <>
            {progressMsg}
            <Spinner type="small" />
          </>
        )}
      </>
    );
  }

  return (
    <Button
      button="primary"
      disabled={disabled}
      icon={ICONS.DOWNLOAD}
      label={label || __('Export')}
      aria-label={tooltip}
      onClick={handleDownload}
    />
  );
}

export default FileExporter;
