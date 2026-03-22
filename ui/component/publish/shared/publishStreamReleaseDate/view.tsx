import React from 'react';
import { FormField } from 'component/common/form';
import DatePicker from 'react-datepicker';

function linuxTimestampToDate(linuxTimestamp: number) {
  return new Date(linuxTimestamp * 1000);
}

function dateToLinuxTimestamp(date: Date) {
  return Number(Math.round(date.getTime() / 1000));
}

function getPlus30MinutesDate() {
  const d = new Date();
  d.setHours(d.getHours() + 1);
  d.setMinutes(d.getMinutes() + 30);
  d.setMinutes(0, 0, 0); // round down to start of hour
  return d;
}

type Props = {
  isScheduled: boolean;
  releaseTime: number | null | undefined;
  clock24h: boolean;
  appLanguage: string | null | undefined;
  updatePublishForm: (arg0: UpdatePublishState) => void;
};

const PublishStreamReleaseDate = (props: Props) => {
  const { isScheduled, releaseTime, clock24h, appLanguage, updatePublishForm } = props;
  const [publishLater, setPublishLater] = React.useState(isScheduled);

  const handleToggle = () => {
    const shouldPublishLater = !publishLater;
    setPublishLater(shouldPublishLater);
    if (shouldPublishLater) {
      updatePublishForm({ releaseTime: dateToLinuxTimestamp(getPlus30MinutesDate()) });
    } else {
      updatePublishForm({ releaseTime: undefined });
    }
  };

  const onDateTimePickerChanged = (value: Date | null) => {
    if (value instanceof Date) {
      updatePublishForm({ releaseTime: dateToLinuxTimestamp(value) });
    }
  };

  const helpText = !publishLater
    ? __(
        'Confirmation process takes a few minutes, but then you can go live anytime. The stream is not shown anywhere until you are broadcasting.'
      )
    : __(
        'Your scheduled streams will appear on your channel page and for your followers. Chat will not be active until 5 minutes before the start time.'
      );

  React.useEffect(() => {
    if (isScheduled) {
      // TODO: this is doPrepareEdit's responsibility, not the component's.
      updatePublishForm({
        releaseTime: dateToLinuxTimestamp(getPlus30MinutesDate()),
      });
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return (
    <>
      <div className="publish-row">
        <label
          htmlFor="date-picker-input"
          style={{
            marginTop: 0,
          }}
        >
          {__('When do you want to go live?')}
        </label>

        <div className={'w-full flex flex-col mt-s md:mt-0 md:h-12 md:items-center md:flex-row'}>
          <FormField
            type="radio"
            name="anytime"
            disabled={false}
            onChange={handleToggle}
            checked={!publishLater}
            label={__('Anytime')}
          />

          <div className={'md:ml-m mt-s md:mt-0'}>
            <FormField
              type="radio"
              name="scheduled_time"
              disabled={false}
              onChange={handleToggle}
              checked={publishLater}
              label={__('Scheduled Time')}
            />
          </div>
          {publishLater && (
            <div className="form-field-date-picker mb-0 controls md:ml-m">
              <DatePicker
                selected={releaseTime ? linuxTimestampToDate(releaseTime) : null}
                onChange={onDateTimePickerChanged}
                showTimeSelect
                dateFormat={clock24h ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd h:mm aa'}
                timeFormat={clock24h ? 'HH:mm' : 'h:mm aa'}
                className="date-picker-input w-full md:w-auto mt-s md:mt-0"
                calendarClassName="form-field-calendar"
                minDate={todayStart}
                maxDate={new Date(9999, 11, 31)}
                isClearable={false}
              />
            </div>
          )}
        </div>

        <p className={'form-field__hint mt-m'}>{helpText}</p>
      </div>
    </>
  );
};

export default PublishStreamReleaseDate;
