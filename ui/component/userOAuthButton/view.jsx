// @flow
import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import { useKeycloak } from '@react-keycloak/web';
import Button from 'component/button';
import * as PAGES from 'constants/pages';

type Props = {
  user: ?User,
  authRedirect?: string, // Redirects to '/' by default.
};

export default function UserOAuthButton(props: Props) {
  const { user, authRedirect } = props;
  const { initialized: keycloakReady } = useKeycloak();

  const authRedirectParam = authRedirect ? `?redirect=${authRedirect}` : '';

  return (
    <>
      {!keycloakReady || user === undefined ? (
        <Skeleton variant="text" animation="wave" className="header__navigationItem--balanceLoading" />
      ) : (
        <Button
          navigate={`/$/${PAGES.AUTH_SIGNIN}${authRedirectParam}`}
          button="link"
          label={__('Log In')}
          disabled={user === null}
        />
      )}
    </>
  );
}
