import React from 'react';
import { useLocation } from 'react-router-dom';
import Modal from 'modal/modal';
import RepostCreate from 'component/repostCreate';
import useThrottle from 'effects/use-throttle';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';
import { doResolveUri } from 'redux/actions/claims';
type Props = {
  uri?: string;
  contentName?: string;
};

function ModalRepost(props: Props) {
  const { uri, contentName } = props;
  const dispatch = useAppDispatch();
  const closeModal = () => dispatch(doHideModal());
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const param = urlParams.get('name') || urlParams.get('q') || contentName;
  const repostTo = param && (param[0] === '@' ? param.slice(1) : param.replace(/\s/g, '')); // remove spaces

  const [contentUri, setContentUri] = React.useState('');
  const [repostUri, setRepostUri] = React.useState('');
  const throttledContentValue = useThrottle(contentUri, 500);
  const throttledRepostValue = useThrottle(repostUri, 500);
  React.useEffect(() => {
    if (throttledContentValue) {
      dispatch(doResolveUri(throttledContentValue));
    }
  }, [throttledContentValue, dispatch]);
  React.useEffect(() => {
    if (throttledRepostValue) {
      dispatch(doResolveUri(throttledRepostValue));
    }
  }, [throttledRepostValue, dispatch]);
  React.useEffect(() => {
    if (repostTo) {
      dispatch(doResolveUri(repostTo));
    }
  }, [repostTo, dispatch]);
  return (
    <Modal onAborted={closeModal} isOpen type="card">
      <RepostCreate
        uri={uri}
        name={repostTo}
        contentUri={contentUri}
        repostUri={repostUri}
        setContentUri={setContentUri}
        setRepostUri={setRepostUri}
      />
    </Modal>
  );
}

export default ModalRepost;
