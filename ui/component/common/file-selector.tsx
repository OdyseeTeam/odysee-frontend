import React, { useRef, useCallback } from 'react';
import Button from 'component/button';
import { FormField } from 'component/common/form';
type Props = {
  type?: string;
  currentPath?: string | null;
  onFileChosen: (arg0: WebFile) => void;
  label?: string;
  placeholder?: string;
  accept?: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  name?: string;
};

function FileSelector({ type = 'file', currentPath, onFileChosen, label, placeholder, accept, error, disabled, autoFocus = false }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFileInputSelection = useCallback(() => {
    const files = fileInput.current?.files;
    if (!files) return;
    const file = files[0];
    if (onFileChosen) onFileChosen(file);
    if (fileInput.current) fileInput.current.value = '';
  }, [onFileChosen]);

  const fileInputButton = useCallback(() => {
    fileInput.current?.click();
  }, []);

  const placeHolder = currentPath || placeholder;
  return (
    <React.Fragment>
      <FormField
        label={label}
        webkitdirectory="true"
        className="form-field--copyable"
        error={error}
        disabled={disabled}
        type="text"
        readOnly={true}
        value={placeHolder || __('Choose a file')}
        inputButton={
          <Button
            autoFocus={autoFocus}
            button="primary"
            disabled={disabled}
            onClick={fileInputButton}
            label={__('Browse')}
          />
        }
      />
      <input
        type={'file'}
        style={{ display: 'none' }}
        accept={accept}
        ref={fileInput}
        onChange={handleFileInputSelection}
        {...(type === 'openDirectory' ? { webkitdirectory: 'True' } as any : {})}
      />
    </React.Fragment>
  );
}

export default FileSelector;
