// @flow
import * as React from 'react';
import ClaimPreview from 'component/claimPreview';

export type Props = {|
  uri: ?string,
  hideActions?: boolean,
  channelSubCount?: number,
|};

type StateProps = {|
  channelUri: ?string,
|};

type DispatchProps = {||};

export default function ClaimAuthor(props: Props & StateProps & DispatchProps) {
  const { channelUri, hideActions, channelSubCount } = props;

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
