import React from 'react';
import { selectClaimForUri, selectTitleForUri } from 'redux/selectors/claims';
import { useAppSelector } from 'redux/hooks';

type Props = {
  uri: string | null | undefined;
  isComment?: boolean;
  fallback?: any;
};

function ChannelTitle(props: Props) {
  const { uri, isComment, fallback } = props;

  const title = useAppSelector((state) => selectTitleForUri(state, uri));
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));

  if (isComment) {
    if (!title) {
      let cleanFallback = fallback && fallback[0] && fallback[0].substring(fallback[0].indexOf('@'));
      return cleanFallback && cleanFallback.substring(0, cleanFallback.indexOf(':'))
        ? cleanFallback.substring(0, cleanFallback.indexOf(':'))
        : cleanFallback;
    } else return title;
  }

  if (!claim) {
    return null;
  }

  return <div className="claim-preview__title">{title || claim.name}</div>;
}

export default ChannelTitle;
