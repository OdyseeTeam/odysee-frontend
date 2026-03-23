import React from 'react';
import classnames from 'classnames';
import Button from 'component/button';
import DatePicker from 'react-datepicker';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import * as SETTINGS from 'constants/settings';
import { selectMyClaimForUri, selectPublishFormValue } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectClientSetting, selectLanguage } from 'redux/selectors/settings';

function linuxTimestampToDate(linuxTimestamp: number) {
  return new Date(linuxTimestamp * 1000);
}

function dateToLinuxTimestamp(date: Date) {
  return Number(Math.round(date.getTime() / 1000));
}

const NOW = 'now';
const DEFAULT = 'default';
const RESET_TO_ORIGINAL = 'reset-to-original';
export type Props = {
  minDate?: Date;
};

const PublishReleaseDate = (props: Props) => {
  const { minDate } = props;
  const dispatch = useAppDispatch();
  const claimToEdit = useAppSelector((state) => selectMyClaimForUri(state));
  const releaseTime = useAppSelector((state) => selectPublishFormValue(state, 'releaseTime'));
  const releaseTimeDisabled = useAppSelector((state) => selectPublishFormValue(state, 'releaseTimeDisabled'));
  const releaseTimeError = useAppSelector((state) => selectPublishFormValue(state, 'releaseTimeError'));
  const clock24h = useAppSelector((state) => selectClientSetting(state, SETTINGS.CLOCK_24H));
  const appLanguage = useAppSelector((state) => selectLanguage(state));
  const updatePublishForm = (value: UpdatePublishState) => dispatch(doUpdatePublishForm(value));
  const showDefaultBtn = releaseTime !== undefined;
  const showDatePicker = true;
  const isEdit = Boolean(claimToEdit);
  let claimDateStr;

  if (isEdit) {
    const date = new Date((claimToEdit?.value?.release_time || claimToEdit?.timestamp || 0) * 1000);
    claimDateStr = date.toLocaleString(appLanguage || 'en');
  }

  const onDateTimePickerChanged = (value: Date | null) => {
    if (value instanceof Date) {
      updatePublishForm({
        releaseTime: dateToLinuxTimestamp(value),
      });
    }
  };

  function newDate(value: string | Date) {
    switch (value) {
      case NOW:
        let newDate = new Date();

        if (minDate && newDate < minDate) {
          newDate = new Date(minDate.getTime());
        }

        updatePublishForm({
          releaseTime: dateToLinuxTimestamp(newDate),
        });
        break;

      case DEFAULT:
      case RESET_TO_ORIGINAL:
        // PAYLOAD.releaseTime() will do the right thing based on various scenarios.
        updatePublishForm({
          releaseTime: undefined,
        });
        break;

      default:
        console.assert(false, 'unhandled case'); // eslint-disable-line no-console

        updatePublishForm({
          releaseTime: undefined,
        });
        break;
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
          <DatePicker
            selected={releaseTime ? linuxTimestampToDate(releaseTime) : null}
            onChange={onDateTimePickerChanged}
            showTimeSelect
            dateFormat={clock24h ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd h:mm aa'}
            timeFormat={clock24h ? 'HH:mm' : 'h:mm aa'}
            className="date-picker-input"
            calendarClassName="form-field-calendar"
            minDate={minDate}
            maxDate={new Date(9999, 11, 31)}
            isClearable={false}
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
        <div className="form-field-date-picker__past-value">
          {__('Previous:  %date%', {
            date: claimDateStr,
          })}
        </div>
      )}
    </div>
  );
};

export default PublishReleaseDate;
