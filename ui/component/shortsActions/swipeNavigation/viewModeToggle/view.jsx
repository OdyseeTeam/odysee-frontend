// @flow
import React from 'react';
import Button from 'component/button';
import classnames from 'classnames';

type Props = {
  viewMode: string,
  channelName: ?string,
  onViewModeChange: (mode: string) => void,
};

const ViewModeToggle = React.memo<Props>(({ viewMode, channelName, onViewModeChange }: Props) => {
  return (
    <div className="shorts-page__view-toggle--overlay">
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
