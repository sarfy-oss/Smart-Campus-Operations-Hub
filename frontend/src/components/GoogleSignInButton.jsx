import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT_POLL_INTERVAL_MS = 100;
const GOOGLE_SCRIPT_MAX_POLLS = 100;
const DEFAULT_GOOGLE_CLIENT_ID =
  '319826472130-vk7ir9h509knheomr0fv14n5obcgdh6s.apps.googleusercontent.com';
const AUTH_DEBUG_ENABLED =
  process.env.NODE_ENV !== 'production' &&
  process.env.REACT_APP_AUTH_DEBUG === 'true';

/**
 * Renders the Google Identity Services sign-in button and returns an ID token.
 */
const GoogleSignInButton = ({ onSuccess, onError, buttonText = 'signin_with' }) => {
  const buttonRef = useRef(null);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setInitError('Google Sign-In is not configured on this environment.');
      return undefined;
    }

    let cancelled = false;
    let pollCount = 0;

    const renderGoogleButton = () => {
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (AUTH_DEBUG_ENABLED) {
            // eslint-disable-next-line no-console
            console.log('[google] callback fired', {
              hasCredential: !!response?.credential,
            });
          }
          if (!response?.credential) {
            onError?.('Google did not return a valid credential token.');
            return;
          }
          onSuccess?.(response.credential);
        },
      });

      buttonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: buttonText,
        shape: 'rectangular',
      });
    };

    const pollForScript = window.setInterval(() => {
      if (cancelled) {
        return;
      }

      if (window.google?.accounts?.id) {
        window.clearInterval(pollForScript);
        renderGoogleButton();
        return;
      }

      pollCount += 1;
      if (pollCount >= GOOGLE_SCRIPT_MAX_POLLS) {
        window.clearInterval(pollForScript);
        setInitError('Google Sign-In is currently unavailable. Please refresh and try again.');
      }
    }, GOOGLE_SCRIPT_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(pollForScript);
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [buttonText, onError, onSuccess]);

  if (initError) {
    return <p className="google-note google-note-error">{initError}</p>;
  }

  return <div ref={buttonRef} />;
};

export default GoogleSignInButton;
