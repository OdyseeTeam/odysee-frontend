// @flow
import React from 'react';
import { withRouter } from 'react-router';
import { Redirect } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import Spinner from 'component/spinner';

type Props = {
  history: { push: (string) => void, replace: (string) => void },
  location: { search: string },
};

function UserOAuth(props: Props) {
  const { location } = props;
  const { keycloak, initialized } = useKeycloak();
  const { search } = location;
  const urlParams = new URLSearchParams(search);
  const redirect = urlParams.get('redirect');
  const showLoading = !initialized;

  React.useEffect(() => {
    if (initialized && !keycloak.authenticated) {
      keycloak.login();
    }
  }, [initialized, keycloak]);

  if (keycloak && keycloak.authenticated) {
    return <Redirect to={redirect || '/'} />;
  }

  return (
    <section>
      {showLoading && (
        <div className="main--empty">
          <Spinner delayed />
        </div>
      )}
    </section>
  );
}

export default withRouter(UserOAuth);
