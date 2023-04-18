// @flow
import React from 'react';

import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';

import { formatLbryUrlForWeb, getModalUrlParam } from 'util/url';
import { AppContext } from 'component/app/view';
import { EmbedContext } from 'contexts/embed';

import Icon from 'component/common/icon';
import Button from 'component/button';

type Props = {
  fileUri?: string,
  channelName: ?string,
  claimIsMine: boolean,
  isProtected: boolean,
  uri: string,
  scheduledState: ClaimScheduledState,
  userIsAMember: boolean,
  myMembership: ?Membership,
  cheapestPlanPrice: ?Membership,
  passClickPropsToParent?: (props: { href?: string, onClick?: () => void }) => void,
  doOpenModal: (string, {}) => void,
};

const ProtectedContentOverlay = (props: Props) => {
  const {
    channelName,
    claimIsMine,
    uri,
    isProtected,
    myMembership,
    scheduledState,
    userIsAMember,
    cheapestPlanPrice,
    passClickPropsToParent,
    doOpenModal,
  } = props;

  const appFileUri = React.useContext(AppContext)?.uri;
  const fileUri = props.fileUri || appFileUri;
  const isEmbed = React.useContext(EmbedContext);
  const membershipFetching = myMembership === undefined;

  const clickProps = React.useMemo(
    () =>
      isEmbed
        ? { href: `${formatLbryUrlForWeb(uri)}?${getModalUrlParam(MODALS.JOIN_MEMBERSHIP, { uri, fileUri })}` }
        : { onClick: () => doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri, fileUri }) },
    [doOpenModal, fileUri, isEmbed, uri]
  );

  React.useEffect(() => {
    if (passClickPropsToParent) {
      passClickPropsToParent(clickProps);
    }
  }, [clickProps, passClickPropsToParent]);

  if (membershipFetching || !isProtected || userIsAMember || claimIsMine) return null;

  if (scheduledState === 'scheduled') {
    return null;
  }

  return (
    <div className="protected-content-overlay">
      <Icon icon={ICONS.LOCK} />
      <span>{__('Only %channel_name% members can view this content.', { channel_name: channelName })}</span>

      <Button
        button="primary"
        icon={ICONS.MEMBERSHIP}
        label={
          cheapestPlanPrice
            ? __(
                isEmbed
                  ? 'Join on Odysee now for $%membership_price% per month!'
                  : 'Join for $%membership_price% per month',
                { membership_price: cheapestPlanPrice }
              )
            : __('Membership options')
        }
        title={__('Become a member')}
        {...clickProps}
      />
    </div>
  );
};

export default ProtectedContentOverlay;
