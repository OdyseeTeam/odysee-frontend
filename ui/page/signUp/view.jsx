// @flow
import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import Page from 'component/page';
import Spinner from 'component/spinner';
import UserSignUp from 'component/userSignUp';
import * as PAGES from 'constants/icons';

export default function SignUpPage() {
  const { keycloak, initialized } = useKeycloak();

  React.useEffect(() => {
    if (initialized && !keycloak.authenticated) {
      keycloak.register(`/$/${PAGES.SIGN_UP}`);
    }
  }, [initialized, keycloak]);

  return (
    <Page authPage noFooter>
      {!initialized && (
        <div className="main--empty">
          <Spinner delayed />
        </div>
      )}
      {keycloak.authenticated && <UserSignUp />}
    </Page>
  );
}
