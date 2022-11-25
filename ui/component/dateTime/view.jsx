// @flow
import { getTimeAgoStr } from 'util/time';
import moment from 'moment';
import React from 'react';
import I18nMessage from 'component/i18nMessage';

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
      showFutureDate,
      timeAgo,
      type,
    } = this.props;

    const clockFormat = clock24h ? 'HH:mm' : 'hh:mm A';

    // TODO: turn this into a function
    let timeToUse = '...';
    if (date) {
      if (timeAgo) {
        if (scheduledContentReleasedInFuture) {
          timeToUse = moment(date).format('MMMM Do, YYYY');
        } else {
          timeToUse = getTimeAgoStr(date, showFutureDate, genericSeconds);
        }
      } else {
        if (type === 'date') {
          timeToUse = moment(date).format('MMMM Do, YYYY');
        } else {
          timeToUse = moment(date).format(clockFormat);
        }
      }
    }

    // use creation date instead of release time for unlisted/private
    if (isUnlistedContent || isPrivateContent) {
      timeToUse = moment(creationDate).format('MMMM Do, YYYY');
    }

    let textToShow = timeToUse;

    // change frontend text to "Scheduled for $date"
    if (scheduledContentReleasedInFuture) {
      textToShow = (
        <I18nMessage
          tokens={{
            timeToUse,
          }}
        >
          Scheduled for %timeToUse%
        </I18nMessage>
      );
    }

    return (
      <span className="date_time" title={timeAgo && moment(date).format(`MMMM Do, YYYY ${clockFormat}`)}>
        {textToShow}
      </span>
    );
  }
}

export default DateTime;
