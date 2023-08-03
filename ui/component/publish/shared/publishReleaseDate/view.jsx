// @flow
import React from 'react';
import classnames from 'classnames';

import Button from 'component/button';
import DateTimePicker from 'react-datetime-picker';

function linuxTimestampToDate(linuxTimestamp: number) {
  return new Date(linuxTimestamp * 1000);
}

function dateToLinuxTimestamp(date: Date) {
  return Number(Math.round(date.getTime() / 1000));
}

const NOW = 'now';
const DEFAULT = 'default';
const RESET_TO_ORIGINAL = 'reset-to-original';

export type Props = {|
  minDate?: Date,
|};

type StateProps = {|
  claimToEdit: ?StreamClaim,
  releaseTime: ?number,
  releaseTimeDisabled: boolean,
  releaseTimeError: ?string,
  clock24h: boolean,
  appLanguage: ?string,
|};

type DispatchProps = {|
  updatePublishForm: (UpdatePublishState) => void,
|};

const PublishReleaseDate = (props: Props & StateProps & DispatchProps) => {
  const {
    minDate,
    claimToEdit,
    releaseTime,
    releaseTimeDisabled,
    releaseTimeError,
    clock24h,
    appLanguage,
    updatePublishForm,
  } = props;

  const showDefaultBtn = releaseTime !== undefined;
  const showDatePicker = true;
  const isEdit = Boolean(claimToEdit);

  const [forceRender, setForceRender] = React.useState(0);

  let claimDateStr;
  if (isEdit) {
    const date = new Date((claimToEdit?.value?.release_time || claimToEdit?.timestamp || 0) * 1000);
    claimDateStr = date.toLocaleString(appLanguage || 'en');
  }

  const onDateTimePickerChanged = (value) => {
    if (value instanceof Date) {
      updatePublishForm({ releaseTime: dateToLinuxTimestamp(value) });
    }
  };

  function newDate(value: string | Date) {
    switch (value) {
      case NOW:
        let newDate = new Date();
        if (minDate && newDate < minDate) {
          newDate = new Date(minDate.getTime());
        }
        updatePublishForm({ releaseTime: dateToLinuxTimestamp(newDate) });
        break;

      case DEFAULT:
      case RESET_TO_ORIGINAL:
        // PAYLOAD.releaseTime() will do the right thing based on various scenarios.
        updatePublishForm({ releaseTime: undefined });
        break;

      default:
        console.assert(false, 'unhandled case'); // eslint-disable-line no-console
        updatePublishForm({ releaseTime: undefined });
        break;
    }
  }

  function handleBlur(event) {
    if (event.target.name === 'minute' || event.target.name === 'day') {
      const validity = event?.target?.validity;
      if (validity.rangeOverflow || validity.rangeUnderflow) {
        setForceRender(Date.now());
      } else if (releaseTimeError === event.target.name) {
        setForceRender(Date.now());
      }
    }
  }

  return (
    <div
      className={classnames('form-field-date-picker', {
        'form-field-date-picker--disabled': releaseTimeDisabled,
      })}
    >
      <label>{__('Release date')}</label>
      <div className="form-field-date-picker__controls">
        {showDatePicker && (
          <DateTimePicker
            key={forceRender}
            locale={appLanguage}
            className="date-picker-input"
            calendarClassName="form-field-calendar"
            onBlur={handleBlur}
            onChange={onDateTimePickerChanged}
            value={releaseTime ? linuxTimestampToDate(releaseTime) : undefined}
            format={clock24h ? 'y-MM-dd HH:mm' : 'y-MM-dd h:mm a'}
            disableClock
            clearIcon={null}
            minDate={minDate}
          />
        )}
        {showDatePicker && (
          <Button
            button="link"
            label={__('Now')}
            aria-label={__('Set to current date and time')}
            onClick={() => newDate(NOW)}
          />
        )}
        {showDefaultBtn && (
          <Button
            button="link"
            label={isEdit ? __('Reset') : __('Default')}
            aria-label={isEdit ? __('Reset to original (previous) publish date') : __('Remove custom release date')}
            onClick={() => newDate(DEFAULT)}
          />
        )}
        {releaseTimeError && <span className="form-field-date-picker__error">{releaseTimeError}</span>}
      </div>
      {claimDateStr && (
        <div className="form-field-date-picker__past-value">{__('Previous:  %date%', { date: claimDateStr })}</div>
      )}
    </div>
  );
};

export default PublishReleaseDate;
