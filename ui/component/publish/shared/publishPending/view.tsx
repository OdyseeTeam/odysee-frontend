import React from 'react';
import Lbry from 'lbry';
import Button from 'component/button';
import Spinner from 'component/spinner';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doCheckReflectingFiles } from 'redux/actions/publish';
import { makeSelectReflectingClaimForUri } from 'redux/selectors/claims';
type Props = {
  uri?: string;
};

const PublishPending = (props: Props) => {
  const { uri } = props;
  const dispatch = useAppDispatch();
  const reflectingInfo = useAppSelector((state) => (uri ? makeSelectReflectingClaimForUri(uri)(state) : {})) || {};
  const checkReflecting = () => dispatch(doCheckReflectingFiles());
  const { fileListItem, progress, stalled } = reflectingInfo;
  const sdHash = fileListItem && fileListItem.sd_hash;
  const reflecting = Object.keys(reflectingInfo).length;

  if (stalled) {
    return (
      <Button
        button="link"
        label={__('Upload stalled. Retry?')}
        onClick={() =>
          Lbry.file_reflect({
            sd_hash: sdHash,
          }).then(() => checkReflecting())
        }
      />
    );
  } else if (reflecting) {
    return (
      <span>
        {__('Uploading (%progress%%) ', {
          progress: progress,
        })}
      </span>
    );
  } else {
    return (
      <div className="confirming-change">
        {__('Confirming')} <Spinner type="small" />
      </div>
    );
  }
};

export default PublishPending;
