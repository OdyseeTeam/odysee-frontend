// @flow
import React, { useEffect } from 'react';
import Button from 'component/button';
import DateTimePicker from 'react-datetime-picker';
import { FormField } from 'component/common/form';
import './style.scss';

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
  allowDefault: ?boolean,
  showNowBtn: ?boolean,
  useMaxDate: ?boolean,
  // --- redux:
  releaseTime: ?number,
  releaseTimeEdited: ?number,
  clock24h: boolean,
  updatePublishForm: ({}) => void,
};

const PublishReleaseDate = (props: Props) => {
  const {
    releaseTime,
    releaseTimeEdited,
    clock24h,
    updatePublishForm,
    allowDefault = true,
    showNowBtn = true,
    useMaxDate = true,
    isHiddenScheduledContent,
    isVisibleScheduledContent,
  } = props;
  const maxDate = useMaxDate ? new Date() : undefined;
  const [date, setDate] = React.useState(releaseTime ? linuxTimestampToDate(releaseTime) : undefined);
  const [error, setError] = React.useState([]);
  const [releaseDateIsInFuture, setReleaseDateIsInFuture] = React.useState(false);
  const [showScheduledOnChannelPage, setShowScheduledOnChannelPage] = React.useState(true);

  const isNew = releaseTime === undefined;
  const isEdit = !isNew || allowDefault === false;

  // const showEditBtn = isNew && releaseTimeEdited === undefined && allowDefault !== false;
  const showEditBtn = false;
  const showDefaultBtn = isNew && releaseTimeEdited !== undefined && allowDefault !== false;
  // const showDatePicker = isEdit || releaseTimeEdited !== undefined;
  const showDatePicker = true;

  const updateError = (action, error) => {
    switch (action) {
      case 'remove':
        setError((prev) => prev.filter((x) => x !== error));
        break;

      case 'clear':
        setError([]);
        break;

      case 'add':
        setError((prev) => {
          const nextError = prev.slice();
          if (!nextError.includes(error)) {
            nextError.push(error);
            return nextError;
          }
          return prev;
        });
        break;
    }
  };

  const onDateTimePickerChanged = (value) => {
    const isValueInFuture = maxDate && value && value.getTime() > maxDate.getTime();

    if (isValueInFuture) {
      setReleaseDateIsInFuture(true);
      setWhetherToShowScheduledContentOnChannelPage(true);
    } else {
      updatePublishForm({ scheduledContent: undefined });
      setReleaseDateIsInFuture(false);
    }

    updateError('remove', FUTURE_DATE_ERROR);

    if (value) {
      newDate(value);
    } else {
      // "!value" should never happen since we now hide the "clear" button,
      // but retained the logic here anyway.
      if (releaseTime) {
        newDate(RESET_TO_ORIGINAL);
      } else {
        newDate(NOW);
      }
    }
  };

  function newDate(value: string | Date) {
    updateError('clear', FUTURE_DATE_ERROR);

    // note: I am not running clearFutureReleaseData() for other options
    // because it doesn't seem they're being used and I'm not sure how they work
    // they may need to be set in the future
    switch (value) {
      case NOW:
        const newDate = new Date();
        setDate(newDate);
        updatePublishForm({ releaseTimeEdited: dateToLinuxTimestamp(newDate) });
        clearFutureReleaseData();
        break;

      case DEFAULT:
        setDate(undefined);
        updatePublishForm({ releaseTimeEdited: undefined });
        clearFutureReleaseData();
        break;

      case RESET_TO_ORIGINAL:
        if (releaseTime) {
          setDate(linuxTimestampToDate(releaseTime));
          updatePublishForm({ releaseTimeEdited: undefined });
        }
        break;

      default:
        if (value instanceof Date) {
          setDate(value);
          updatePublishForm({ releaseTimeEdited: dateToLinuxTimestamp(value) });
        }
        break;
    }
  }

  function handleBlur(event) {
    if (event.target.name === 'minute' || event.target.name === 'day') {
      const validity = event?.target?.validity;
      if (validity.rangeOverflow || validity.rangeUnderflow) {
        updateError('add', event.target.name);
      } else if (error.includes(event.target.name)) {
        updateError('remove', event.target.name);
      }
    }
  }

  // TODO: rename this content
  function setWhetherToShowScheduledContentOnChannelPage(showScheduledContentOnChannelPage) {
    if (showScheduledContentOnChannelPage) {
      setShowScheduledOnChannelPage(true);
      updatePublishForm({
        scheduledContent: 'show',
      });
    } else {
      setShowScheduledOnChannelPage(false);
      updatePublishForm({
        scheduledContent: 'hide',
      });
    }
  }

  function clearFutureReleaseData() {
    setReleaseDateIsInFuture(false);
    updatePublishForm({
      scheduledContent: undefined,
    });
  }

  useEffect(() => {
    return () => {
      updatePublishForm({ releaseTimeEdited: undefined });
      updatePublishForm({ scheduledContent: undefined });
    };
  }, []);

  useEffect(() => {
    if (isVisibleScheduledContent) {
      setReleaseDateIsInFuture(true);
      setWhetherToShowScheduledContentOnChannelPage(true);
    } else if (isHiddenScheduledContent) {
      setReleaseDateIsInFuture(true);
      setWhetherToShowScheduledContentOnChannelPage(false);
    }
  }, [isHiddenScheduledContent, isVisibleScheduledContent]);

  useEffect(() => {
    updatePublishForm({ releaseTimeError: error.join(';') });
  }, [error]);

  return (
    <div className="form-field-date-picker">
      <label>{__('Release date')}</label>
      <div className="form-field-date-picker__controls">
        {showDatePicker && (
          <DateTimePicker
            className="date-picker-input"
            calendarClassName="form-field-calendar"
            onBlur={handleBlur}
            onChange={onDateTimePickerChanged}
            value={date}
            format={clock24h ? 'y-MM-dd HH:mm' : 'y-MM-dd h:mm a'}
            disableClock
            clearIcon={null}
          />
        )}
        {showEditBtn && (
          <Button
            button="link"
            label={__('Edit')}
            aria-label={__('Set custom release date')}
            onClick={() => newDate(NOW)}
          />
        )}
        {showDatePicker && isEdit && releaseTime && (
          <Button
            button="link"
            label={__('Reset')}
            aria-label={__('Reset to original (previous) publish date')}
            onClick={() => newDate(RESET_TO_ORIGINAL)}
          />
        )}
        {showDatePicker && showNowBtn && (
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
            label={__('Default')}
            aria-label={__('Remove custom release date')}
            onClick={() => newDate(DEFAULT)}
          />
        )}
        {error.length > 0 && (
          <span className="form-field-date-picker__error">
            {error.includes(FUTURE_DATE_ERROR) && <span>{__(FUTURE_DATE_ERROR)}</span>}
            {(!error.includes(FUTURE_DATE_ERROR) || error.length > 1) && <span>{__('Invalid date/time.')}</span>}
          </span>
        )}
      </div>
      {releaseDateIsInFuture && (
        <>
          <div className="whether-to-show-scheduled-picker">
            <h2>Do you want to show on your channel page before publish?</h2>
            <FormField
              type="radio"
              name="show-on-channel-page"
              checked={showScheduledOnChannelPage}
              label={__('Show as scheduled upload')}
              onChange={() => setWhetherToShowScheduledContentOnChannelPage(true)}
            />
            <FormField
              type="radio"
              name="hide-on-channel-page"
              checked={!showScheduledOnChannelPage}
              label={__('Hide until publish date')}
              // helper={__(HELP.ONLY_CONFIRM_OVER_AMOUNT)}
              onChange={() => setWhetherToShowScheduledContentOnChannelPage(false)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PublishReleaseDate;
