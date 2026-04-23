import React from 'react';
import { useLocation } from 'react-router-dom';
import Card from 'component/common/card';
import MarkdownPreview from 'component/common/markdown-preview';
import * as PAGES from 'constants/pages';
import { Modal } from 'modal/modal';
import { getSimpleStrHash } from 'util/string';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';
import { doSetLastViewedAnnouncement } from 'redux/actions/content';
import { selectLastViewedAnnouncement } from 'redux/selectors/content';
import { selectHomepageAnnouncement } from 'redux/selectors/settings';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
type Props = {
  isAutoInvoked?: boolean;
};
export default function ModalAnnouncements(props: Props) {
  const { isAutoInvoked } = props;
  const dispatch = useAppDispatch();
  const authenticated = useAppSelector(selectUserVerifiedEmail);
  const announcement = useAppSelector(selectHomepageAnnouncement);
  const lastViewedHash = useAppSelector(selectLastViewedAnnouncement);
  const { pathname } = useLocation();
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    if (!authenticated || (pathname !== '/' && pathname !== `/$/${PAGES.HELP}`) || announcement === '') {
      dispatch(doHideModal());
      return;
    }

    const hash = getSimpleStrHash(announcement);

    if (lastViewedHash.includes(hash)) {
      if (isAutoInvoked) {
        dispatch(doHideModal());
      } else {
        setShow(true);
      }
    } else {
      setShow(true);
      dispatch(doSetLastViewedAnnouncement(hash));
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  if (!show) {
    return null;
  }

  return (
    <Modal type="card" isOpen onAborted={() => dispatch(doHideModal())}>
      <Card
        className="announcement"
        actions={<MarkdownPreview className="markdown-preview--announcement" content={announcement} simpleLinks />}
      />
    </Modal>
  );
}
