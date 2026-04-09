import React from 'react';
import Yrbl from 'component/yrbl';
import Button from 'component/button';
import analytics from 'analytics';
import I18nMessage from 'component/i18nMessage';
// import Native from 'native';
// import Lbry from 'lbry';
type Props = {
  children: React.ReactNode;
};
type State = {
  hasError: boolean;
  sentryEventId: string | null | undefined;
};

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      sentryEventId: undefined,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    if (this.state.hasError && !prevState.hasError && this.retryCount < 2) {
      this.retryCount++;
      this.retryTimer = setTimeout(() => {
        this.setState({ hasError: false, sentryEventId: undefined });
      }, 500);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.retryTimer);
  }

  private retryTimer: any;
  private retryCount = 0;

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught:', error?.message, error?.stack); // eslint-disable-line no-console
    if (error?.message && /[._]result\.default|reading 'default'|_result is undefined/.test(error.message)) {
      const key = '__staleChunkReload';
      try {
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          window.location.reload();
          return;
        }
      } catch {}
    }
    try {
      sessionStorage.setItem(
        '__errorBoundary',
        JSON.stringify({ message: error?.message, stack: error?.stack?.substring(0, 500) })
      );
    } catch {} // eslint-disable-line no-console
    analytics.sentryError(error, errorInfo).then((sentryEventId) => {
      this.setState({
        sentryEventId,
      });
    });
  }

  refresh = () => {
    // Use replace so the user can't click back to the errored page.
    window.location.replace(window.location.href);
    this.setState({
      hasError: false,
    });
  };

  render() {
    const { hasError } = this.state;
    const { sentryEventId } = this.state;
    const errorWasReported = sentryEventId !== null;

    if (hasError) {
      return (
        <div className="main main--full-width main--empty">
          <Yrbl
            type="sad"
            title={__('Aw shucks!')}
            subtitle={
              <I18nMessage
                tokens={{
                  refreshing_the_app_link: (
                    <Button
                      button="link"
                      className="load-screen__button"
                      label={__('refreshing the app')}
                      onClick={this.refresh}
                    />
                  ),
                }}
              >
                There was an error. Try %refreshing_the_app_link% to fix it. If that doesn't work, try pressing
                Ctrl+R/Cmd+R.
              </I18nMessage>
            }
          />
          {!errorWasReported && (
            <div className="error__wrapper">
              <span className="error__text">
                {__('You are not currently sharing diagnostic data so this error was not reported.')}
              </span>
            </div>
          )}

          {errorWasReported && (
            <div className="error__wrapper">
              <span className="error__text">
                {__('Error ID: %sentryEventId%', {
                  sentryEventId,
                })}
              </span>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
