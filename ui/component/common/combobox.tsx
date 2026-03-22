import classnames from 'classnames';
import React from 'react';

type ComboboxContextValue = {
  onSelect?: (value: string) => void;
};

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null);

type ComboboxProps = {
  children: React.ReactNode;
  className?: string;
  onSelect?: (value: string) => void;
  openOnFocus?: boolean;
};

function Combobox(props: ComboboxProps) {
  const { children, className, onSelect } = props;
  const value = React.useMemo(() => ({ onSelect }), [onSelect]);

  return (
    <ComboboxContext.Provider value={value}>
      <div className={className} data-reach-combobox="">
        {children}
      </div>
    </ComboboxContext.Provider>
  );
}

type ComboboxInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  selectOnClick?: boolean;
};

const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>((props, forwardedRef) => {
  const { selectOnClick, onFocus, ...inputProps } = props;

  return (
    <input
      {...inputProps}
      ref={forwardedRef}
      data-reach-combobox-input=""
      onFocus={(event) => {
        onFocus?.(event);

        if (selectOnClick) {
          event.currentTarget.select();
        }
      }}
    />
  );
});

ComboboxInput.displayName = 'ComboboxInput';

type ComboboxPopoverProps = {
  children: React.ReactNode;
  className?: string;
  portal?: boolean;
};

function ComboboxPopover(props: ComboboxPopoverProps) {
  const { children, className } = props;

  return (
    <div className={className} data-reach-combobox-popover="">
      {children}
    </div>
  );
}

type ComboboxListProps = {
  children: React.ReactNode;
  className?: string;
};

function ComboboxList(props: ComboboxListProps) {
  const { children, className } = props;

  return (
    <div className={className} role="listbox" data-reach-combobox-list="">
      {children}
    </div>
  );
}

type ComboboxOptionProps = {
  children?: React.ReactNode;
  className?: string;
  value: string;
};

function ComboboxOption(props: ComboboxOptionProps) {
  const { children, className, value } = props;
  const combobox = React.useContext(ComboboxContext);
  const [highlighted, setHighlighted] = React.useState(false);

  function selectValue(event: React.SyntheticEvent) {
    event.preventDefault();
    combobox?.onSelect?.(value);
  }

  return (
    <div
      role="option"
      tabIndex={0}
      className={classnames(className)}
      data-reach-combobox-option=""
      aria-selected={highlighted ? 'true' : 'false'}
      {...(highlighted ? { 'data-highlighted': '' } : {})}
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={() => setHighlighted(true)}
      onMouseLeave={() => setHighlighted(false)}
      onFocus={() => setHighlighted(true)}
      onBlur={() => setHighlighted(false)}
      onClick={selectValue}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          selectValue(event);
        }
      }}
    >
      {children || value}
    </div>
  );
}

export { Combobox, ComboboxInput, ComboboxPopover, ComboboxList, ComboboxOption };
