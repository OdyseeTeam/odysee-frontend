// @flow
import React from 'react';
import Button from 'component/button';
import classnames from 'classnames';

type Props = {
  viewMode: string,
  channelName: ?string,
  onViewModeChange: (mode: string) => void,
  isTransitioning?: boolean,
};

const ViewModeToggle = React.memo<Props>(({ viewMode, channelName, onViewModeChange, isTransitioning }: Props) => {
  return (
    <div
      className={classnames('shorts-page__view-toggle--overlay', {
        'shorts-page__view-toggle--hidden': isTransitioning,
      })}
    >
      <Button
        className={classnames('button-bubble', {
          'button-bubble--active': viewMode === 'related',
        })}
        label={__('Related')}
        onClick={(e) => {
          e.stopPropagation();
          onViewModeChange('related');
        }}
      />
      <Button
        className={classnames('button-bubble', {
          'button-bubble--active': viewMode === 'channel',
        })}
        label={__('From %channel%', {
          channel:
            channelName && channelName.length > 15 ? channelName.substring(0, 15) + '...' : channelName || 'Channel',
        })}
        onClick={(e) => {
          e.stopPropagation();
          onViewModeChange('channel');
        }}
      />
    </div>
  );
});

export default ViewModeToggle;
