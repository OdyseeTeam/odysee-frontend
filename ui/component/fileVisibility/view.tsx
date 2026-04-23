import React from 'react';
import './style.scss';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import { useAppSelector } from 'redux/hooks';
import { selectIsUriUnlisted } from 'redux/selectors/claims';
type Props = {
  uri: string | null | undefined;
};

function FileVisibility(props: Props) {
  const { uri } = props;
  const isUnlisted = useAppSelector((state) => selectIsUriUnlisted(state, uri));

  if (isUnlisted) {
    return (
      <div className="file-visibility">
        <Icon icon={ICONS.COPY_LINK} size={9} />
        {__('unlisted')}
      </div>
    );
  }

  return null;
}

export default FileVisibility;
