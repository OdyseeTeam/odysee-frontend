import React from 'react';
import { FormField, FormFieldPrice } from 'component/common/form';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectDaemonSettings } from 'redux/selectors/settings';
import { doSetDaemonSetting } from 'redux/actions/settings';
type Price = {
  currency: string;
  amount: number;
};
type SetDaemonSettingArg = boolean | string | number | Price;
type Props = Record<string, never>;
export default function MaxPurchasePrice(props: Props) {
  const dispatch = useAppDispatch();
  const daemonSettings = useAppSelector(selectDaemonSettings);
  const setDaemonSetting = (key: string, value?: SetDaemonSettingArg | null) =>
    dispatch(doSetDaemonSetting(key, value));
  const defaultMaxKeyFee = {
    currency: 'USD',
    amount: 50,
  };
  const disableMaxKeyFee = !(daemonSettings && daemonSettings.max_key_fee);

  function onKeyFeeDisableChange(isDisabled: boolean) {
    if (isDisabled) {
      setDaemonSetting('max_key_fee');
    }
  }

  function onKeyFeeChange(newValue: Price) {
    setDaemonSetting('max_key_fee', newValue);
  }

  return (
    <>
      <FormField
        type="radio"
        name="no_max_purchase_no_limit"
        checked={disableMaxKeyFee}
        label={__('No Limit')}
        onChange={() => onKeyFeeDisableChange(true)}
      />
      <FormField
        type="radio"
        name="max_purchase_limit"
        checked={!disableMaxKeyFee}
        onChange={() => {
          onKeyFeeDisableChange(false);
          onKeyFeeChange(defaultMaxKeyFee);
        }}
        label={__('Choose limit')}
      />

      <FormFieldPrice
        name="max_key_fee"
        min={0}
        onChange={onKeyFeeChange}
        price={daemonSettings.max_key_fee ? daemonSettings.max_key_fee : defaultMaxKeyFee}
        disabled={disableMaxKeyFee}
      />
    </>
  );
}
