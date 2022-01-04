// @flow
import { SITE_NAME, SITE_HELP_EMAIL } from 'config';
import * as ICONS from 'constants/icons';
import * as React from 'react';
import Lbry from 'lbry';
import Button from 'component/button';
import Page from 'component/page';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';

type Props = {
  accessToken: string,
  fetchAccessToken: () => void,
  doAuth: () => void,
  user: any,
};

type VersionInfo = {
  os_system: string,
  os_release: string,
  platform: string,
  lbrynet_version: string,
};

type State = {
  versionInfo: VersionInfo | any,
  lbryId: String | any,
  uiVersion: ?string,
  upgradeAvailable: ?boolean,
  accessTokenHidden: ?boolean,
};

class HelpPage extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      versionInfo: null,
      lbryId: null,
      uiVersion: null,
      upgradeAvailable: null,
      accessTokenHidden: true,
    };

    (this: any).showAccessToken = this.showAccessToken.bind(this);
  }

  componentDidMount() {
    Lbry.version().then((info) => {
      this.setState({
        versionInfo: info,
      });
    });
    Lbry.status().then((info) => {
      this.setState({
        lbryId: info.installation_id,
      });
    });
  }

  showAccessToken() {
    this.setState({
      accessTokenHidden: false,
    });
  }

  render() {
    return (
      <Page className="card-stack">
        <Card
          title={__('Visit the %SITE_NAME% Help Hub', { SITE_NAME })}
          subtitle={__('Our support posts answer many common questions.')}
          actions={
            <div className="section__actions">
              <Button
                href="https://odysee.com/@OdyseeHelp:b"
                label={__('View %SITE_NAME% Help Hub', { SITE_NAME })}
                icon={ICONS.HELP}
                button="secondary"
              />
            </div>
          }
        />

        <Card
          title={__('Find assistance')}
          subtitle={
            <I18nMessage tokens={{ channel: <strong>#help</strong>, help_email: SITE_HELP_EMAIL }}>
              Live help is available most hours in the %channel% channel of our Discord chat room. Or you can always
              email us at %help_email%.
            </I18nMessage>
          }
          actions={
            <div className="section__actions">
              <Button
                button="secondary"
                label={__('Join the Foundation Chat')}
                icon={ICONS.CHAT}
                href="https://chat.lbry.com"
              />
              <Button button="secondary" label={__('Email Us')} icon={ICONS.WEB} href={`mailto:${SITE_HELP_EMAIL}`} />
            </div>
          }
        />

        <Card
          title={__('Report a bug or suggest something')}
          subtitle={
            <React.Fragment>
              {__('Did you find something wrong? Think Odysee could add something useful and cool?')}
            </React.Fragment>
          }
          actions={
            <div className="section__actions">
              <Button navigate="/$/report" label={__('Submit Feedback')} icon={ICONS.FEEDBACK} button="secondary" />
            </div>
          }
        />
      </Page>
    );
  }
}

export default HelpPage;
