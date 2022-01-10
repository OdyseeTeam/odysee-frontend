// @flow
import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import Page from 'component/page';
import Spinner from 'component/spinner';

export default function SignUpPage() {
  const { keycloak, initialized } = useKeycloak();

  React.useEffect(() => {
    if (initialized && !keycloak.authenticated) {
      keycloak.register();
    }
  }, [initialized, keycloak]);

  return (
    <Page authPage noFooter>
      {!initialized && (
        <div className="main--empty">
          <Spinner delayed />
        </div>
      )}
    </Page>
  );
}
