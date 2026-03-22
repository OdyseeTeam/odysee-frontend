import React from 'react';
import Button from 'component/button';
import NavigationHistoryItem from 'component/navigationHistoryItem';
import { useAppSelector } from 'redux/hooks';
import { selectRecentHistory } from 'redux/selectors/content';
type HistoryItem = {
  uri: string;
  lastViewed: number;
};
type Props = Record<string, never>;
export default function NavigationHistoryRecent(props: Props) {
  const history: Array<HistoryItem> = useAppSelector(selectRecentHistory) || [];
  return history.length ? (
    <div className="card item-list">
      {history.map(({ lastViewed, uri }) => (
        <NavigationHistoryItem slim key={uri} uri={uri} lastViewed={lastViewed} />
      ))}
      <div className="card__actions">
        <Button navigate="/$/library/all" button="link" label={__('See All Visited Links')} />
      </div>
    </div>
  ) : null;
}
