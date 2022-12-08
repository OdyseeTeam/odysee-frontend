// @flow
import { getTimeAgoStr } from 'util/time';
import moment from 'moment';
import React from 'react';
import I18nMessage from 'component/i18nMessage';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import './style.scss';

const DEFAULT_MIN_UPDATE_DELTA_MS = 60 * 1000;

type State = {
  lastRenderTime: Date,
};

type Props = {
  clock24h?: boolean,
  date?: any,
  creationDate?: any,
  genericSeconds?: boolean,
  minUpdateDeltaMs?: number,
  showFutureDate?: boolean,
  timeAgo?: boolean,
  type?: string,
  isUnlistedContent?: boolean,
  isPrivateContent?: boolean,
  scheduledContentReleasedInFuture: boolean,
  location: string,
};

class DateTime extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      lastRenderTime: new Date(),
    };
  }

  shouldComponentUpdate(nextProps: Props): boolean {
    if (
      moment(this.props.date).diff(moment(nextProps.date)) !== 0 ||
      this.props.clock24h !== nextProps.clock24h ||
      this.props.timeAgo !== nextProps.timeAgo ||
      this.props.minUpdateDeltaMs !== nextProps.minUpdateDeltaMs ||
      this.props.type !== nextProps.type
    ) {
      return true;
    }

    if (this.props.timeAgo && nextProps.timeAgo) {
      const minUpdateDeltaMs = this.props.minUpdateDeltaMs || DEFAULT_MIN_UPDATE_DELTA_MS;
      const prev = moment(this.state.lastRenderTime);
      const curr = moment(new Date());
      const deltaMs = curr.diff(prev);

      if (deltaMs > minUpdateDeltaMs) {
        return true;
      }
    }

    return false;
  }

  componentDidUpdate() {
    const { timeAgo } = this.props;

    if (timeAgo) this.setState({ lastRenderTime: new Date() });
  }

  render() {
    const {
      // redux
      clock24h,
      creationDate,
      date,
      isPrivateContent,
      isUnlistedContent,
      scheduledContentReleasedInFuture,
      // passed
      genericSeconds,
      location,
      showFutureDate,
      timeAgo,
      type,
    } = this.props;

    const clockFormat = clock24h ? 'HH:mm' : 'hh:mm A';

    // TODO: turn this into a function
    let timeToUse = '...';
    let scheduleTimeShortened, fullScheduledTime;
    if (date) {
      if (timeAgo) {
        timeToUse = getTimeAgoStr(date, showFutureDate, genericSeconds);
      } else {
        if (type === 'date') {
          timeToUse = moment(date).format('MMMM Do, YYYY');
        } else {
          timeToUse = moment(date).format(clockFormat);
        }
      }
    }

    function getMomentDateString({ onContentPage, sameYear }){
      if (onContentPage && sameYear) {
        return 'MMMM Do, hh:mm A';
      }
      if (onContentPage && !sameYear) {
        return 'MMMM Do YYYY, hh:mm A';
      }

      if (!onContentPage && sameYear) {
        return 'MMMM Do';
      }

      if (!onContentPage && !sameYear) {
        return 'MMMM Do, YYYY';
      }

      throw Error('no format string');
    }

    if (scheduledContentReleasedInFuture) {
      const now = moment(date); // release date
      const end = moment(new Date()); // today's date
      const duration = moment.duration(now.diff(end));
      const howManyHoursUntilUpload = Math.ceil(duration.asHours());

      // show as 'Available in x hours'
      if (howManyHoursUntilUpload < 24) {
        let hoursText = 'hours';
        if (howManyHoursUntilUpload === 1) {
          hoursText = 'hour';
        }
        timeToUse = `Available in ${howManyHoursUntilUpload} ${hoursText}`;
      } else {
        // Test if the two dates are in the same calendar year
        let sameYear = now.isSame(end, 'year');

        const onContentPage = location === 'contentPage';

        const formatString = getMomentDateString({ onContentPage, sameYear});

        timeToUse = moment(date).format(formatString);
        fullScheduledTime = (
          <I18nMessage
            className="scheduled_time--long"
            tokens={{
              timeToUse,
            }}
          >
            Scheduled for %timeToUse%
          </I18nMessage>
        );
        scheduleTimeShortened = (
          <I18nMessage
            className="scheduled_time--short"
            tokens={{
              timeToUse,
              clockIcon: <Icon icon={ICONS.TIME} />,
            }}
          >
            %clockIcon% %timeToUse%
          </I18nMessage>
        );
      }
    }

    // use creation date instead of release time for unlisted/private
    if (isUnlistedContent || isPrivateContent) {
      timeToUse = moment(creationDate).format('MMMM Do, YYYY');
    }

    return (
      <>
        <span className="date_time" title={timeAgo && moment(date).format(`MMMM Do, YYYY ${clockFormat}`)}>
          {fullScheduledTime || timeToUse}
        </span>
        <span className="date_time_shortened" title={timeAgo && moment(date).format(`MMMM Do, YYYY ${clockFormat}`)}>
          {scheduleTimeShortened || timeToUse}
        </span>
      </>
    );
  }
}

export default DateTime;
