import * as React from 'react';
import ClaimPreview from 'component/claimPreview';
import { useAppSelector } from 'redux/hooks';
import { selectChannelForClaimUri } from 'redux/selectors/claims';
export type Props = {
  uri: string | null | undefined;
  hideActions?: boolean;
  channelSubCount?: number;
};
export default function ClaimAuthor(props: Props) {
  const { uri, hideActions, channelSubCount } = props;
  const channelUri = useAppSelector((state) => selectChannelForClaimUri(state, uri));
  return channelUri ? (
    <ClaimPreview
      uri={channelUri}
      type="inline"
      properties={false}
      hideMenu
      hideActions={hideActions}
      channelSubCount={channelSubCount}
    />
  ) : (
    <span className="claim-preview--inline claim-preview__title">{__('Anonymous')}</span>
  );
}
