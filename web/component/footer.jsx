import React, { useEffect } from 'react';
import Button from 'component/button';
import { SIMPLE_SITE } from 'config';
import { useLocation } from 'react-router';
import classnames from 'classnames';

export default function Footer() {
  useEffect(() => {
    const maxTimeout = 2000;
    let elapsedTime = 0;

    function checkForOneTrust() {
      elapsedTime = elapsedTime + 500;

      if (elapsedTime > maxTimeout) return;

      if (!window.Optanon) {
        window.setTimeout(checkForOneTrust, 500);
      } else {
        const privacyFooterButton = document.getElementById('gdprPrivacyFooter');
        if (privacyFooterButton) privacyFooterButton.style.display = 'block';
      }
    }

    checkForOneTrust();
  }, []);

  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const isShorts = urlParams.get('view') === 'shorts';

  if (!SIMPLE_SITE) {
    return null;
  }

  return (
    <footer className={classnames('footer', { 'footer--shorts': isShorts })}>
      <ul className="navigation__tertiary footer__links">
        <li className="footer__link">
          <Button
            label={__('Community Guidelines')}
            onClick={() =>
              window.odysee.functions.initBrowser(`https://help.odysee.tv/communityguidelines`, 'external')
            }
            target="_blank"
          />
        </li>
        <li className="footer__link">
          <Button
            label={__('FAQ')}
            onClick={() => window.odysee.functions.initBrowser(`https://help.odysee.tv/`, 'external')}
          />
        </li>
        <li className="footer__link">
          <Button
            label={__('Support --[used in footer; general help/support]--')}
            onClick={() => window.odysee.functions.initBrowser(`https://help.odysee.tv/`, 'external')}
          />
        </li>
        <li className="footer__link">
          <Button label={__('Careers')} onClick={() => window.odysee.functions.history.push('/$/careers')} />
        </li>
        <li className="footer__link">
          <Button label={__('Terms')} onClick={() => window.odysee.functions.history.push('/$/tos')} />
        </li>
        <li className="footer__link">
          <Button
            label={__('Privacy Policy')}
            onClick={() => window.odysee.functions.history.push('/$/privacypolicy')}
          />
        </li>
        <li className="footer__link" id="gdprPrivacyFooter">
          <Button label={__('Cookie Settings')} onClick={() => window.Optanon && window.Optanon.ToggleInfoDisplay()} />
        </li>
      </ul>
    </footer>
  );
}
