import React from 'react';
import MarkdownPreview from 'component/common/markdown-preview';
import { useAppSelector } from 'redux/hooks';
import { selectClaimForUri } from 'redux/selectors/claims';
import { getClaimMetadata } from 'util/claim';
type Props = {
  uri?: string;
  description?: string;
};

function ClaimDescription(props: Props) {
  const { uri, description: descriptionProp } = props;
  const hasPassedDescription = 'description' in props;
  const claim = useAppSelector((state) => (!hasPassedDescription && uri ? selectClaimForUri(state, uri) : undefined));
  const metadata = claim && getClaimMetadata(claim);
  const description = hasPassedDescription ? descriptionProp : metadata && metadata.description;
  return !description ? null : (
    <MarkdownPreview className="markdown-preview--description" content={description} simpleLinks />
  );
}

export default ClaimDescription;
