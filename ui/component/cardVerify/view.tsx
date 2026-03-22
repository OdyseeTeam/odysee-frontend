/* eslint-disable no-undef */

/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from 'component/button';
import { useAppSelector } from 'redux/hooks';
import { selectUserEmail } from 'redux/selectors/user';

let scriptLoading = false;
let scriptLoaded = false;
let scriptDidError = false;
let stripeHandler: any = null;

type Props = {
  disabled?: boolean;
  label?: string;
  stripeKey: string;
  token: string;
};

function CardVerify(props: Props) {
  const { disabled, label, stripeKey, token } = props;

  const email = useAppSelector(selectUserEmail);

  const [open, setOpen] = useState(false);
  const [scriptFailedToLoad, setScriptFailedToLoad] = useState(false);
  const hasPendingClick = useRef(false);
  const loadPromiseRef = useRef<{ promise: Promise<void>; reject: () => void } | null>(null);

  const showStripeDialog = useCallback(() => {
    setOpen(true);
    stripeHandler.open({
      allowRememberMe: false,
      closed: () => setOpen(false),
      description: __('Confirm Identity'),
      email,
      locale: 'auto',
      panelLabel: 'Verify',
      token,
      zipCode: true,
    });
  }, [email, token]);

  const onScriptLoaded = useCallback(() => {
    if (!stripeHandler) {
      stripeHandler = StripeCheckout.configure({
        key: stripeKey,
      });

      if (hasPendingClick.current) {
        showStripeDialog();
      }
    }
  }, [stripeKey, showStripeDialog]);

  const onScriptError = useCallback(() => {
    setScriptFailedToLoad(true);
  }, []);

  useEffect(() => {
    if (scriptLoaded) {
      return;
    }

    if (scriptLoading) {
      return;
    }

    scriptLoading = true;
    const script = document.createElement('script');
    script.src = 'https://checkout.stripe.com/checkout.js';
    script.async = true;

    const loadPromise = (() => {
      let canceled = false;
      const promise = new Promise<void>((resolve, reject) => {
        script.addEventListener('load', () => {
          scriptLoaded = true;
          scriptLoading = false;
          resolve();
        });

        script.addEventListener('error', (event) => {
          scriptDidError = true;
          scriptLoading = false;
          reject(event);
        });
      });
      const wrappedPromise = new Promise<void>((resolve, reject) => {
        promise.then(() =>
          canceled
            ? reject({
                isCanceled: true,
              })
            : resolve()
        );
        promise.catch((error) =>
          canceled
            ? reject({
                isCanceled: true,
              })
            : reject(error)
        );
      });
      return {
        promise: wrappedPromise,
        reject() {
          canceled = true;
        },
      };
    })();

    loadPromiseRef.current = loadPromise;
    loadPromise.promise.then(onScriptLoaded).catch(onScriptError);
    document.body.appendChild(script);

    return () => {
      if (loadPromiseRef.current) {
        loadPromiseRef.current.reject();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount
  }, []);

  useEffect(() => {
    if (!scriptLoading && !stripeHandler) {
      stripeHandler = StripeCheckout.configure({
        key: stripeKey,
      });
    }
  });

  useEffect(() => {
    return () => {
      if (stripeHandler && open) {
        stripeHandler.close();
      }
    };
  }, [open]);

  const handleClick = () => {
    if (scriptDidError) {
      try {
        throw new Error('Tried to call onClick, but StripeCheckout failed to load');
      } catch (x) {}
    } else if (stripeHandler) {
      showStripeDialog();
    } else {
      hasPendingClick.current = true;
    }
  };

  return (
    <div>
      {scriptFailedToLoad && (
        <div className="error__text">There was an error connecting to Stripe. Please try again later.</div>
      )}

      <Button
        button="primary"
        label={label}
        disabled={disabled || open || hasPendingClick.current}
        onClick={handleClick}
      />
    </div>
  );
}

export default CardVerify;
/* eslint-enable no-undef */

/* eslint-enable react/prop-types */
