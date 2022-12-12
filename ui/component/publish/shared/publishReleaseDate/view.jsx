// @flow
import React, { useEffect } from 'react';
import Button from 'component/button';
import Card from 'component/common/card';
import DateTimePicker from 'react-datetime-picker';
import { FormField } from 'component/common/form';
import './style.scss';
import classnames from 'classnames';

function linuxTimestampToDate(linuxTimestamp: number) {
  return new Date(linuxTimestamp * 1000);
}

function dateToLinuxTimestamp(date: Date) {
  return Number(Math.round(date.getTime() / 1000));
}

const NOW = 'now';
const DEFAULT = 'default';
const RESET_TO_PREVIOUS = 'reset-to-original';
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
  isHiddenScheduledContent: boolean,
  isVisibleScheduledContent: boolean,
  publishVisibility: string,
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
    publishVisibility,
    paywall,
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
  const showDefaultBtn = true;
  // const showDatePicker = isEdit || releaseTimeEdited !== undefined;
  const showDatePicker = true;

  const [previousDate, setPreviousDate] = React.useState(undefined);

  const isPaywalled = paywall && paywall !== 'free';

  const contentIsUnlisted = publishVisibility === 'unlisted';

  const shouldDisableInput = contentIsUnlisted || isPaywalled;

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

    newDate(value);
  };

  function newDate(value: string | Date) {
    updateError('clear', FUTURE_DATE_ERROR);

    l('date', date);

    switch (value) {
      case NOW:
        const newDate = new Date();
        setDate(newDate);
        setPreviousDate(dateToLinuxTimestamp(newDate));
        updatePublishForm({ releaseTimeEdited: dateToLinuxTimestamp(newDate) });
        clearFutureReleaseData();
        break;

      case DEFAULT:
        setDate(undefined);
        setPreviousDate(undefined);
        updatePublishForm({ releaseTimeEdited: undefined, releaseTime: undefined });
        clearFutureReleaseData();
        break;

      // reset to previous
      // case RESET_TO_PREVIOUS:
      //   if (previousDate) {
      //     l('previousDate', previousDate);
      //     updatePublishForm({ releaseTimeEdited: linuxTimestampToDate(previousDate) });
      //
      //     setDate(linuxTimestampToDate(previousDate));
      //
      //     clearFutureReleaseData();
      //   } else {
      //     updatePublishForm({ releaseTimeEdited: undefined });
      //   }
      //   break;

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

  /**
   * Clear state to show selection options
   */
  function clearFutureReleaseData() {
    setReleaseDateIsInFuture(false);
    updatePublishForm({
      scheduledContent: undefined,
    });
  }

  useEffect(() => {
    return () => {
      updatePublishForm({ releaseTime: undefined });
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
    <>
      <h2 className="card__title">Custom Release Date</h2>
      <Card
        className={classnames('card--restrictions', {
          'disabledReleaseDate': shouldDisableInput,
        })}
        actions={
          <>
            <h4 style={{ fontSize: '13px', marginBottom: '10px' }}>{__('You can set a future time to use automatic upload scheduling')}</h4>
            <div className="form-field-date-picker">
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
                {/*removing reset button, doesn't seem useful and the logic is strange*/}
                {/*{showDatePicker && previousDate && (*/}
                {/*  <Button*/}
                {/*    button="link"*/}
                {/*    label={__('Reset')}*/}
                {/*    aria-label={__('Reset to original (previous) publish date')}*/}
                {/*    onClick={() => newDate(RESET_TO_PREVIOUS)}*/}
                {/*  />*/}
                {/*)}*/}
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
                    <h2>Do you want to show on your channel page before release?</h2>
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
          </>
        } />
      </>
  );
};

export default PublishReleaseDate;
