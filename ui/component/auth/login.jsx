import React, { useCallback } from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';

const Login = () => {
  const location = useLocation();
  const currentLocationState = location.state || {
    from: { pathname: '/home' },
  };

  const { keycloak } = useKeycloak();

  const login = useCallback(() => {
    keycloak && keycloak.login().then((x) => console.log('keycloak.login():', x));
  }, [keycloak]);

  if (keycloak && keycloak.authenticated) {
    return <Redirect to={currentLocationState.from} />;
  }

  return (
    <div>
      <button type="button" onClick={login}>
        Login
      </button>
    </div>
  );
};

export default Login;
