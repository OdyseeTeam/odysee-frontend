// @flow
import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import React from 'react';
import FileActionButton from 'component/common/file-action-button';
import Tooltip from 'component/common/tooltip';
import { platform } from 'util/platform';
import { useIsMobile } from 'effects/use-screensize';

// ****************************************************************************
// withUnlisted
// ****************************************************************************

function withUnlisted(Component: (props: any) => React$Element<any>) {
  return function UnlistedShare(props: any) {
    const { isClaimMine, isUnlisted } = props;

    const [showHint, setShowHint] = React.useState(false);

    const state = React.useMemo(() => {
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
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount
    }, []);

    if (isUnlisted && !isClaimMine) {
      // The viewer obtains the short URL from the creator. That gets expanded
      // when viewer, so there's no way to retrieve the short URL unless we
      // stash it. Limit the button to just creators for now.
      return null;
    }

    if (showHint) {
      return (
        <Tooltip arrow state={state} title={__('Get a sharable link for your unlisted content.')}>
          <div onMouseEnter={() => setShowHint(false)}>
            <Component {...props} />
          </div>
        </Tooltip>
      );
    }

    return <Component {...props} />;
  };
}

// ****************************************************************************
// ClaimShareButton
// ****************************************************************************

type Props = {
  uri: string,
  fileAction?: boolean,
  webShareable: boolean,
  collectionId?: string,
  shrinkOnMobile?: boolean,
  // redux
  isUnlisted: ?boolean,
  doOpenModal: (id: string, {}) => void,
};

function ClaimShareButton(props: Props) {
  const { uri, fileAction, collectionId, webShareable, shrinkOnMobile = false, isUnlisted, doOpenModal } = props;

  const isMobile = useIsMobile();

  const label = isMobile && shrinkOnMobile ? '' : __('Share');
  const title = isUnlisted ? 'Get a sharable link for your unlisted content.' : 'Share this content';

  return (
    <FileActionButton
      title={__(title)}
      label={label}
      icon={ICONS.SHARE}
      onClick={() => doOpenModal(MODALS.SOCIAL_SHARE, { uri, webShareable, collectionId })}
      noStyle={!fileAction}
    />
  );
}

export default withUnlisted(ClaimShareButton);
