import analytics from 'analytics';
import { doToast } from 'redux/actions/notifications';
import { FormField } from 'component/common/form';
import { Lbryio } from 'lbryinc';
import Button from 'component/button';
import Card from 'component/common/card';
import Page from 'component/page';
import React, { useState, useCallback } from 'react';

function ReportPage() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const submitMessage = useCallback(() => {
    if (!message) return;
    setSubmitting(true);
    Lbryio.call('event', 'desktop_error', {
      error_message: `UserFeedback: ${message}`,
    }).then(() => {
      setSubmitting(false);
      const action = doToast({
        message: __('Message received! Thanks for helping.'),
      });
      window.app.store.dispatch(action);
    });
    analytics.log(message.length > 80 ? `${message.slice(0, 80)}…` : message, {
      level: 'info',
      tags: {
        origin: '/$/report',
      },
      extra: {
        message: message,
      },
    });
    setMessage('');
  }, [message]);

  return (
    <Page>
      <div className="card-stack">
        <Card
          title={__('Report an issue or request a feature')}
          subtitle={__(
            'Please describe the problem you experienced or the feature you want to see and any information you think might be useful to us. Links to screenshots are great!'
          )}
          actions={
            <>
              <FormField
                type="textarea"
                rows="10"
                name="message"
                stretch
                value={message}
                onChange={(event: any) => setMessage(event.target.value)}
                placeholder={__('Description of your issue or feature request')}
              />

              <div className="section__actions">
                <Button
                  button="primary"
                  label={submitting ? __('Submitting...') : __('Submit Report')}
                  onClick={submitMessage}
                  className={`button-block button-primary ${submitting ? 'disabled' : ''}`}
                />
              </div>
            </>
          }
        />

        <Card
          title={__('Developer? Or looking for more?')}
          actions={
            <div dir="auto" className="markdown-preview">
              <p>{__('You can also:')}</p>
              <ul>
                <li>
                  <Button
                    button="link"
                    href="https://github.com/OdyseeTeam/odysee-frontend/issues"
                    label={__('Submit an issue on GitHub')}
                  />
                  .
                </li>
              </ul>
            </div>
          }
        />
      </div>
    </Page>
  );
}

export default ReportPage;
