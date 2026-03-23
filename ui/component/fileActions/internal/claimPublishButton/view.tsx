import * as ICONS from 'constants/icons';
import { buildURI } from 'util/lbryURI';
import React from 'react';
import FileActionButton from 'component/common/file-action-button';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doPrepareEdit } from 'redux/actions/publish';
import { selectClaimForUri, selectChannelNameForClaimUri, selectClaimIsMineForUri } from 'redux/selectors/claims';

type Props = {
  uri: string;
  claimType: string;
};

function ClaimPublishButton(props: Props) {
  const { uri, claimType } = props;
  const dispatch = useAppDispatch();

  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const channelName = useAppSelector((state) => selectChannelNameForClaimUri(state, uri));
  const claimIsMine = useAppSelector((state) => selectClaimIsMineForUri(state, uri));
  // We want to use the short form uri for editing
  // This is what the user is used to seeing, they don't care about the claim id
  // We will select the claim id before they publish
  let editUri;

  if (claim && claimIsMine) {
    const { name: claimName, claim_id: claimId } = claim;
    const uriObject: LbryUrlObj = {
      streamName: claimName,
      streamClaimId: claimId,
    };

    if (channelName) {
      uriObject.channelName = channelName;
    }

    editUri = buildURI(uriObject);
  }

  return (
    <FileActionButton
      title={claimType === 'livestream' ? __('Update or Publish Replay') : __('Edit')}
      label={claimType === 'livestream' ? __('Update or Publish Replay') : __('Edit')}
      icon={ICONS.EDIT}
      onClick={!claim ? undefined : () => dispatch(doPrepareEdit(claim, editUri))}
    />
  );
}

export default ClaimPublishButton;
