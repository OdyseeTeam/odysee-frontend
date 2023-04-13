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
const FUTURE_DATE_ERROR = 'Cannot set to a future date.';

type Props = {
  // --- redux:
  claimToEdit: ?StreamClaim,
  releaseTime: ?number,
  releaseTimeDisabled: boolean,
  releaseTimeError: ?string,
  clock24h: boolean,
  appLanguage: ?string,
  updatePublishForm: ({}) => void,
};

const PublishReleaseDate = (props: Props) => {
  const { claimToEdit, releaseTime, releaseTimeDisabled, releaseTimeError, clock24h, appLanguage, updatePublishForm } =
    props;

  const maxDate = new Date();
  const showDefaultBtn = releaseTime !== undefined;
  const showDatePicker = true;
  const isEdit = Boolean(claimToEdit);

  let claimDateStr;
  if (isEdit) {
    const date = new Date((claimToEdit?.value?.release_time || claimToEdit?.timestamp || 0) * 1000);
    claimDateStr = date.toLocaleString(appLanguage || 'en');
  }

  const onDateTimePickerChanged = (value) => {
    const isValueInFuture = maxDate && value && value.getTime() > maxDate.getTime();

    if (isValueInFuture) {
      updatePublishForm({ releaseTimeError: FUTURE_DATE_ERROR });
      return;
    }

    if (value instanceof Date) {
      updatePublishForm({
        releaseTime: dateToLinuxTimestamp(value),
        releaseTimeError: undefined,
      });
    } else {
      // The widget actually doesn't inform us...
      updatePublishForm({ releaseTimeError: 'Invalid date' });
    }
  };

  function newDate(value: string | Date) {
    const changes: UpdatePublishState = {
      releaseTimeError: undefined, // clear
    };

    switch (value) {
      case NOW:
        changes.releaseTime = dateToLinuxTimestamp(new Date());
        break;

      case DEFAULT:
      case RESET_TO_ORIGINAL:
        // PUBLISH.releaseTime() will do the right thing based on various scenarios.
        changes.releaseTime = undefined;
        break;

      default:
        console.assert(false, 'unhandled case'); // eslint-disable-line no-console
        changes.releaseTime = undefined;
        break;
    }

    updatePublishForm(changes);
  }

  function handleBlur(event) {
    if (event.target.name === 'minute' || event.target.name === 'day') {
      const validity = event?.target?.validity;
      if (validity.rangeOverflow || validity.rangeUnderflow) {
        updatePublishForm({ releaseTimeError: event.target.name });
      } else if (releaseTimeError === event.target.name) {
        updatePublishForm({ releaseTimeError: undefined });
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
            locale={appLanguage}
            className="date-picker-input"
            calendarClassName="form-field-calendar"
            onBlur={handleBlur}
            onChange={onDateTimePickerChanged}
            value={releaseTime ? linuxTimestampToDate(releaseTime) : undefined}
            format={clock24h ? 'y-MM-dd HH:mm' : 'y-MM-dd h:mm a'}
            disableClock
            clearIcon={null}
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
        {releaseTimeError && (
          <span className="form-field-date-picker__error">
            <span>{releaseTimeError === FUTURE_DATE_ERROR ? __(FUTURE_DATE_ERROR) : __('Invalid date/time.')}</span>
          </span>
        )}
      </div>
      {claimDateStr && (
        <div className="form-field-date-picker__past-value">{__('Previous:  %date%', { date: claimDateStr })}</div>
      )}
    </div>
  );
};

export default PublishReleaseDate;
