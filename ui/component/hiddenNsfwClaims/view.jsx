// @flow
import React from 'react';
import Button from 'component/button';
import I18nMessage from 'component/i18nMessage';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import './style.lazy.scss';

type Props = {
  numberOfHiddenClaims: number,
  obscureNsfw: boolean,
  className: ?string,
  mature?: boolean,
};

export default (props: Props) => {
  const { numberOfHiddenClaims: number, obscureNsfw, mature } = props;

  return (
    obscureNsfw && (
      <>
        {number ? (
          <div className="section--padded section__subtitle">
            <I18nMessage
              tokens={{
                content_viewing_preferences_link: (
                  <Button button="link" navigate="/$/settings" label={__('content viewing preferences')} />
                ),
                number: number,
              }}
            >
              {number > 1
                ? '%number% files hidden due to your %content_viewing_preferences_link%'
                : '1 file hidden due to your %content_viewing_preferences_link%'}
            </I18nMessage>
          </div>
        ) : (
          <>
            {mature && (
              <div className="main">
                <div className="info-wrapper">
                  <label>
                    <Icon icon={ICONS.INFO} />
                    {__('Mature content')}
                  </label>
                  <p>
                    <I18nMessage
                      tokens={{
                        download_url: <Button label={__('lbry.com')} button="link" href="https://lbry.com/get" />,
                      }}
                    >
                      You can download the LBRY Desktop or Android app on %download_url% and enable mature content in
                      Settings.
                    </I18nMessage>
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </>
    )
  );
};
