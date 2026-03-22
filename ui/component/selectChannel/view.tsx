import React from 'react';
import { FormField } from 'component/common/form';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectMyChannelClaims, selectFetchingMyChannels } from 'redux/selectors/claims';
import { selectActiveChannelClaimId } from 'redux/selectors/app';
import { doSetActiveChannel } from 'redux/actions/app';

type Props = {
  tiny?: boolean;
  label?: string;
  injected?: Array<string> | null | undefined;
};

function SelectChannel(props: Props) {
  const { label, injected = [], tiny } = props;
  const dispatch = useAppDispatch();
  const myChannelClaims = useAppSelector(selectMyChannelClaims) || [];
  const fetchingChannels = useAppSelector(selectFetchingMyChannels);
  const activeChannelClaimId = useAppSelector(selectActiveChannelClaimId);

  function handleChannelChange(event: React.SyntheticEvent<any>) {
    const channelClaimId = (event.target as HTMLSelectElement).value;
    dispatch(doSetActiveChannel(channelClaimId));
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
            {myChannelClaims &&
              myChannelClaims.map(({ name, claim_id: claimId }) => (
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
