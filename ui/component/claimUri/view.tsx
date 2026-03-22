import React from 'react';
import classnames from 'classnames';
import { clipboard } from 'electron';
import Button from 'component/button';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectCanonicalUrlForUri } from 'redux/selectors/claims';
import { doToast as doToastAction } from 'redux/actions/notifications';
type Props = {
  uri: string;
  inline?: boolean;
  noShortUrl?: boolean;
};

function ClaimUri(props: Props) {
  const { uri, inline = false, noShortUrl = false } = props;
  const dispatch = useAppDispatch();
  const shortUrl = useAppSelector((state) => selectCanonicalUrlForUri(state, uri));
  const doToast = React.useCallback((params: { message: string }) => dispatch(doToastAction(params)), [dispatch]);
  return (
    <Button
      button="link"
      className={classnames('media__uri', {
        'media__uri--inline': inline,
      })}
      label={noShortUrl ? uri : shortUrl || uri}
      onClick={() => {
        clipboard.writeText(shortUrl || uri);
        doToast({
          message: __('Copied'),
        });
      }}
    />
  );
}

export default ClaimUri;
