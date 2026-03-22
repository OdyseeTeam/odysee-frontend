import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import React from 'react';
import FileActionButton from 'component/common/file-action-button';
import Tooltip from 'component/common/tooltip';
import { platform } from 'util/platform';
import { useIsMobile } from 'effects/use-screensize';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doOpenModal } from 'redux/actions/app';
import { selectClaimIsMineForUri, selectIsUriUnlisted } from 'redux/selectors/claims';

// ****************************************************************************
// ClaimShareButton
// ****************************************************************************
type Props = {
  uri: string;
  fileAction?: boolean;
  webShareable: boolean;
  collectionId?: string;
  shrinkOnMobile?: boolean;
};

function ClaimShareButton(props: Props) {
  const { uri, fileAction, collectionId, webShareable, shrinkOnMobile = false } = props;
  const dispatch = useAppDispatch();
  const isClaimMine = useAppSelector((state) => selectClaimIsMineForUri(state, uri));
  const isUnlisted = useAppSelector((state) => selectIsUriUnlisted(state, uri));
  const isMobile = useIsMobile();

  const [showHint, setShowHint] = React.useState(false);
  const hintState = React.useMemo(() => {
    return {
      open: showHint,
      onClose: () => setShowHint(false),
    };
  }, [showHint]);

  React.useEffect(() => {
    if (!platform.isMobile() && isUnlisted && isClaimMine) {
      // Delay to get the anchor positioning right
      const t = setTimeout(() => setShowHint(true), 1000);
      return () => clearTimeout(t);
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount
  }, []);

  if (isUnlisted && !isClaimMine) {
    // The viewer obtains the short URL from the creator. That gets expanded
    // when viewer, so there's no way to retrieve the short URL unless we
    // stash it. Limit the button to just creators for now.
    return null;
  }

  const label = isMobile && shrinkOnMobile ? '' : __('Share');
  const title = isUnlisted ? 'Get a sharable link for your unlisted content.' : 'Share this content';

  const button = (
    <FileActionButton
      title={__(title)}
      label={label}
      icon={ICONS.SHARE}
      onClick={() =>
        dispatch(
          doOpenModal(MODALS.SOCIAL_SHARE, {
            uri,
            webShareable,
            collectionId,
          })
        )
      }
      noStyle={!fileAction}
    />
  );

  if (showHint) {
    return (
      <Tooltip arrow state={hintState} title={__('Get a sharable link for your unlisted content.')}>
        <div onMouseEnter={() => setShowHint(false)}>{button}</div>
      </Tooltip>
    );
  }

  return button;
}

export default ClaimShareButton;
