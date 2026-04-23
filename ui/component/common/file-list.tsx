import React from 'react';

type Props = {
  files: Array<WebFile>;
  onChange: (arg0: WebFile | void) => void;
};

function FileList(props: Props) {
  const { files, onChange } = props;
  const [selectedName, setSelectedName] = React.useState<string | undefined>();

  const getFile = (value?: string) => {
    if (files && files.length) {
      return files.find((file: WebFile) => file.name === value);
    }
  };

  React.useEffect(() => {
    if (!files.length) {
      setSelectedName(undefined);
      onChange();
      return;
    }

    if (!selectedName || !files.some((file) => file.name === selectedName)) {
      const firstFile = files[0];
      setSelectedName(firstFile.name);
      onChange(firstFile);
    }
  }, [files, onChange, selectedName]);

  return (
    <div className="file-list">
      <div aria-label="files" role="radiogroup">
        {files.map(({ name }) => {
          const id = `file-list-${name}`;

          return (
            <span className="radio" key={name}>
              <input
                checked={selectedName === name}
                id={id}
                name="file-list"
                type="radio"
                value={name}
                onChange={() => {
                  setSelectedName(name);
                  onChange(getFile(name));
                }}
              />
              <label htmlFor={id}>{name}</label>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default FileList;
