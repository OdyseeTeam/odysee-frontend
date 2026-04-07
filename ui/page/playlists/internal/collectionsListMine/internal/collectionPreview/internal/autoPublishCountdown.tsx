import React from 'react';
type Props = {
  scheduledAt: number;
};

function AutoPublishCountdown(props: Props) {
  const { scheduledAt } = props;
  const [secondsLeft, setSecondsLeft] = React.useState(Math.max(0, Math.ceil((scheduledAt - Date.now()) / 1000)));
  React.useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((scheduledAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [scheduledAt]);
  if (secondsLeft <= 0) return <span>{__('Publishing...')}</span>;
  return (
    <span>
      {__('Publishing in %seconds%s...', {
        seconds: secondsLeft,
      })}
    </span>
  );
}

export default AutoPublishCountdown;
