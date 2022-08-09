// @flow
import React from 'react';
import { FormField } from 'component/common/form';

type Props = {
  tiny?: boolean,
  label?: string,
  injected?: ?Array<string>,
  // --- Redux ---
  myChannelClaimIds: ?Array<ChannelClaim>,
  fetchingChannels: boolean,
  activeChannelClaimId: ?string,
  setActiveChannel: (claimId: ?string, override?: boolean) => void,
};

function SelectChannel(props: Props) {
  const {
    fetchingChannels,
    myChannelClaimIds = [],
    label,
    injected = [],
    tiny,
    activeChannelClaimId,
    setActiveChannel,
  } = props;

  function handleChannelChange(event: SyntheticInputEvent<*>) {
    const channelClaimId = event.target.value;
    setActiveChannel(channelClaimId);
  }

  return (
    <>
      <FormField
        name="channel"
        label={!tiny && (label || __('Channel'))}
        labelOnLeft={tiny}
        type={tiny ? 'select-tiny' : 'select'}
        onChange={handleChannelChange}
        value={activeChannelClaimId}
        disabled={fetchingChannels}
      >
        {fetchingChannels ? (
          <option>{__('Loading your channels...')}</option>
        ) : (
          <>
            {myChannelClaimIds?.map(({ name, claim_id: claimId }) => (
              <option key={claimId} value={claimId}>
                {name}
              </option>
            ))}
            {injected &&
              injected.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
          </>
        )}
      </FormField>
    </>
  );
}

export default SelectChannel;
