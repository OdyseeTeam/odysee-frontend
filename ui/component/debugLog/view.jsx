// @flow
import React from 'react';
import classnames from 'classnames';
import Button from 'component/button';
import './style.lazy.scss';

type Props = {
  debugLog: Array<string | Error>,
  doClearDebugLog: () => void,
};

function DebugLog(props: Props) {
  const { debugLog, doClearDebugLog } = props;

  const [show, setShow] = React.useState(false);
  const [count, setCount] = React.useState(0);

  function getMessageElem(info: string | Error) {
    return info instanceof Error || typeof info === 'object' ? <p>{info.message}</p> : <p>{info}</p>;
  }

  function getDataElem(info: string | Error) {
    let cause;

    // $FlowFixMe
    if (info instanceof Error && info.cause) {
      if (info.cause instanceof Error) {
        cause = info.cause.toString();
      } else {
        try {
          cause = JSON.stringify(info.cause, null, 2);
        } catch {}
      }
    }

    return cause ? <pre>{cause}</pre> : null;
  }

  function getStackTraceElem(info: string | Error) {
    if (info instanceof Error && info.stack) {
      const allLines: Array<string> = info.stack.split('\n');
      const lines: Array<string> = allLines.filter((x) => {
        return (
          !x.startsWith('Error: ') &&
          !x.includes('ui/asserts.js') &&
          !x.includes('at doAssert') &&
          !x.includes('at assert') &&
          !x.includes('at eval') &&
          !x.includes('/node_modules/') &&
          !x.includes('bindActionCreators.js')
        );
      });

      return <pre>{lines.slice(0, 3).join('\n')}</pre>;
    }
  }

  React.useEffect(() => {
    if (count !== debugLog.length) {
      setCount(debugLog.length);
      setShow(true);
    }
  }, [count, debugLog]);

  return (
    <div className={classnames('debug-log', { 'debug-log--open': show })}>
      {debugLog.map((x, index) => (
        <div className="debug-log__entry" key={index}>
          {getMessageElem(x)}
          {getDataElem(x)}
          {getStackTraceElem(x)}
        </div>
      ))}
      <div className="debug-log__actions">
        <Button button="link" label={'Clear'} onClick={() => doClearDebugLog()} />
        <Button button="secondary" label={'X'} onClick={() => setShow(false)} />
      </div>
    </div>
  );
}

export default DebugLog;
