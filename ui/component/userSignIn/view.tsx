import React from 'react';
import UserEmailReturning from 'component/userEmailReturning';
import UserSignInPassword from 'component/userSignInPassword';
import Spinner from 'component/spinner';
import { useLocation } from 'react-router-dom';
import { history } from 'redux/router';
type Props = {
  user: User | null | undefined;
  userFetchPending: boolean;
  doUserSignIn: (arg0: string) => void;
  emailToVerify: string | null | undefined;
  passwordExists: boolean;
};

function UserSignIn(props: Props) {
  const location = useLocation();
  const { user, doUserSignIn, userFetchPending, emailToVerify, passwordExists } = props;
  const { search } = location;
  const urlParams = new URLSearchParams(search);
  const [emailOnlyLogin, setEmailOnlyLogin] = React.useState(false);
  const hasVerifiedEmail = user && user.has_verified_email;
  const redirect = urlParams.get('redirect');
  const showLoading = userFetchPending;
  const showEmail = !passwordExists || emailOnlyLogin;
  const showPassword = !showEmail && emailToVerify && passwordExists;
  React.useEffect(() => {
    if (hasVerifiedEmail || (!showEmail && !showPassword && !showLoading)) {
      history.replace(redirect || '/');
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [showEmail, showPassword, showLoading, hasVerifiedEmail]);
  React.useEffect(() => {
    if (emailToVerify && emailOnlyLogin) {
      doUserSignIn(emailToVerify);
    }
  }, [emailToVerify, emailOnlyLogin, doUserSignIn]);
  return (
    <section>
      {(showEmail || showPassword) && (
        <div>
          {showEmail && <UserEmailReturning />}
          {showPassword && <UserSignInPassword onHandleEmailOnly={() => setEmailOnlyLogin(true)} />}
        </div>
      )}
      {!showEmail && !showPassword && showLoading && (
        <div className="main--empty">
          <Spinner delayed />
        </div>
      )}
    </section>
  );
}
export default UserSignIn;
