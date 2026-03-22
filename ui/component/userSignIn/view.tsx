import React from 'react';
import UserEmailReturning from 'component/userEmailReturning';
import UserSignInPassword from 'component/userSignInPassword';
import Spinner from 'component/spinner';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { selectUser, selectUserIsPending, selectEmailToVerify, selectPasswordExists } from 'redux/selectors/user';
import { doUserSignIn } from 'redux/actions/user';

function UserSignIn() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const userFetchPending = useAppSelector(selectUserIsPending);
  const emailToVerify = useAppSelector(selectEmailToVerify);
  const passwordExists = useAppSelector(selectPasswordExists);
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
      navigate(redirect || '/', { replace: true });
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [hasVerifiedEmail, navigate, redirect, showEmail, showLoading, showPassword]);
  React.useEffect(() => {
    if (emailToVerify && emailOnlyLogin) {
      dispatch(doUserSignIn(emailToVerify));
    }
  }, [emailToVerify, emailOnlyLogin, dispatch]);
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
