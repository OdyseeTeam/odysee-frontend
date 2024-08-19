// @flow
import * as React from 'react';
import FileVisibility from 'component/fileVisibility';

type Props = {
  uri: string,
  isAgeRestricted: boolean,
  isAgeRestrictedContentAllowed: boolean,
  isMine: boolean,
};

const PreviewOverlayAgeRestrictedContent = (props: Props) => {
  const { uri, isAgeRestricted, isAgeRestrictedContentAllowed, isMine } = props;

  if (isAgeRestricted) {
    return (
      <div className={`age-restricted-content__wrapper ${isMine || isAgeRestrictedContentAllowed ? 'no-blur' : ''}`}>
        <FileVisibility uri={uri} shownFields={['age-restriced']} />
      </div>
    );
  }

  return null;
};

export default PreviewOverlayAgeRestrictedContent;
