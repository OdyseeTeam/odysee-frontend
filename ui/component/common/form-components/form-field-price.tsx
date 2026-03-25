import React, { useState, useCallback } from 'react';
import { FormField } from './form-field';
type FormPrice = {
  amount: number;
  currency: string;
};
type Props = {
  price: FormPrice;
  onChange: (arg0: FormPrice) => void;
  onBlur?: (arg0: any) => void;
  placeholder?: number;
  min: number;
  disabled?: boolean;
  name: string;
  step?: number;
  currencies?: Array<'LBC' | CurrencyOption>;
};
const DEFAULT_CURRENCIES = Object.freeze(['LBC']);
const CURRENCY_LABELS = Object.freeze({
  LBC: 'LBRY Credits',
  USD: 'US Dollars',
  EUR: 'Euros',
});

export function FormFieldPrice({ price, onChange, onBlur, placeholder, min, disabled, name, step, currencies }: Props) {
  const [amount, setAmount] = useState(price.amount);

  const handleAmountChange = useCallback(
    (event: React.SyntheticEvent<any>) => {
      const target = event.target as any;
      setAmount(parseFloat(target.value));
      const newAmount = target.value ? parseFloat(target.value) : 0;
      onChange({ currency: price.currency, amount: newAmount });
    },
    [onChange, price.currency]
  );

  const handleCurrencyChange = useCallback(
    (event: React.SyntheticEvent<any>) => {
      onChange({ currency: (event.target as any).value, amount: price.amount });
    },
    [onChange, price.amount]
  );

  return (
    <fieldset-group class="fieldset-group--smushed">
      <FormField
        name={`${name}_amount`}
        label={__('Price')}
        type="number"
        className="form-field--price-amount"
        min={min}
        value={price.amount || amount}
        onWheel={(e: any) => e.preventDefault()}
        onChange={handleAmountChange}
        onBlur={onBlur}
        placeholder={placeholder || 5}
        disabled={disabled}
        step={step || 'any'}
      />
      <FormField
        label={__('Currency')}
        name={`${name}_currency`}
        type="select"
        id={`${name}_currency`}
        className="input--currency-select currency-fix"
        disabled={disabled}
        onChange={handleCurrencyChange}
        value={price.currency}
      >
        {(currencies || DEFAULT_CURRENCIES).map((c) => (
          <option key={c} value={c}>
            {__(CURRENCY_LABELS[c] || c)}
          </option>
        ))}
      </FormField>
    </fieldset-group>
  );
}
export default FormFieldPrice;
