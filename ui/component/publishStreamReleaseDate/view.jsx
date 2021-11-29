// @flow
import React from 'react';
import { FormField } from 'component/common/form';
import DateTimePicker from 'react-datetime-picker';

function linuxTimestampToDate(linuxTimestamp: number) {
  return new Date(linuxTimestamp * 1000);
}

function dateToLinuxTimestamp(date: Date) {
  return Number(Math.round(date.getTime() / 1000));
}

type Props = {
  releaseTime: ?number,
  releaseTimeEdited: ?number,
  updatePublishForm: ({}) => void,
};
const PublishStreamReleaseDate = (props: Props) => {
  const { releaseTime, updatePublishForm } = props;

  const [date, setDate] = React.useState(releaseTime ? linuxTimestampToDate(releaseTime) : new Date());

  const [publishRightNow, setPublishRightNow] = React.useState(!releaseTime);
  const [publishLater, setPublishLater] = React.useState(Boolean(releaseTime));

  const handleToggle = () => {
    setPublishLater(!publishLater);
    setPublishRightNow(!publishRightNow);
  };

  React.useEffect(() => {
    if (publishRightNow) setDate(new Date());
  }, [publishRightNow]);

  const onDateTimePickerChanged = (value) => {
    updatePublishForm({ releaseTimeEdited: dateToLinuxTimestamp(value) });
    setDate(value);
  };

  const helpText = publishRightNow
    ? __("Requires some wait time. You'll go live soon.")
    : __('Your followers will be notified of the scheduled date and time of your stream.');

  return (
    <div className="">
      <label htmlFor="date-picker-input">{__('When do you want to go live?')}</label>

      <div className={'w-full flex flex-col mt-s md:mt-0 md:h-12 md:items-center md:flex-row'}>
        <FormField
          type="checkbox"
          name="rightNow"
          disabled={false}
          onChange={handleToggle}
          checked={publishRightNow}
          label={__('Right away')}
        />

        <div className={'md:ml-m mt-s md:mt-0'}>
          <FormField
            type="checkbox"
            name="rightNow"
            disabled={false}
            onChange={handleToggle}
            checked={publishLater}
            label={__('At a Later Date')}
          />
        </div>

        {publishLater && (
          <div className="form-field-date-picker mb-0 controls md:ml-m">
            <DateTimePicker
              className="date-picker-input w-full md:w-auto mt-s md:mt-0"
              calendarClassName="form-field-calendar"
              onChange={onDateTimePickerChanged}
              value={date}
              format="y-MM-dd h:mm a"
              disableClock
              clearIcon={null}
              minDate={new Date()}
            />
          </div>
        )}
      </div>

      <p className={'form-field__hint mt-m'}>{helpText}</p>
    </div>
  );
};

export default PublishStreamReleaseDate;
